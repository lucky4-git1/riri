/**
 * Semantic Validator
 * 
 * Verifies that transformed text preserves semantic meaning, reasonable length bounds,
 * and sufficient content overlap with the source.
 */

import type { ValidationResult } from '@riri/types';

export interface SemanticValidatorOptions {
  minOverlapRatio?: number;
  minLengthRatio?: number;
  maxLengthRatio?: number;
}

export class SemanticValidator {
  private minOverlap: number;
  private minLengthRatio: number;
  private maxLengthRatio: number;

  constructor(options: SemanticValidatorOptions = {}) {
    this.minOverlap = options.minOverlapRatio ?? 0.4;
    this.minLengthRatio = options.minLengthRatio ?? 0.3;
    this.maxLengthRatio = options.maxLengthRatio ?? 3.0;
  }

  /**
   * Validate semantic preservation
   */
  validate(original: string, transformed: string): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    const origTrim = original.trim();
    const transTrim = transformed.trim();

    // 1. Empty check
    if (transTrim.length === 0) {
      issues.push('Transformed text is empty');
      return { valid: false, confidence: 0, issues, warnings };
    }

    // 2. Length ratio bounds
    const lengthRatio = transTrim.length / Math.max(1, origTrim.length);
    if (lengthRatio < this.minLengthRatio) {
      issues.push(
        `Transformed text is suspiciously short (${(lengthRatio * 100).toFixed(0)}% of original length)`
      );
    } else if (lengthRatio > this.maxLengthRatio) {
      issues.push(
        `Transformed text expanded excessively (${(lengthRatio * 100).toFixed(0)}% of original length)`
      );
    }

    // 3. Token overlap check (ignoring stopwords)
    const origWords = this.extractContentWords(origTrim);
    const transWords = this.extractContentWords(transTrim);

    if (origWords.size > 0) {
      let common = 0;
      for (const w of origWords) {
        if (transWords.has(w)) common++;
      }
      const overlapRatio = common / origWords.size;

      if (overlapRatio < this.minOverlap) {
        warnings.push(
          `Low content word overlap (${(overlapRatio * 100).toFixed(0)}% common words with original)`
        );
      }
    }

    const valid = issues.length === 0;
    return {
      valid,
      confidence: valid ? 0.9 : 0.0,
      issues,
      warnings,
    };
  }

  private extractContentWords(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'it', 'its', 'this', 'that',
    ]);

    const words = text.toLowerCase().match(/[\w']+/g) || [];
    const content = new Set<string>();
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w)) {
        content.add(w);
      }
    }
    return content;
  }
}

export function createSemanticValidator(options?: SemanticValidatorOptions): SemanticValidator {
  return new SemanticValidator(options);
}
