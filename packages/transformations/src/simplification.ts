/**
 * Simplification Transformation
 * 
 * Replaces needlessly complex, archaic, or bureaucratic vocabulary
 * with plain, accessible language while strictly preserving semantics.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface SimplificationEntry {
  pattern: RegExp;
  replacement: string;
}

const SIMPLIFICATIONS: SimplificationEntry[] = [
  { pattern: /\butilize\b/gi, replacement: 'use' },
  { pattern: /\butilizes\b/gi, replacement: 'uses' },
  { pattern: /\butilized\b/gi, replacement: 'used' },
  { pattern: /\butilizing\b/gi, replacement: 'using' },
  { pattern: /\bcommence\b/gi, replacement: 'begin' },
  { pattern: /\bcommences\b/gi, replacement: 'begins' },
  { pattern: /\bcommenced\b/gi, replacement: 'began' },
  { pattern: /\bterminate\b/gi, replacement: 'end' },
  { pattern: /\bterminates\b/gi, replacement: 'ends' },
  { pattern: /\bterminated\b/gi, replacement: 'ended' },
  { pattern: /\bendeavor\b/gi, replacement: 'try' },
  { pattern: /\bendeavors\b/gi, replacement: 'tries' },
  { pattern: /\bendeavored\b/gi, replacement: 'tried' },
  { pattern: /\bfacilitate\b/gi, replacement: 'help' },
  { pattern: /\bfacilitates\b/gi, replacement: 'helps' },
  { pattern: /\bfacilitated\b/gi, replacement: 'helped' },
  { pattern: /\bascertain\b/gi, replacement: 'find out' },
  { pattern: /\bcognizant of\b/gi, replacement: 'aware of' },
  { pattern: /\bexpedite\b/gi, replacement: 'speed up' },
  { pattern: /\bnecessitate\b/gi, replacement: 'require' },
  { pattern: /\bnecessitates\b/gi, replacement: 'requires' },
  { pattern: /\bnecessitated\b/gi, replacement: 'required' },
  { pattern: /\btransmit\b/gi, replacement: 'send' },
  { pattern: /\btransmits\b/gi, replacement: 'sends' },
  { pattern: /\btransmitted\b/gi, replacement: 'sent' },
];

export class SimplificationTransformation extends BaseTransformation {
  readonly id = 'simplification';
  readonly name = 'Simplification';
  readonly description = 'Replaces complex vocabulary with plain language alternatives';

  async applicability(text: string, context: TransformationContext): Promise<number> {
    if (context.mode === 'formal' || context.mode === 'academic') {
      return 0.1; // Low applicability in formal modes
    }

    let matchCount = 0;
    for (const item of SIMPLIFICATIONS) {
      item.pattern.lastIndex = 0;
      if (item.pattern.test(text)) matchCount++;
    }

    return Math.min(1.0, matchCount * 0.25);
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: context.mode === 'simple' ? 0.9 : 0.6,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation', 'code'],
      skipTransformations: ['formalization'],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    const modifications: Modification[] = [];
    let modifiedText = text;
    let cumulativeOffset = 0;

    const maxSubstitutions = Math.max(1, Math.ceil(context.strength * 5));
    let appliedCount = 0;

    for (const item of SIMPLIFICATIONS) {
      if (appliedCount >= maxSubstitutions) break;

      item.pattern.lastIndex = 0;
      const matches = [...text.matchAll(item.pattern)];

      for (const match of matches) {
        if (appliedCount >= maxSubstitutions) break;
        if (match.index === undefined) continue;

        const origMatch = match[0];
        const origStart = match.index;
        const origEnd = origStart + origMatch.length;

        // Skip if overlapping protected span
        if (this.isProtected(origStart, context.protectedSpans)) continue;

        // Preserve capitalization
        let replacement = item.replacement;
        if (origMatch === origMatch.toUpperCase()) {
          replacement = replacement.toUpperCase();
        } else if (origMatch[0] === origMatch[0].toUpperCase()) {
          replacement = replacement[0].toUpperCase() + replacement.slice(1);
        }

        const adjustedStart = origStart + cumulativeOffset;
        const adjustedEnd = origEnd + cumulativeOffset;

        modifiedText =
          modifiedText.substring(0, adjustedStart) +
          replacement +
          modifiedText.substring(adjustedEnd);

        cumulativeOffset += replacement.length - origMatch.length;

        modifications.push({
          type: 'simplification',
          original: { text: origMatch, start: origStart, end: origEnd },
          replacement,
          reason: `Replaced complex term with simpler alternative: ${replacement}`,
        });

        appliedCount++;
      }
    }

    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No complex vocabulary identified for simplification');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createSimplificationTransformation(): SimplificationTransformation {
  return new SimplificationTransformation();
}
