/**
 * Tokenizer
 * 
 * Splits text into tokens (words and punctuation)
 */

import type { Token, ProtectedSpan } from '@riri/types';

export class Tokenizer {
  /**
   * Tokenize text into words and punctuation with accurate character offsets
   */
  tokenize(
    text: string,
    protectedSpans: ProtectedSpan[] = [],
    baseOffset: number = 0
  ): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < text.length) {
      const globalPos = baseOffset + pos;

      // Check if current position is at or inside a protected span
      const protectedSpan = protectedSpans.find(
        s => globalPos >= s.start && globalPos < s.end
      );

      if (protectedSpan) {
        const localStart = Math.max(0, protectedSpan.start - baseOffset);
        const localEnd = Math.min(text.length, protectedSpan.end - baseOffset);
        const spanText = text.substring(localStart, localEnd);

        if (spanText.length > 0) {
          tokens.push({
            value: spanText,
            text: spanText,
            start: baseOffset + localStart,
            end: baseOffset + localEnd,
            pos: 'PROTECTED',
          });
        }

        pos = localEnd;
        continue;
      }

      // Skip whitespace
      if (/\s/.test(text[pos])) {
        pos++;
        continue;
      }

      // Match punctuation
      const punctMatch = text.substring(pos).match(/^[.,!?;:()[\]{}'"]+/);
      if (punctMatch) {
        const val = punctMatch[0];
        tokens.push({
          value: val,
          text: val,
          start: baseOffset + pos,
          end: baseOffset + pos + val.length,
          pos: 'PUNCT',
        });
        pos += val.length;
        continue;
      }

      // Word: read until whitespace, punctuation, or start of a protected span
      let wordEnd = pos;
      while (wordEnd < text.length) {
        const nextGlobalPos = baseOffset + wordEnd;
        if (
          /\s/.test(text[wordEnd]) ||
          /[.,!?;:()[\]{}'"]/.test(text[wordEnd]) ||
          protectedSpans.some(s => nextGlobalPos >= s.start && nextGlobalPos < s.end)
        ) {
          break;
        }
        wordEnd++;
      }

      if (wordEnd > pos) {
        const word = text.substring(pos, wordEnd);
        tokens.push({
          value: word,
          text: word,
          start: baseOffset + pos,
          end: baseOffset + wordEnd,
          pos: this.guessPartOfSpeech(word),
        });
        pos = wordEnd;
        continue;
      }

      pos++;
    }

    return tokens;
  }
  
  /**
   * Simple word tokenization (just split on whitespace)
   */
  simpleTokenize(text: string): string[] {
    return text
      .split(/\s+/)
      .filter(word => word.length > 0);
  }
  
  /**
   * Check if a range overlaps with any protected span
   * (Currently unused but may be needed for future features)
   */
  // private overlapsWithProtectedSpan(
  //   start: number,
  //   end: number,
  //   spans: ProtectedSpan[]
  // ): boolean {
  //   for (const span of spans) {
  //     if (
  //       (start >= span.start && start < span.end) ||
  //       (end > span.start && end <= span.end) ||
  //       (start <= span.start && end >= span.end)
  //     ) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }
  
  /**
   * Very basic part-of-speech guessing
   * (This is simplified - real POS tagging needs more sophisticated analysis)
   */
  private guessPartOfSpeech(word: string): string | undefined {
    // Punctuation
    if (/^[.,!?;:()[\]{}'"]+$/.test(word)) {
      return 'PUNCT';
    }
    
    // Numbers
    if (/^\d+$/.test(word)) {
      return 'NUM';
    }
    
    // Common suffixes
    if (word.endsWith('ing')) {
      return 'VERB'; // Present participle
    }
    if (word.endsWith('ed')) {
      return 'VERB'; // Past tense
    }
    if (word.endsWith('ly')) {
      return 'ADV'; // Adverb
    }
    if (word.endsWith('tion') || word.endsWith('ness') || word.endsWith('ment')) {
      return 'NOUN'; // Common noun suffixes
    }
    
    // Default
    return undefined;
  }
  
  /**
   * Get word count (excluding punctuation)
   */
  getWordCount(tokens: Token[]): number {
    return tokens.filter(t => t.pos !== 'PUNCT').length;
  }
  
  /**
   * Get unique word count (vocabulary diversity)
   */
  getUniqueWordCount(tokens: Token[]): number {
    const words = tokens
      .filter(t => t.pos !== 'PUNCT')
      .map(t => t.value.toLowerCase());
    return new Set(words).size;
  }
  
  /**
   * Calculate vocabulary diversity (unique words / total words)
   */
  getVocabularyDiversity(tokens: Token[]): number {
    const totalWords = this.getWordCount(tokens);
    const uniqueWords = this.getUniqueWordCount(tokens);
    
    if (totalWords === 0) return 0;
    return uniqueWords / totalWords;
  }
}

/**
 * Create a new tokenizer
 */
export function createTokenizer(): Tokenizer {
  return new Tokenizer();
}
