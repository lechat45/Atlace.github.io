/**
 * Line-based LCS diff — returns an array of {type, line} objects.
 * type: 'equal' | 'add' | 'del'
 */
export function diffLines(oldText, newText) {
  const A = (oldText || '').split('\n')
  const B = (newText || '').split('\n')
  const n = A.length, m = B.length

  // Guard: identical
  if (oldText === newText) return A.map(line => ({ type: 'equal', line }))

  // Guard: too large — skip LCS, show full replace
  if (n * m > 120_000) {
    return [
      ...A.map(line => ({ type: 'del', line })),
      ...B.map(line => ({ type: 'add', line })),
    ]
  }

  // LCS DP table
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = A[i - 1] === B[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack
  const result = []
  let i = n, j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1]) {
      result.unshift({ type: 'equal', line: A[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', line: B[j - 1] })
      j--
    } else {
      result.unshift({ type: 'del', line: A[i - 1] })
      i--
    }
  }
  return result
}

/** Count added/deleted lines in a diff array */
export function countChanges(diff) {
  return diff.reduce(
    (acc, d) => ({
      added:   acc.added   + (d.type === 'add' ? 1 : 0),
      deleted: acc.deleted + (d.type === 'del' ? 1 : 0),
    }),
    { added: 0, deleted: 0 }
  )
}

/** True if there is at least one add or del */
export function hasDiff(diff) {
  return diff.some(d => d.type !== 'equal')
}

/** Extract code from a markdown code block; return raw text otherwise */
export function extractCode(text) {
  const m = (text || '').match(/```(?:\w+)?\n?([\s\S]*?)```/)
  return m ? m[1].trimEnd() : (text || '').trim()
}
