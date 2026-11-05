import type { BugPack } from '../../types/BugPack'

const pack: BugPack = {
  id: 'off-by-one',
  order: 2,

  monster: {
    name: 'Off-by-One',
    fileLabel: 'pagination.js',
    behaviour:
      'Always stops exactly one tile short of its waypoint, then reverses. Never quite arrives.',
  },

  hints: [
    // Level 1 — location
    'Look at the loop condition in getPage.',
    // Level 2 — type
    'The loop runs one iteration too many. Arrays are zero-indexed.',
    // Level 3 — solution
    'Change i <= end to i < end, or slice with end exclusive: items.slice(start, end).',
  ],

  autopsy: {
    what: 'Loop ran past the last valid index, including one extra item per page.',
    impact: 'Users see a duplicate item at the top of every page after the first.',
    fix: 'Use `items.slice(start, end)` — slice end is exclusive, no off-by-one possible.',
  },

  morning: {
    question: 'Pagination was returning an extra item on every page. What was wrong?',
    answers: [
      {
        text: 'The sort order was reversed.',
        level: null,
      },
      {
        text: 'The loop ran one index too far — off-by-one on the upper boundary.',
        level: 'senior',
      },
      {
        text: 'The page size was read from the wrong config key.',
        level: null,
      },
    ],
    correct: 1,
  },

  brokenCode: `// pagination.js
// Bug: loop boundary is off by one — includes one extra item per page.

function getPage(items, page, pageSize) {
  const start = page * pageSize
  const end = start + pageSize
  const result = []
  for (let i = start; i <= end; i++) {
    result.push(items[i])
  }
  return result
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
    toEqual(expected) {
      const a = JSON.stringify(val)
      const b = JSON.stringify(expected)
      if (a !== b) throw new Error('Expected ' + b + ', got ' + a)
    },
    toHaveLength(n) {
      if (!val || val.length !== n)
        throw new Error('Expected length ' + n + ', got ' + (val ? val.length : 'null'))
    },
  }
}

const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

test('first page returns exactly pageSize items', () => {
  expect(getPage(items, 0, 3)).toHaveLength(3)
})

test('first page returns items 0, 1, 2', () => {
  expect(getPage(items, 0, 3)).toEqual([0, 1, 2])
})

test('second page returns items 3, 4, 5', () => {
  expect(getPage(items, 1, 3)).toEqual([3, 4, 5])
})

test('last page does not include undefined', () => {
  const last = getPage(items, 3, 3)
  const hasUndefined = last.some(x => x === undefined)
  if (hasUndefined) throw new Error('Page contains undefined — loop went past array end')
})
`,

  solutionCode: `// pagination.js
function getPage(items, page, pageSize) {
  const start = page * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}
`,
}

export default pack
