/**
 * Freeze Words Manager
 * 
 * Manages user-specified freeze words/phrases and converts them into ProtectedSpan entries.
 */

import type { ProtectedSpan } from '@riri/types';

export class FreezeWordsManager {
  private freezeWords: Set<string>;

  constructor(initialWords: string[] = []) {
    this.freezeWords = new Set(initialWords.map(w => w.trim()).filter(w => w.length > 0));
  }

  addWord(word: string): void {
    if (word && word.trim()) {
      this.freezeWords.add(word.trim());
    }
  }

  removeWord(word: string): void {
    this.freezeWords.delete(word.trim());
  }

  getWords(): string[] {
    return Array.from(this.freezeWords);
  }

  /**
   * Scan text for any freeze words and generate protected spans
   */
  detectSpans(text: string, additionalWords: string[] = []): ProtectedSpan[] {
    const allWords = new Set([...this.freezeWords, ...additionalWords]);
    const spans: ProtectedSpan[] = [];

    for (const word of allWords) {
      if (!word || word.length === 0) continue;

      let pos = 0;
      while ((pos = text.indexOf(word, pos)) !== -1) {
        spans.push({
          type: 'freeze',
          value: word,
          text: word,
          start: pos,
          end: pos + word.length,
          metadata: { freezeWord: true },
        });
        pos += word.length;
      }
    }

    return spans.sort((a, b) => a.start - b.start);
  }
}

export function createFreezeWordsManager(initialWords?: string[]): FreezeWordsManager {
  return new FreezeWordsManager(initialWords);
}
