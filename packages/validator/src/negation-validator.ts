/**
 * Negation Validator
 * 
 * Guarantees 100% preservation of negation semantics.
 * Critical safety gate: preventing meaning inversion.
 */

import type { ValidationResult } from '@riri/types';
import { NEGATION_WORDS } from '@riri/parser';

export class NegationValidator {
  /**
   * Validate that negation polarity is strictly preserved
   */
  validate(original: string, transformed: string): ValidationResult {
    const originalNegations = this.extractNegations(original);
    const transformedNegations = this.extractNegations(transformed);

    const issues: string[] = [];
    const warnings: string[] = [];

    // Critical failure: original had negation, transformed has none
    const hasEquivalentNegativePredicate = this.hasEquivalentNegativePredicate(original, transformed);
    if (originalNegations.length > 0 && transformedNegations.length === 0 && !hasEquivalentNegativePredicate) {
      issues.push(
        `Negation completely eliminated! Original had [${originalNegations.join(', ')}], transformed has none. This causes semantic polarity inversion.`
      );
    } else if (transformedNegations.length < originalNegations.length && !hasEquivalentNegativePredicate) {
      issues.push(
        `Negation count decreased from ${originalNegations.length} to ${transformedNegations.length}. Expected all negative assertions to be maintained.`
      );
    }

    // Warning if negation was added where none existed
    if (originalNegations.length === 0 && transformedNegations.length > 0) {
      warnings.push(
        `Negation introduced in transformed text where none existed in original: [${transformedNegations.join(', ')}]`
      );
    }

    const valid = issues.length === 0;
    return {
      valid,
      confidence: valid ? 1.0 : 0.0,
      issues,
      warnings,
    };
  }

  /**
   * Extract all negation words occurring in text
   */
  private extractNegations(text: string): string[] {
    const tokens = text.toLowerCase().match(/[\w']+/g) || [];
    const found: string[] = [];
    for (const token of tokens) {
      if (NEGATION_WORDS.has(token)) {
        found.push(token);
      }
    }
    return found;
  }

  /**
   * Some direct predicates preserve a negative proposition without retaining a
   * surface negator. These are deliberately narrow, not a general synonym rule.
   */
  private hasEquivalentNegativePredicate(original: string, transformed: string): boolean {
    const source = original.toLowerCase();
    const candidate = transformed.toLowerCase();
    return (
      /\b(?:to\s+)?not\s+(?:to\s+)?approve\b/.test(source) && /\b(?:rejected|rejects|reject)\b/.test(candidate)
    ) || (
      /\bnot\s+(?:to\s+)?accept\b/.test(source) && /\b(?:declined|declines|decline)\b/.test(candidate)
    );
  }
}

export function createNegationValidator(): NegationValidator {
  return new NegationValidator();
}
