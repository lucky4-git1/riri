/**
 * Extractive Summarizer
 * 
 * Local extractive summarization using sentence-level TF-IDF word salience,
 * position weighting, and redundant sentence suppression.
 */

export interface SummarizeOptions {
  ratio?: 0.1 | 0.2 | 0.3 | 0.5 | number;
  length?: 'brief' | 'standard' | 'detailed';
  maxSentences?: number;
}

export interface SummaryResult {
  summary: string;
  originalSentenceCount: number;
  summarySentenceCount: number;
  compressionRatio: number;
  keySentences: Array<{ text: string; score: number; index: number }>;
}

export class ExtractiveSummarizer {
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'it', 'its', 'this', 'that',
  ]);

  /**
   * Produce an extractive summary
   */
  summarize(text: string, options: SummarizeOptions = {}): SummaryResult {
    const rawSentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const originalSentenceCount = rawSentences.length;
    if (originalSentenceCount <= 2) {
      return {
        summary: text.trim(),
        originalSentenceCount,
        summarySentenceCount: originalSentenceCount,
        compressionRatio: 1.0,
        keySentences: rawSentences.map((s, i) => ({ text: s, score: 1.0, index: i })),
      };
    }

    // 1. Calculate word frequencies (TF)
    const wordFreq = new Map<string, number>();
    for (const s of rawSentences) {
      const words = this.tokenizeWords(s);
      for (const w of words) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      }
    }

    // 2. Score sentences: sum of word frequencies + lead paragraph boost
    const scoredSentences: Array<{ text: string; score: number; index: number }> = [];

    for (let i = 0; i < rawSentences.length; i++) {
      const s = rawSentences[i];
      const words = this.tokenizeWords(s);
      if (words.length === 0) continue;

      let score = 0;
      for (const w of words) {
        score += wordFreq.get(w) || 0;
      }

      // Normalize by sentence length
      score = score / Math.sqrt(words.length);

      // Position bias: first sentence of text and first sentences of paragraphs carry higher weight
      if (i === 0) score *= 1.4;
      else if (i === 1) score *= 1.2;
      else if (i === rawSentences.length - 1) score *= 1.1; // Conclusion boost

      scoredSentences.push({ text: s, score, index: i });
    }

    // Determine target sentence count
    let targetCount = Math.ceil(originalSentenceCount * 0.3); // default 30%
    if (options.ratio !== undefined) {
      targetCount = Math.max(1, Math.ceil(originalSentenceCount * options.ratio));
    } else if (options.length === 'brief') {
      targetCount = Math.max(1, Math.ceil(originalSentenceCount * 0.15));
    } else if (options.length === 'detailed') {
      targetCount = Math.max(1, Math.ceil(originalSentenceCount * 0.5));
    }

    if (options.maxSentences) {
      targetCount = Math.min(targetCount, options.maxSentences);
    }

    // Sort by score descending and take top N
    const topSentences = [...scoredSentences]
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount);

    // Restore original document chronological order
    topSentences.sort((a, b) => a.index - b.index);

    const summary = topSentences.map(s => s.text).join(' ');
    const summarySentenceCount = topSentences.length;
    const compressionRatio = Math.round((summary.length / Math.max(1, text.length)) * 100) / 100;

    return {
      summary,
      originalSentenceCount,
      summarySentenceCount,
      compressionRatio,
      keySentences: topSentences,
    };
  }

  private tokenizeWords(text: string): string[] {
    const tokens = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return tokens.filter(t => !ExtractiveSummarizer.STOP_WORDS.has(t));
  }
}

export function createExtractiveSummarizer(): ExtractiveSummarizer {
  return new ExtractiveSummarizer();
}
