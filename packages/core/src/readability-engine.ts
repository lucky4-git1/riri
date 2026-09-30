/**
 * Readability Engine
 * 
 * Computes comprehensive readability metrics:
 * Flesch Reading Ease, Flesch-Kincaid Grade Level, average sentence length,
 * syllable counts, and complex word ratio.
 */

export interface ReadabilityMetrics {
  fleschReadingEase: number; // 0-100 (higher = easier)
  fleschKincaidGrade: number; // grade level
  readingLevel: string; // "Elementary", "High School", "College", etc.
  averageSentenceLength: number; // words per sentence
  averageWordLength: number; // characters per word
  complexWordRatio: number; // words with >= 3 syllables
  wordCount: number;
  sentenceCount: number;
}

export class ReadabilityEngine {
  /**
   * Compute full readability profile for a text
   */
  analyze(text: string): ReadabilityMetrics {
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const words = text
      .toLowerCase()
      .match(/\b[a-z']+\b/g) || [];

    const sentenceCount = Math.max(1, sentences.length);
    const wordCount = Math.max(1, words.length);

    // Calculate syllables
    let totalSyllables = 0;
    let complexWords = 0;
    let totalCharacters = 0;

    for (const w of words) {
      totalCharacters += w.length;
      const syllables = this.countSyllables(w);
      totalSyllables += syllables;
      if (syllables >= 3) {
        complexWords++;
      }
    }

    const avgSentenceLength = wordCount / sentenceCount;
    const avgWordLength = totalCharacters / wordCount;
    const avgSyllablesPerWord = totalSyllables / wordCount;
    const complexWordRatio = complexWords / wordCount;

    // Flesch Reading Ease = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const fre = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    const fleschReadingEase = Math.max(0, Math.min(100, Math.round(fre * 10) / 10));

    // Flesch-Kincaid Grade Level = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
    const fkg = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
    const fleschKincaidGrade = Math.max(0, Math.round(fkg * 10) / 10);

    return {
      fleschReadingEase,
      fleschKincaidGrade,
      readingLevel: this.getReadingLevel(fleschReadingEase),
      averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      averageWordLength: Math.round(avgWordLength * 10) / 10,
      complexWordRatio: Math.round(complexWordRatio * 100) / 100,
      wordCount,
      sentenceCount,
    };
  }

  /**
   * Compare readability before and after transformation
   */
  compare(original: string, transformed: string): {
    original: ReadabilityMetrics;
    transformed: ReadabilityMetrics;
    easeDifference: number;
    gradeDifference: number;
  } {
    const origMetrics = this.analyze(original);
    const transMetrics = this.analyze(transformed);

    return {
      original: origMetrics,
      transformed: transMetrics,
      easeDifference: Math.round((transMetrics.fleschReadingEase - origMetrics.fleschReadingEase) * 10) / 10,
      gradeDifference: Math.round((transMetrics.fleschKincaidGrade - origMetrics.fleschKincaidGrade) * 10) / 10,
    };
  }

  private countSyllables(word: string): number {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length <= 3) return 1;

    const matches = clean.match(/[aeiouy]{1,2}/g);
    let count = matches ? matches.length : 1;

    if (clean.endsWith('e') && !clean.endsWith('le')) {
      count = Math.max(1, count - 1);
    }

    return count;
  }

  private getReadingLevel(fre: number): string {
    if (fre >= 90) return 'Very Easy (5th grade)';
    if (fre >= 80) return 'Easy (6th grade)';
    if (fre >= 70) return 'Fairly Easy (7th grade)';
    if (fre >= 60) return 'Standard (8th-9th grade)';
    if (fre >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (fre >= 30) return 'Difficult (College)';
    return 'Very Difficult (Graduate)';
  }
}

export function createReadabilityEngine(): ReadabilityEngine {
  return new ReadabilityEngine();
}
