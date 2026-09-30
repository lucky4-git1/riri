/**
 * Unified Validation Engine for Riri
 * 
 * Implements the ValidationEngine interface from @riri/types.
 * Combines negation, protected content, freeze words, semantic, and grammar checks.
 */

import type {
  ValidationEngine as IValidationEngine,
  ValidationResult,
  ProtectedSpan,
} from '@riri/types';
import { ProtectedContentValidator } from './protected-content-validator.js';
import { NegationValidator } from './negation-validator.js';
import { FreezeWordValidator } from './freeze-word-validator.js';
import { SemanticValidator } from './semantic-validator.js';
import { GrammarValidator } from './grammar-validator.js';
import { AnchorValidator } from './anchor-validator.js';

export interface ComprehensiveValidationOptions {
  protectedSpans?: ProtectedSpan[];
  freezeWords?: string[];
}

export class ValidationEngine implements IValidationEngine {
  private protectedValidator: ProtectedContentValidator;
  private negationValidator: NegationValidator;
  private freezeValidator: FreezeWordValidator;
  private semanticValidator: SemanticValidator;
  private grammarValidator: GrammarValidator;
  private anchorValidator: AnchorValidator;

  constructor() {
    this.protectedValidator = new ProtectedContentValidator();
    this.negationValidator = new NegationValidator();
    this.freezeValidator = new FreezeWordValidator();
    this.semanticValidator = new SemanticValidator();
    this.grammarValidator = new GrammarValidator();
    this.anchorValidator = new AnchorValidator();
  }

  async validateGrammar(text: string): Promise<ValidationResult> {
    return this.grammarValidator.validate(text);
  }

  async validateSemantics(
    original: string,
    transformed: string,
    _protectedSpans: ProtectedSpan[] = []
  ): Promise<ValidationResult> {
    const semResult = this.semanticValidator.validate(original, transformed);
    const negResult = this.negationValidator.validate(original, transformed);

    const issues = [...semResult.issues, ...negResult.issues];
    const warnings = [...semResult.warnings, ...negResult.warnings];

    return {
      valid: issues.length === 0,
      confidence: issues.length === 0 ? Math.min(semResult.confidence, negResult.confidence) : 0,
      issues,
      warnings,
    };
  }

  async validateNaturalness(text: string): Promise<ValidationResult> {
    // Basic naturalness check using grammar validator
    return this.grammarValidator.validate(text);
  }

  async validateProtectedContent(
    original: string,
    transformed: string,
    protectedSpans: ProtectedSpan[] = []
  ): Promise<ValidationResult> {
    return this.protectedValidator.validate(original, transformed, protectedSpans);
  }

  /**
   * Run all validation gates in a single pass
   */
  async validateAll(
    original: string,
    transformed: string,
    options: ComprehensiveValidationOptions = {}
  ): Promise<ValidationResult> {
    const results = [
      this.protectedValidator.validate(original, transformed, options.protectedSpans),
      this.negationValidator.validate(original, transformed),
      this.freezeValidator.validate(original, transformed, options.freezeWords || []),
      this.semanticValidator.validate(original, transformed),
      this.grammarValidator.validate(transformed),
      this.anchorValidator.validate(original, transformed),
    ];

    const allIssues = results.flatMap(r => r.issues);
    const allWarnings = results.flatMap(r => r.warnings);
    const valid = allIssues.length === 0;

    return {
      valid,
      confidence: valid ? 0.95 : 0.0,
      issues: allIssues,
      warnings: allWarnings,
    };
  }
}

export function createValidationEngine(): ValidationEngine {
  return new ValidationEngine();
}
