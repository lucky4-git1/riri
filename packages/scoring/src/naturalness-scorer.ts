/**
 * Naturalness Scorer
 * 
 * Evaluates fluency, sentence cadence, and absence of mechanical repetition (0 to 1).
 */

export class NaturalnessScorer {
  /**
   * Score naturalness and readability flow
   */
  score(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length === 0) return 0.0;

    let score = 1.0;

    // 1. Penalize repeated consecutive words ("the the", "is is")
    const repeatedWords = trimmed.match(/\b([A-Za-z]+)\s+\1\b/gi);
    if (repeatedWords) {
      score -= repeatedWords.length * 0.2;
    }

    // 2. Penalize excessive punctuation clusters
    const weirdPunct = trimmed.match(/[,;:.]{3,}/g);
    if (weirdPunct) {
      score -= weirdPunct.length * 0.15;
    }

    // 3. Check sentence length diversity
    const sentences = trimmed.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (sentences.length > 1) {
      const lengths = sentences.map(s => s.split(/\s+/).length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / lengths.length;
      
      // Some variance in sentence length is natural; completely identical lengths can sound robotic
      if (variance > 2) {
        score += 0.05;
      }
    }

    // 4. Vocabulary diversity
    const words = trimmed.toLowerCase().match(/\b[a-z]+\b/g) || [];
    if (words.length > 10) {
      const unique = new Set(words).size;
      const diversity = unique / words.length;
      if (diversity < 0.4) {
        score -= 0.15; // Unusually repetitive vocabulary
      }
    }

    return Math.max(0.0, Math.min(1.0, score));
  }
}

export function createNaturalnessScorer(): NaturalnessScorer {
  return new NaturalnessScorer();
}
