/**
 * Custom Dictionary Manager
 * 
 * Supports user custom vocabulary, preferred substitutions, and forbidden replacements.
 */

export interface DictionaryExport {
  version: string;
  customWords: string[];
  preferredReplacements: Record<string, string>;
  forbiddenReplacements: string[];
}

export class CustomDictionary {
  private customWords: Set<string>;
  private preferredReplacements: Map<string, string>;
  private forbiddenReplacements: Set<string>;

  constructor() {
    this.customWords = new Set();
    this.preferredReplacements = new Map();
    this.forbiddenReplacements = new Set();
  }

  addWord(word: string): void {
    if (word && word.trim()) {
      this.customWords.add(word.trim().toLowerCase());
    }
  }

  removeWord(word: string): void {
    this.customWords.delete(word.trim().toLowerCase());
  }

  hasWord(word: string): boolean {
    return this.customWords.has(word.trim().toLowerCase());
  }

  addPreferredReplacement(original: string, preferred: string): void {
    if (original && preferred) {
      this.preferredReplacements.set(original.trim().toLowerCase(), preferred.trim());
    }
  }

  getPreferredReplacement(original: string): string | undefined {
    return this.preferredReplacements.get(original.trim().toLowerCase());
  }

  addForbiddenReplacement(word: string): void {
    if (word && word.trim()) {
      this.forbiddenReplacements.add(word.trim().toLowerCase());
    }
  }

  isForbidden(word: string): boolean {
    return this.forbiddenReplacements.has(word.trim().toLowerCase());
  }

  export(): DictionaryExport {
    return {
      version: '1.0',
      customWords: Array.from(this.customWords),
      preferredReplacements: Object.fromEntries(this.preferredReplacements),
      forbiddenReplacements: Array.from(this.forbiddenReplacements),
    };
  }

  import(data: Partial<DictionaryExport>): void {
    if (Array.isArray(data.customWords)) {
      for (const w of data.customWords) this.addWord(w);
    }
    if (data.preferredReplacements && typeof data.preferredReplacements === 'object') {
      for (const [k, v] of Object.entries(data.preferredReplacements)) {
        this.addPreferredReplacement(k, v);
      }
    }
    if (Array.isArray(data.forbiddenReplacements)) {
      for (const w of data.forbiddenReplacements) this.addForbiddenReplacement(w);
    }
  }
}

export function createCustomDictionary(): CustomDictionary {
  return new CustomDictionary();
}
