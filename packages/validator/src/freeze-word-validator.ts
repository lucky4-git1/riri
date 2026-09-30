/**
 * Freeze Word Validator
 * 
 * Verifies that user-defined freeze words and phrases are untouched in transformed text.
 */

import type { ValidationResult } from '@riri/types';

export class FreezeWordValidator {
  /**
   * Validate that all freeze words present in original remain in transformed
   */
  validate(
    original: string,
    transformed: string,
    freezeWords: string[] = []
  ): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    for (const word of freezeWords) {
      if (!word) continue;

      // Only check words that were actually in the original text
      if (original.includes(word)) {
        if (!transformed.includes(word)) {
          issues.push(`User freeze word was modified or removed: "${word}"`);
        }
      }
    }

    const valid = issues.length === 0;
    return {
      valid,
      confidence: valid ? 1.0 : 0.0,
      issues,
      warnings,
    };
  }
}

export function createFreezeWordValidator(): FreezeWordValidator {
  return new FreezeWordValidator();
}
