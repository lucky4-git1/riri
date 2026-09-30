/**
 * Semantic Scorer
 * 
 * Quantifies semantic preservation between original and transformed text (0 to 1).
 */

export class SemanticScorer {
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  ]);

  /**
   * Score semantic preservation between original and transformed text
   */
  score(original: string, transformed: string): number {
    const origWords = this.getContentWords(original);
    const transWords = this.getContentWords(transformed);

    if (origWords.length === 0 && transWords.length === 0) return 1.0;
    if (origWords.length === 0 || transWords.length === 0) return 0.0;

    // 1. Content word overlap (weighted Jaccard)
    const origSet = new Set(origWords);
    const transSet = new Set(transWords);

    let intersectionCount = 0;
    for (const w of origSet) {
      if (transSet.has(w)) intersectionCount++;
    }

    const unionCount = new Set([...origWords, ...transWords]).size;
    const jaccard = unionCount > 0 ? intersectionCount / unionCount : 1.0;

    // 2. Length symmetry factor (penalize extreme length variations)
    const lenRatio = Math.min(original.length, transformed.length) / Math.max(original.length, transformed.length, 1);

    // 3. Substring coverage: what fraction of original content words still exist in transformed
    const coverage = origSet.size > 0 ? intersectionCount / origSet.size : 1.0;

    // Weighted composite score
    const score = 0.5 * coverage + 0.3 * jaccard + 0.2 * lenRatio;
    return Math.max(0, Math.min(1, score));
  }

  private getContentWords(text: string): string[] {
    const tokens = text.toLowerCase().match(/[\w']+/g) || [];
    return tokens.filter(t => t.length > 2 && !SemanticScorer.STOP_WORDS.has(t));
  }
}

export function createSemanticScorer(): SemanticScorer {
  return new SemanticScorer();
}
