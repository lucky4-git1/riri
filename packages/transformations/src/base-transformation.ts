/**
 * Base Transformation Class
 * 
 * Abstract base class for all text transformations.
 * Provides common functionality for protected content preservation.
 */

import type {
  Transformation,
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  ValidationResult,
  ProtectedSpan,
  Modification,
} from '@riri/types';
import { createParser, NEGATION_WORDS } from '@riri/parser';

export abstract class BaseTransformation implements Transformation {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  
  protected parser = createParser();
  
  /**
   * Check if transformation is applicable to the text
   */
  abstract applicability(
    text: string,
    context: TransformationContext
  ): Promise<number>;
  
  /**
   * Plan the transformation without executing
   */
  abstract plan(
    text: string,
    context: TransformationContext
  ): Promise<TransformationPlan>;
  
  /**
   * Execute the transformation
   */
  abstract execute(
    text: string,
    context: TransformationContext
  ): Promise<TransformationResult>;
  
  /**
   * Validate transformation output
   */
  async validate(
    original: string,
    transformed: string,
    context: TransformationContext
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check protected content preservation
    const protectedCheck = this.validateProtectedContent(
      original,
      transformed,
      context.protectedSpans
    );
    if (!protectedCheck.valid) {
      issues.push(...protectedCheck.issues);
    }
    
    // Check negation preservation
    const negationCheck = this.validateNegationPreservation(original, transformed);
    if (!negationCheck.valid) {
      issues.push(...negationCheck.issues);
    }
    
    // Check basic sanity
    if (transformed.trim().length === 0) {
      issues.push('Transformation produced empty output');
    }
    
    if (transformed === original) {
      warnings.push('Transformation did not modify the text');
    }
    
    return {
      valid: issues.length === 0,
      confidence: issues.length === 0 ? 1.0 : 0.0,
      issues,
      warnings,
    };
  }
  
  /**
   * Check if a position is within a protected span
   */
  protected isProtected(position: number, spans: ProtectedSpan[]): boolean {
    for (const span of spans) {
      if (position >= span.start && position < span.end) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get protected span at position
   */
  protected getProtectedSpanAt(position: number, spans: ProtectedSpan[]): ProtectedSpan | null {
    for (const span of spans) {
      if (position >= span.start && position < span.end) {
        return span;
      }
    }
    return null;
  }
  
  /**
   * Check if a word should be protected from transformation
   */
  private static readonly TECHNICAL_TERMS = new Set([
    'api', 'sdk', 'http', 'https', 'json', 'xml', 'html', 'css',
    'database', 'query', 'schema', 'function', 'class', 'interface',
    'async', 'await', 'callback', 'promise', 'algorithm',
    'parameter', 'argument', 'variable', 'constant', 'method',
  ]);

  protected shouldPreserveWord(
    word: string,
    context: TransformationContext,
    isAtSentenceStart: boolean = false
  ): boolean {
    const normalized = word.toLowerCase();

    if (/^__riri_protected_\d+__$/i.test(word)) {
      return true;
    }
    
    // Always preserve negation words
    if (NEGATION_WORDS.has(normalized)) {
      return true;
    }
    
    // Preserve technical terms if configured
    if (context.features.technicalTermRatio > 0.2) {
      // In technical text, be more conservative
      if (this.isTechnicalTerm(word)) {
        return true;
      }
    }
    
    // Preserve proper nouns (capitalized, but not sentence start)
    if (!isAtSentenceStart && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if word is a technical term
   */
  protected isTechnicalTerm(word: string): boolean {
    return BaseTransformation.TECHNICAL_TERMS.has(word.toLowerCase());
  }
  
  /**
   * Validate that protected content is preserved
   */
  protected validateProtectedContent(
    original: string,
    transformed: string,
    protectedSpans: ProtectedSpan[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    for (const span of protectedSpans) {
      if (!transformed.includes(span.value)) {
        issues.push(`Protected content missing: "${span.value}" (${span.type})`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  /**
   * Validate that negation is preserved
   */
  protected validateNegationPreservation(
    original: string,
    transformed: string
  ): { valid: boolean; issues: string[] } {
    const originalNegations = this.countNegations(original);
    const transformedNegations = this.countNegations(transformed);
    
    const issues: string[] = [];
    
    const equivalentNegativePredicate = /\b(?:to\s+)?not\s+(?:to\s+)?approve\b/i.test(original) && /\b(?:reject|rejected|rejects)\b/i.test(transformed);
    if (originalNegations !== transformedNegations && !equivalentNegativePredicate) {
      issues.push(
        `Negation count mismatch: original had ${originalNegations}, transformed has ${transformedNegations}`
      );
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  /**
   * Count negation words in text
   */
  protected countNegations(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    for (const word of words) {
      if (NEGATION_WORDS.has(word)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Calculate confidence based on transformation safety
   */
  protected calculateConfidence(
    _original: string,
    transformed: string,
    modifications: Modification[]
  ): number {
    let confidence = 1.0;
    
    // Reduce confidence for each modification
    const modificationPenalty = modifications.length * 0.05;
    confidence -= Math.min(modificationPenalty, 0.3);
    
    // Reduce confidence if text changed significantly
    const changeRatio = Math.abs(transformed.length - _original.length) / _original.length;
    if (changeRatio > 0.2) {
      confidence -= 0.2;
    }
    
    // Ensure confidence is in [0, 1]
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Create a successful transformation result
   */
  protected createResult(
    text: string,
    modifications: Modification[],
    original: string
  ): TransformationResult {
    return {
      text,
      applied: modifications.length > 0,
      confidence: this.calculateConfidence(original, text, modifications),
      modifications,
      reasoning: `Applied ${modifications.length} modifications`,
    };
  }
  
  /**
   * Create a failed transformation result (returns original)
   */
  protected createFailedResult(original: string, reason?: string): TransformationResult {
    return {
      text: original,
      applied: false,
      confidence: 0,
      modifications: [],
      reasoning: reason || 'Transformation was not applicable',
    };
  }
}
