function wordDiffHtml(original, modified) {
  const origTokens = original.split(/(\s+|[.,!?;:()[\]{}'"]+)/).filter(Boolean);
  const modTokens = modified.split(/(\s+|[.,!?;:()[\]{}'"]+)/).filter(Boolean);

  const n = origTokens.length;
  const m = modTokens.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origTokens[i - 1].toLowerCase() === modTokens[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n, j = m;
  const diff = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1].toLowerCase() === modTokens[j - 1].toLowerCase()) {
      diff.unshift({ type: 'same', text: modTokens[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'added', text: modTokens[j - 1] });
      j--;
    } else {
      diff.unshift({ type: 'removed', text: origTokens[i - 1] });
      i--;
    }
  }

  // Construct highlighted HTML
  let html = '';
  let lastRemoved = '';
  let changeCount = 0;

  for (let k = 0; k < diff.length; k++) {
    const item = diff[k];
    if (item.type === 'removed') {
      if (item.text.trim()) {
        lastRemoved = item.text;
      }
    } else if (item.type === 'added') {
      if (!/^\s+$/.test(item.text)) {
        changeCount++;
        const tooltip = lastRemoved ? `Replaced from: "${lastRemoved}"` : 'Added / modified';
        html += `<mark class="diff-highlight" title="${tooltip}">${item.text}</mark>`;
        lastRemoved = '';
      } else {
        html += item.text;
      }
    } else {
      html += item.text;
      lastRemoved = '';
    }
  }

  return { html, changeCount };
}

const orig = "The characteristics of a polyherbal combination called BASANT, which guards against HIV";
const mod = "The traits of a polyherbal blend called BASANT, which shields against HIV";
console.log(wordDiffHtml(orig, mod));
