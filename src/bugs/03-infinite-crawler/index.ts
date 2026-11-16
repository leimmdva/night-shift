import type { BugPack } from '../../types/BugPack'

const pack: BugPack = {
  id: 'infinite-crawler',
  order: 3,

  monster: {
    name: 'Infinite Crawler',
    fileLabel: 'retry.js',
    behaviour:
      'Walks the same patrol loop endlessly, never stopping. Speed never changes.',
  },

  hints: [
    // Level 1 — location
    'Look at the while loop inside retry.',
    // Level 2 — type
    'The counter that should end the loop is never updated.',
    // Level 3 — solution
    'Add attempts++ inside the loop body so it eventually reaches maxAttempts.',
  ],

  autopsy: {
    what: 'The retry counter was never incremented — the loop ran forever.',
    impact: 'Any failed network call caused the browser tab to hang indefinitely.',
    fix: 'Increment the counter inside the loop: `attempts++`.',
  },

  morning: {
    question: 'A payment request was hanging the page forever. Root cause?',
    answers: [
      {
        text: 'The retry counter was never incremented — infinite loop.',
        level: 'senior',
      },
      {
        text: 'The server returned a 500 and the client did not handle it.',
        level: null,
      },
      {
        text: 'The network timeout was set too high.',
        level: null,
      },
    ],
    correct: 0,
  },

  brokenCode: `// retry.js

function retry(fn, maxAttempts) {
  let attempts = 0
  let lastError
  while (attempts < maxAttempts) {
    try {
      return fn()
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}
`,

  testCode: `const __testResults__ = []

function test(name, fn) {
  try {
    fn()
    __testResults__.push({ name, ok: true })
  } catch (e) {
    __testResults__.push({ name, ok: false, error: e.message })
  }
}

function expect(val) {
  return {
    toBe(expected) {
      if (val !== expected)
        throw new Error('Expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(val))
    },
    toThrow() {
      // used as a marker — actual throw checked in test body
    },
  }
}

test('returns value when fn succeeds on first try', () => {
  const result = retry(() => 42, 3)
  if (result !== 42) throw new Error('Expected 42, got ' + result)
})

test('retries and succeeds on second attempt', () => {
  let calls = 0
  const result = retry(() => {
    calls++
    if (calls < 2) throw new Error('not yet')
    return 'ok'
  }, 3)
  if (result !== 'ok') throw new Error('Expected ok, got ' + result)
})

test('throws after maxAttempts are exhausted', () => {
  let calls = 0
  // We use a call limit to avoid hanging if the bug is present
  let threw = false
  try {
    retry(() => {
      calls++
      if (calls > 10) throw new Error('guard: too many calls — counter not incrementing')
      throw new Error('always fails')
    }, 3)
  } catch (e) {
    threw = true
    if (e.message.includes('guard')) throw e
  }
  if (!threw) throw new Error('Expected retry to throw after maxAttempts')
})

test('calls fn exactly maxAttempts times on total failure', () => {
  let calls = 0
  try {
    retry(() => { calls++; throw new Error('fail') }, 3)
  } catch (_) {}
  if (calls !== 3) throw new Error('Expected 3 calls, got ' + calls)
})
`,

  solutionCode: `// retry.js
function retry(fn, maxAttempts) {
  let attempts = 0
  let lastError
  while (attempts < maxAttempts) {
    try {
      return fn()
    } catch (e) {
      lastError = e
      attempts++
    }
  }
  throw lastError
}
`,
}

export default pack
