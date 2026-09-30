/**
 * Sentence Segmenter
 * 
 * Splits text into sentences while handling abbreviations and edge cases
 */

import type { Sentence } from '@riri/types';
import { SENTENCE_BOUNDARIES } from './patterns.js';

export class SentenceSegmenter {
  /**
   * Segment text into sentences
   */
  segment(text: string): Sentence[] {
    const sentences: Sentence[] = [];
    let currentStart = 0;
    let sentenceIndex = 0;
    
    // Find all potential sentence boundaries
    const boundaries = this.findBoundaries(text);
    
    for (const boundary of boundaries) {
      const rawSlice = text.substring(currentStart, boundary);
      const match = rawSlice.match(/^\s*/);
      const leadingWhitespace = match ? match[0].length : 0;
      const sentenceText = rawSlice.trim();
      
      if (sentenceText.length > 0) {
        const actualStart = currentStart + leadingWhitespace;
        const actualEnd = actualStart + sentenceText.length;
        sentences.push({
          text: sentenceText,
          start: actualStart,
          end: actualEnd,
          index: sentenceIndex++,
          tokens: [], // Will be filled by tokenizer
          length: sentenceText.length,
        });
      }
      
      currentStart = boundary;
    }
    
    // Add final sentence if any text remains
    if (currentStart < text.length) {
      const rawSlice = text.substring(currentStart);
      const match = rawSlice.match(/^\s*/);
      const leadingWhitespace = match ? match[0].length : 0;
      const sentenceText = rawSlice.trim();
      if (sentenceText.length > 0) {
        const actualStart = currentStart + leadingWhitespace;
        const actualEnd = actualStart + sentenceText.length;
        sentences.push({
          text: sentenceText,
          start: actualStart,
          end: actualEnd,
          index: sentenceIndex,
          tokens: [],
          length: sentenceText.length,
        });
      }
    }

    
    return sentences;
  }
  
  /**
   * Find sentence boundaries
   */
  private findBoundaries(text: string): number[] {
    const boundaries: number[] = [];
    
    // Find all sentence-ending punctuation
    const endingPattern = /[.!?]+/g;
    let match: RegExpExecArray | null;
    
    while ((match = endingPattern.exec(text)) !== null) {
      const position = match.index + match[0].length;
      
      // Check if this is a real sentence boundary
      if (this.isSentenceBoundary(text, match.index, position)) {
        boundaries.push(position);
      }
    }
    
    return boundaries;
  }
  
  /**
   * Determine if a position is a real sentence boundary
   */
  private isSentenceBoundary(text: string, punctStart: number, punctEnd: number): boolean {
    // If the punctuation is a period and immediately adjacent to non-whitespace
    // (e.g. decimal numbers like 99.9%, domains like example.com, or file extensions)
    if (text[punctStart] === '.') {
      const charBefore = punctStart > 0 ? text[punctStart - 1] : '';
      const charAfter = punctEnd < text.length ? text[punctEnd] : '';
      // Decimal number: digit before and digit after (e.g. 99.9%)
      if (/\d/.test(charBefore) && /\d/.test(charAfter)) {
        return false;
      }
      // No whitespace or closing quote after period means it's part of a word/token
      if (charAfter && !/[\s"'\)\]\}]/.test(charAfter)) {
        return false;
      }
    }

    // Check for abbreviations
    const wordBefore = this.getWordBefore(text, punctStart);
    if (wordBefore && this.isAbbreviation(wordBefore)) {
      // Check if there's a capital letter after (might still be sentence boundary)
      const afterText = text.substring(punctEnd).trimStart();
      if (afterText.length > 0 && /^[A-Z]/.test(afterText)) {
        return true; // Capital letter after abbreviation = sentence boundary
      }
      return false; // Abbreviation followed by lowercase = not a boundary
    }
    
    // Check what follows the punctuation
    const afterText = text.substring(punctEnd).trimStart();
    
    // End of text
    if (afterText.length === 0) {
      return true;
    }
    
    // Followed by capital letter or number with whitespace = sentence boundary
    if (/^[A-Z0-9"]/.test(afterText)) {
      return true;
    }
    
    // Followed by lowercase = not a boundary (unless after certain punctuation)
    if (/^[a-z]/.test(afterText)) {
      const punctuation = text.substring(punctStart, punctEnd);
      // Question marks and exclamation points are always boundaries
      if (/[!?]/.test(punctuation)) {
        return true;
      }
      return false;
    }
    
    // Default to boundary
    return true;
  }
  
  /**
   * Get the word immediately before a position
   */
  private getWordBefore(text: string, position: number): string | null {
    const before = text.substring(0, position);
    const words = before.split(/\s+/);
    const lastWord = words[words.length - 1];
    return lastWord || null;
  }
  
  /**
   * Check if a word is a known abbreviation
   */
  private isAbbreviation(word: string): boolean {
    // Remove trailing period if present
    const normalized = word.replace(/\.$/, '').toLowerCase();
    return SENTENCE_BOUNDARIES.abbreviations.has(normalized);
  }
  
  /**
   * Merge short sentences if appropriate
   */
  mergeShortSentences(sentences: Sentence[], minLength: number = 5): Sentence[] {
    if (sentences.length <= 1) {
      return sentences;
    }
    
    const merged: Sentence[] = [];
    let i = 0;
    
    while (i < sentences.length) {
      const current = sentences[i];
      
      // If sentence is very short and not the last one, consider merging
      if (
        current.length < minLength &&
        i < sentences.length - 1 &&
        merged.length > 0
      ) {
        // Merge with previous sentence
        const prev = merged[merged.length - 1];
        merged[merged.length - 1] = {
          ...prev,
          text: prev.text + ' ' + current.text,
          end: current.end,
          length: prev.length + 1 + current.length,
        };
      } else {
        merged.push(current);
      }
      
      i++;
    }
    
    return merged;
  }
}

/**
 * Create a new sentence segmenter
 */
export function createSentenceSegmenter(): SentenceSegmenter {
  return new SentenceSegmenter();
}
