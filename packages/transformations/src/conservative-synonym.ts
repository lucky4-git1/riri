/**
 * Conservative Synonym Transformation
 * 
 * Replaces common words with contextappropriate synonyms.
 * Very conservative - only replaces words with high confidence.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';
import { buildSynonymMap, getSynonymEntry } from './synonyms.js';

export class ConservativeSynonymTransformation extends BaseTransformation {
  readonly id = 'conservative-synonym';
  readonly name = 'Conservative Synonym Replacement';
  readonly description = 'Replaces common words with context-appropriate synonyms';
  
  private synonymMap = buildSynonymMap();
  
  /**
   * Check applicability based on text characteristics
   */
  async applicability(
    text: string,
    context: TransformationContext
  ): Promise<number> {
    // Parse to get tokens
    const parsed = this.parser.parse(text);
    const words = parsed.tokens.filter(t => t.pos !== 'PUNCT');
    
    if (words.length === 0) return 0;
    
    // Count how many words have synonyms
    let replaceableCount = 0;
    
    for (const token of words) {
      const word = token.value.toLowerCase();
      
      // Skip if protected
      if (this.isProtected(token.start, context.protectedSpans)) {
        continue;
      }
      
      // Skip if should preserve
      if (this.shouldPreserveWord(token.value, context)) {
        continue;
      }
      
      // Check if we have synonyms using morphological inflection engine
      if (getSynonymEntry(word) !== null) {
        replaceableCount++;
      }
    }
    
    const replaceableRatio = replaceableCount / words.length;

    
    // Reduce applicability in technical text
    if (context.features.technicalTermRatio > 0.3) {
      return replaceableRatio * 0.5;
    }
    
    return replaceableRatio;
  }
  
  /**
   * Plan synonym replacements
   */
  async plan(
    text: string,
    context: TransformationContext
  ): Promise<TransformationPlan> {
    const parsed = this.parser.parse(text);
    const words = parsed.tokens.filter(t => t.pos !== 'PUNCT');
    
    const recommendations: Array<{
      word: string;
      position: number;
      synonyms: string[];
    }> = [];
    
    for (const token of words) {
      const word = token.value.toLowerCase();
      
      // Skip protected content
      if (this.isProtected(token.start, context.protectedSpans)) {
        continue;
      }
      
      // Skip words that should be preserved
      if (this.shouldPreserveWord(token.value, context)) {
        continue;
      }
      
      // Get synonyms
      const entry = this.synonymMap.get(word);
      if (entry) {
        recommendations.push({
          word: token.value,
          position: token.start,
          synonyms: entry.synonyms,
        });
      }
    }
    
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: 0.7,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation'],
      skipTransformations: [],
    };
  }
  
  /**
   * Execute synonym replacement
   */
  async execute(
    text: string,
    context: TransformationContext
  ): Promise<TransformationResult> {
    const parsed = this.parser.parse(text);
    const modifications: Modification[] = [];
    
    // Calculate how many replacements to make based on strength and mode
    const words = parsed.tokens.filter(t => t.pos !== 'PUNCT');
    const ratio = Math.min(0.65, 0.20 + context.strength * 0.50);
    const maxReplacements = Math.max(
      2,
      Math.floor(words.length * ratio)
    );
    
    let replacementsMade = 0;
    let modifiedText = text;
    let cumulativeOffset = 0;
    
    // Track what we've already replaced to avoid overlapping token replacements
    const replacedPositions = new Set<number>();
    
    for (const token of words) {
      if (replacementsMade >= maxReplacements) break;
      
      const word = token.value.toLowerCase();
      
      // Skip if protected
      if (this.isProtected(token.start, context.protectedSpans)) {
        continue;
      }
      
      // Check if at sentence start
      const isSentenceStart = parsed.sentences.some(s => s.tokens[0]?.start === token.start);

      // Skip if should preserve
      if (this.shouldPreserveWord(token.value, context, isSentenceStart)) {
        continue;
      }
      
      // Skip if overlapping or directly adjacent token was already replaced
      const tooClose = Array.from(replacedPositions).some(pos => 
        Math.abs(pos - token.start) < 4
      );
      if (tooClose) {
        continue;
      }
      
      // Get synonym
      const entry = getSynonymEntry(word);
      if (!entry || entry.synonyms.length === 0) {
        continue;
      }
      
      // Choose synonym based on context
      const chosenSynonym = this.chooseSynonym(entry.synonyms, context, token.value, modifiedText);
      
      // Preserve capitalization
      const replacement = this.preserveCapitalization(token.value, chosenSynonym);
      
      // Apply replacement using cumulative offset to prevent position drift
      const adjustedStart = token.start + cumulativeOffset;
      const adjustedEnd = token.end + cumulativeOffset;
      let before = modifiedText.substring(0, adjustedStart);
      const after = modifiedText.substring(adjustedEnd);

      // Indefinite article agreement: "a" vs "an"
      let articleDelta = 0;
      const startsWithVowelSound = /^[aeiou]/i.test(replacement);
      if (startsWithVowelSound && /\ba\s+$/i.test(before)) {
        before = before.replace(/\ba(\s+)$/i, (m, space) => (m[0] === 'A' ? 'An' : 'an') + space);
        articleDelta = 1;
      } else if (!startsWithVowelSound && /\ban\s+$/i.test(before)) {
        before = before.replace(/\ban(\s+)$/i, (m, space) => (m[0] === 'A' ? 'A' : 'a') + space);
        articleDelta = -1;
      }

      modifiedText = before + replacement + after;
      
      // Record modification
      modifications.push({
        type: 'synonym-replacement',
        original: {
          text: token.value,
          start: token.start,
          end: token.end,
        },
        replacement,
        reason: `Replaced with synonym for variety`,
      });
      
      replacedPositions.add(token.start);
      replacementsMade++;
      
      // Adjust cumulative offset for all subsequent replacements
      cumulativeOffset += replacement.length - (token.end - token.start) + articleDelta;
    }
    
    // If no replacements were made, return failure
    if (replacementsMade === 0) {
      return this.createFailedResult(text, 'No suitable synonym replacements found');
    }
    
    return this.createResult(modifiedText, modifications, text);
  }
  
  /**
   * Choose the best synonym for the context
   */
  private chooseSynonym(
    synonyms: string[],
    context: TransformationContext,
    originalWord?: string,
    surroundingText?: string
  ): string {
    const originalLower = (originalWord || '').toLowerCase();
    let candidates = synonyms.filter(s => s.toLowerCase() !== originalLower);
    if (candidates.length === 0) return synonyms[0] || originalWord || '';

    // If surroundingText is available, avoid choosing a synonym that is already repeated nearby
    if (surroundingText) {
      const lowerSurrounding = surroundingText.toLowerCase();
      const nonRepeated = candidates.filter(s => !lowerSurrounding.includes(s.toLowerCase()));
      if (nonRepeated.length > 0) {
        candidates = nonRepeated;
      }
    }

    // In concise/simple mode, prefer shorter synonyms
    if (context.mode === 'concise' || context.mode === 'simple') {
      const sorted = [...candidates].sort((a, b) => a.length - b.length);
      return sorted[0];
    }
    
    // Default / Academic / Formal / Standard: use the first curated synonym
    return candidates[0];
  }

  
  /**
   * Preserve capitalization from original word
   */
  private preserveCapitalization(original: string, replacement: string): string {
    // All uppercase
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }
    
    // First letter uppercase
    if (original[0] === original[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    
    // All lowercase
    return replacement.toLowerCase();
  }
}

/**
 * Create a conservative synonym transformation instance
 */
export function createConservativeSynonymTransformation(): ConservativeSynonymTransformation {
  return new ConservativeSynonymTransformation();
}
