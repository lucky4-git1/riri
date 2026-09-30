function wordDiff(original, modified) {
  const origWords = original.split(/(\s+|[.,!?;:()[\]{}'"]+)/).filter(Boolean);
  const modWords = modified.split(/(\s+|[.,!?;:()[\]{}'"]+)/).filter(Boolean);

  // Simple LCS DP table
  const n = origWords.length;
  const m = modWords.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origWords[i - 1].toLowerCase() === modWords[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = n, j = m;
  const result = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1].toLowerCase() === modWords[j - 1].toLowerCase()) {
      result.unshift({ type: 'same', text: modWords[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: modWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  return result;
}

const orig = "The characteristics of a polyherbal combination called BASANT, which guards against HIV";
const mod = "The traits of a polyherbal blend called BASANT, which shields against HIV";

const diff = wordDiff(orig, mod);
console.log(diff.filter(d => d.type !== 'same'));
