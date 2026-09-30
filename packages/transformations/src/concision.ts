/**
 * Concision Transformation
 * 
 * Removes wordiness, bloated idioms, and filler phrases to produce lean, impactful prose.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface ConcisionEntry {
  pattern: RegExp;
  replacement: string;
}

const CONCISION_PATTERNS: ConcisionEntry[] = [
  { pattern: /\bin order to\b/gi, replacement: 'to' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
  { pattern: /\bat this point in time\b/gi, replacement: 'now' },
  { pattern: /\bat the present time\b/gi, replacement: 'currently' },
  { pattern: /\bin the event that\b/gi, replacement: 'if' },
  { pattern: /\bhas the capability to\b/gi, replacement: 'can' },
  { pattern: /\bhave the capability to\b/gi, replacement: 'can' },
  { pattern: /\bis able to\b/gi, replacement: 'can' },
  { pattern: /\bare able to\b/gi, replacement: 'can' },
  { pattern: /\bon a daily basis\b/gi, replacement: 'daily' },
  { pattern: /\bon a weekly basis\b/gi, replacement: 'weekly' },
  { pattern: /\ba large number of\b/gi, replacement: 'many' },
  { pattern: /\ba small number of\b/gi, replacement: 'few' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'for' },
  { pattern: /\bwith the exception of\b/gi, replacement: 'except' },
  { pattern: /\bat all times\b/gi, replacement: 'always' },
  { pattern: /\bduring the time that\b/gi, replacement: 'while' },
  { pattern: /\buntil such time as\b/gi, replacement: 'until' },
  { pattern: /\bin spite of the fact that\b/gi, replacement: 'although' },
  { pattern: /\btake into consideration\b/gi, replacement: 'consider' },
];

export class ConcisionTransformation extends BaseTransformation {
  readonly id = 'concision';
  readonly name = 'Concision';
  readonly description = 'Trims wordiness and redundant phrasing';

  async applicability(text: string, context: TransformationContext): Promise<number> {
    let matchCount = 0;
    for (const item of CONCISION_PATTERNS) {
      item.pattern.lastIndex = 0;
      if (item.pattern.test(text)) matchCount++;
    }

    const base = Math.min(1.0, matchCount * 0.3);
    return context.mode === 'concise' ? Math.min(1.0, base * 1.3) : base;
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: context.mode === 'concise' ? 0.95 : 0.7,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation', 'code'],
      skipTransformations: [],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    const modifications: Modification[] = [];
    let modifiedText = text;
    let cumulativeOffset = 0;

    const maxSubstitutions = Math.max(1, Math.ceil(context.strength * 6));
    let appliedCount = 0;

    for (const item of CONCISION_PATTERNS) {
      if (appliedCount >= maxSubstitutions) break;

      item.pattern.lastIndex = 0;
      const matches = [...text.matchAll(item.pattern)];

      for (const match of matches) {
        if (appliedCount >= maxSubstitutions) break;
        if (match.index === undefined) continue;

        const origMatch = match[0];
        const origStart = match.index;
        const origEnd = origStart + origMatch.length;

        if (this.isProtected(origStart, context.protectedSpans)) continue;

        let replacement = item.replacement;
        if (origMatch[0] === origMatch[0].toUpperCase()) {
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
          type: 'concision',
          original: { text: origMatch, start: origStart, end: origEnd },
          replacement,
          reason: `Reduced wordiness: "${origMatch}" -> "${replacement}"`,
        });

        appliedCount++;
      }
    }

    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No verbose phrasing found for concision');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createConcisionTransformation(): ConcisionTransformation {
  return new ConcisionTransformation();
}
