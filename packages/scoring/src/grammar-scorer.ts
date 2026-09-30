/**
 * Grammar Scorer
 * 
 * Quantifies grammatical adherence on a 0 to 1 scale.
 */

export class GrammarScorer {
  /**
   * Score grammatical correctness
   */
  score(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0.0;

    let penalty = 0.0;

    // Improper whitespace before punctuation (e.g. "word , next")
    const spacingErrors = (trimmed.match(/\s+[,.!?;:]/g) || []).length;
    penalty += spacingErrors * 0.1;

    // Unmatched parens/brackets
    const openP = (trimmed.match(/\(/g) || []).length;
    const closeP = (trimmed.match(/\)/g) || []).length;
    if (openP !== closeP) penalty += 0.2;

    const openB = (trimmed.match(/\[/g) || []).length;
    const closeB = (trimmed.match(/\]/g) || []).length;
    if (openB !== closeB) penalty += 0.2;

    // Check sentence initial capitalization
    const sentences = trimmed.split(/(?<=[.!?])\s+/);
    let uncapitalized = 0;
    for (const s of sentences) {
      const firstChar = s.trim()[0];
      if (firstChar && /^[a-z]/.test(firstChar)) {
        uncapitalized++;
      }
    }
    if (sentences.length > 0) {
      penalty += (uncapitalized / sentences.length) * 0.15;
    }

    return Math.max(0.0, Math.min(1.0, 1.0 - penalty));
  }
}

export function createGrammarScorer(): GrammarScorer {
  return new GrammarScorer();
}
