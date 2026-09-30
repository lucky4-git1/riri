/**
 * Protected Content Validator
 * 
 * Verifies that all protected spans (URLs, numbers, code, emails, etc.)
 * are 100% preserved in the transformed text.
 */

import type { ProtectedSpan, ValidationResult } from '@riri/types';
import { ProtectedSpanDetector, createProtectedSpanDetector } from '@riri/parser';

export class ProtectedContentValidator {
  private detector: ProtectedSpanDetector;

  constructor() {
    this.detector = createProtectedSpanDetector();
  }

  /**
   * Validate that all protected content from original is preserved in transformed
   */
  validate(
    original: string,
    transformed: string,
    providedSpans?: ProtectedSpan[]
  ): ValidationResult {
    const spans = providedSpans || this.detector.detect(original);
    const issues: string[] = [];
    const warnings: string[] = [];

    for (const span of spans) {
      if (!transformed.includes(span.value)) {
        issues.push(
          `Protected content missing: "${span.value}" of type '${span.type}' (from offsets ${span.start}-${span.end})`
        );
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

export function createProtectedContentValidator(): ProtectedContentValidator {
  return new ProtectedContentValidator();
}
