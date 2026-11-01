#!/usr/bin/env node
/**
 * validate-pack.js
 *
 * Validates one or all bug packs in src/bugs/.
 * Usage:
 *   node scripts/validate-pack.js                  # all packs
 *   node scripts/validate-pack.js 01-null-ghost    # one pack
 *
 * Exit code 0 = all packs valid
 * Exit code 1 = one or more packs failed
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { Worker } from 'worker_threads'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BUGS_DIR = join(__dirname, '..', 'src', 'bugs')

// ── helpers ────────────────────────────────────────────────────────────────

function listPackFolders() {
  return readdirSync(BUGS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

/**
 * Run testCode against subjectCode in a worker_threads Worker.
 * Returns { passed, results, error }.
 */
function runInWorker(subjectCode, testCode) {
  return new Promise((resolve) => {
    const src = `
      import { parentPort } from 'worker_threads'
      const __testResults__ = []
      function test(name, fn) {
        try { fn(); __testResults__.push({ name, ok: true }) }
        catch (e) { __testResults__.push({ name, ok: false, error: e.message }) }
      }
      function expect(val) {
        return {
          toBe(exp) { if (val !== exp) throw new Error('Expected ' + JSON.stringify(exp) + ', got ' + JSON.stringify(val)) },
          toBeNull() { if (val !== null) throw new Error('Expected null, got ' + JSON.stringify(val)) },
          toBeTruthy() { if (!val) throw new Error('Expected truthy, got ' + JSON.stringify(val)) },
        }
      }
      try {
        ${subjectCode}
        ${testCode}
        parentPort.postMessage({ results: __testResults__, error: null })
      } catch (e) {
        parentPort.postMessage({ results: __testResults__, error: e.message })
      }
    `

    const worker = new Worker(src, { eval: true })
    const timer = setTimeout(() => {
      worker.terminate()
      resolve({ passed: false, results: [], error: 'timeout' })
    }, 5000)

    worker.on('message', ({ results, error }) => {
      clearTimeout(timer)
      worker.terminate()
      const passed = !error && results.every((r) => r.ok)
      resolve({ passed, results, error })
    })

    worker.on('error', (e) => {
      clearTimeout(timer)
      worker.terminate()
      resolve({ passed: false, results: [], error: e.message })
    })
  })
}

// ── validation ─────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'id', 'order', 'monster', 'hints', 'autopsy', 'morning',
  'brokenCode', 'testCode', 'solutionCode',
]

async function validatePack(folderName) {
  const errors = []
  const warnings = []
  const folderPath = join(BUGS_DIR, folderName)

  // 1. Load index.ts via tsx/esbuild-register — we use dynamic import on the
  //    compiled output. Since we're in plain Node we read and eval the JS fields
  //    directly from the source as a workaround (TypeScript stripped by regex).
  let pack
  try {
    const src = readFileSync(join(folderPath, 'index.ts'), 'utf8')
    // Strip TypeScript: remove `import type ...` lines and type annotations
    const js = src
      .replace(/^import type.*$/gm, '')
      .replace(/^import\s+.*$/gm, '')
      .replace(/:\s*BugPack/g, '')
      .replace(/:\s*\[string, string, string\]/g, '')
      .replace(/:\s*\[MorningAnswer, MorningAnswer, MorningAnswer\]/g, '')
      .replace(/:\s*'mid'\s*\|\s*'senior'\s*\|\s*'staff'\s*\|\s*null/g, '')
      .replace(/:\s*0\s*\|\s*1\s*\|\s*2/g, '')
      .replace(/export default pack/, 'pack')

    // eslint-disable-next-line no-new-func
    pack = new Function(`${js}; return pack`)()
  } catch (e) {
    return { folderName, ok: false, errors: [`Failed to parse index.ts: ${e.message}`], warnings }
  }

  // 2. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (pack[field] === undefined || pack[field] === null) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // 3. id matches folder name (strip leading NN- prefix)
  const expectedId = folderName.replace(/^\d+-/, '')
  if (pack.id && pack.id !== expectedId) {
    errors.push(`id "${pack.id}" does not match folder name "${folderName}" (expected "${expectedId}")`)
  }

  // 4. hints: exactly 3
  if (!Array.isArray(pack.hints) || pack.hints.length !== 3) {
    errors.push(`hints must have exactly 3 entries (found ${Array.isArray(pack.hints) ? pack.hints.length : 'none'})`)
  } else {
    // Warn on long hints
    pack.hints.forEach((h, i) => {
      if (h.length > 120) warnings.push(`hints[${i}] is ${h.length} chars (max recommended: 120)`)
    })
  }

  // 5. morning.answers: exactly 3, correct in range
  if (pack.morning) {
    if (!Array.isArray(pack.morning.answers) || pack.morning.answers.length !== 3) {
      errors.push(`morning.answers must have exactly 3 entries`)
    }
    if (![0, 1, 2].includes(pack.morning.correct)) {
      errors.push(`morning.correct must be 0, 1, or 2 (found ${pack.morning.correct})`)
    }
  }

  // Stop here if structural errors
  if (errors.length > 0) {
    return { folderName, ok: false, errors, warnings }
  }

  // 6. Run tests against brokenCode — at least one must FAIL
  const brokenRun = await runInWorker(pack.brokenCode, pack.testCode)
  const brokenFailCount = brokenRun.results.filter((r) => !r.ok).length

  if (brokenRun.error && brokenRun.error !== 'timeout') {
    // A crash on broken code is fine (bug might cause a throw) — counts as failure
  } else if (brokenFailCount === 0 && !brokenRun.error) {
    errors.push(`brokenCode passes all tests — the bug is not present`)
  }

  // 7. Run tests against solutionCode — all must PASS
  const solvedRun = await runInWorker(pack.solutionCode, pack.testCode)
  const solvedPassCount = solvedRun.results.filter((r) => r.ok).length
  const solvedTotal = solvedRun.results.length

  if (solvedRun.error) {
    errors.push(`solutionCode threw an error: ${solvedRun.error}`)
  } else if (solvedPassCount < solvedTotal) {
    const failing = solvedRun.results.filter((r) => !r.ok).map((r) => r.name)
    errors.push(`solutionCode fails tests: ${failing.join(', ')}`)
  }

  const ok = errors.length === 0

  // Summary line
  const brokenLabel = brokenRun.error
    ? `error (counts as fail)`
    : `${brokenFailCount}/${brokenRun.results.length} fail`
  const solvedLabel = solvedRun.error
    ? `error`
    : `${solvedPassCount}/${solvedTotal} pass`

  return { folderName, ok, brokenLabel, solvedLabel, errors, warnings }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const arg = process.argv[2]
  const folders = arg ? [arg] : listPackFolders()

  let allOk = true

  for (const folder of folders) {
    const result = await validatePack(folder)

    if (result.ok) {
      console.log(`✓ ${result.folderName.padEnd(24)} broken:${result.brokenLabel}  solution:${result.solvedLabel}`)
    } else {
      allOk = false
      console.log(`✗ ${result.folderName}`)
      for (const e of result.errors) console.log(`  ERROR: ${e}`)
    }

    for (const w of result.warnings) {
      console.log(`  WARN:  ${w}`)
    }
  }

  if (!allOk) {
    console.log('\nOne or more packs failed validation.')
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
