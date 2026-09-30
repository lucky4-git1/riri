/**
 * Grammar Validator
 * 
 * Performs rule-based grammar sanity checks on text output.
 */

import type { ValidationResult } from '@riri/types';

export class GrammarValidator {
  /**
   * Validate grammar correctness of text
   */
  validate(text: string): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // 1. Check for duplicated words (e.g. "the the", "in in")
    const duplicateWordMatch = text.match(/\b([A-Za-z]+)\s+\1\b/i);
    if (duplicateWordMatch) {
      warnings.push(`Duplicate consecutive word detected: "${duplicateWordMatch[0]}"`);
    }

    // 2. Check for whitespace before punctuation (e.g. "hello , world")
    if (/\s+[,.!?;:]/.test(text)) {
      issues.push('Improper whitespace before punctuation mark');
    }

    // 3. Check for repeated punctuation marks (e.g. ",,", "..")
    if (/([,;:]{2,}|\.{4,})/.test(text)) {
      warnings.push('Unusual repeated punctuation detected');
    }

    // 4. Check for unmatched brackets or parentheses
    const openParens = (text.match(/\(/g) || []).length;
    const closeParens = (text.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push(`Unmatched parentheses detected: ${openParens} opening vs ${closeParens} closing`);
    }

    const openBrackets = (text.match(/\[/g) || []).length;
    const closeBrackets = (text.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push(`Unmatched brackets detected: ${openBrackets} opening vs ${closeBrackets} closing`);
    }


    const valid = issues.length === 0;
    return {
      valid,
      confidence: valid ? 0.95 : 0.4,
      issues,
      warnings,
    };
  }
}

export function createGrammarValidator(): GrammarValidator {
  return new GrammarValidator();
}
