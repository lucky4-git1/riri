/**
 * Phrase Substitution Transformation
 * 
 * Replaces verbose phrases with concise alternatives
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';
import { PHRASE_SUBSTITUTIONS, findVerbosePhrases } from './phrases.js';

export class PhraseSubstitutionTransformation extends BaseTransformation {
  readonly id = 'phrase-substitution';
  readonly name = 'Phrase Substitution';
  readonly description = 'Replaces verbose phrases with concise alternatives';
  
  /**
   * Check applicability based on presence of verbose phrases
   */
  async applicability(
    text: string,
    _context: TransformationContext
  ): Promise<number> {
    const _verbosePhrases = findVerbosePhrases(text);
    
    if (_verbosePhrases.length === 0) return 0;
    
    // Higher applicability if more verbose phrases found
    const words = text.split(/\s+/).length;
    const phraseRatio = _verbosePhrases.length / Math.max(words / 10, 1);
    
    const result = Math.min(phraseRatio, 1.0);
    return result;
  }
  
  /**
   * Plan phrase substitutions
   */
  async plan(
    text: string,
    context: TransformationContext
  ): Promise<TransformationPlan> {
    const verbosePhrases = findVerbosePhrases(text);
    
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: 0.8, // High priority - clear wins
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation'],
      skipTransformations: [],
    };
  }
  
  /**
   * Execute phrase substitutions
   */
  async execute(
    text: string,
    context: TransformationContext
  ): Promise<TransformationResult> {
    let modifiedText = text;
    const modifications: Modification[] = [];
    
    // Calculate maximum substitutions based on strength
    const maxSubstitutions = Math.max(
      1,
      Math.ceil(context.strength * 5) // 1-5 substitutions
    );
    
    let substitutionsMade = 0;
    
    // Track positions we've modified to avoid conflicts
    const modifiedRanges: Array<{ start: number; end: number }> = [];
    
    for (const sub of PHRASE_SUBSTITUTIONS) {
      if (substitutionsMade >= maxSubstitutions) break;
      
      // Reset regex
      sub.pattern.lastIndex = 0;
      
      const matches = [...modifiedText.matchAll(sub.pattern)];
      
      for (const match of matches) {
        if (substitutionsMade >= maxSubstitutions) break;
        if (match.index === undefined) continue;
        
        const start = match.index;
        const end = start + match[0].length;
        
        // Check if this range overlaps with protected spans
        const overlapsProtected = context.protectedSpans.some(span =>
          this.rangesOverlap(start, end, span.start, span.end)
        );
        if (overlapsProtected) continue;
        
        // Check if we've already modified this area
        const overlapsModified = modifiedRanges.some(range =>
          this.rangesOverlap(start, end, range.start, range.end)
        );
        if (overlapsModified) continue;
        
        // Apply substitution
        const before = modifiedText.substring(0, start);
        const after = modifiedText.substring(end);
        modifiedText = before + sub.replacement + after;
        
        // Record modification
        modifications.push({
          type: 'phrase-substitution',
          original: {
            text: match[0],
            start,
            end,
          },
          replacement: sub.replacement,
          reason: `Replaced verbose phrase with concise alternative`,
        });
        
        // Track modified range
        modifiedRanges.push({
          start,
          end: start + sub.replacement.length,
        });
        
        substitutionsMade++;
        
        // Break after first match of this pattern to avoid duplicates
        break;
      }
    }
    
    if (substitutionsMade === 0) {
      return this.createFailedResult(text, 'No verbose phrases found');
    }
    
    return this.createResult(modifiedText, modifications, text);
  }
  
  /**
   * Check if two ranges overlap
   */
  private rangesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return (
      (start1 >= start2 && start1 < end2) ||
      (end1 > start2 && end1 <= end2) ||
      (start1 <= start2 && end1 >= end2)
    );
  }
}

/**
 * Create a phrase substitution transformation instance
 */
export function createPhraseSubstitutionTransformation(): PhraseSubstitutionTransformation {
  return new PhraseSubstitutionTransformation();
}
