/**
 * Redundancy Removal Transformation
 * 
 * Identifies and eliminates tautologies, pleonasms, and redundant word pairings.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface RedundancyEntry {
  pattern: RegExp;
  replacement: string;
}

const REDUNDANCY_PATTERNS: RedundancyEntry[] = [
  { pattern: /\bclose proximity\b/gi, replacement: 'proximity' },
  { pattern: /\bend result\b/gi, replacement: 'result' },
  { pattern: /\bfuture plans?\b/gi, replacement: 'plans' },
  { pattern: /\btrue facts?\b/gi, replacement: 'facts' },
  { pattern: /\bpast history\b/gi, replacement: 'history' },
  { pattern: /\bbasic fundamentals\b/gi, replacement: 'fundamentals' },
  { pattern: /\bcompletely eliminate\b/gi, replacement: 'eliminate' },
  { pattern: /\bcompletely eliminated\b/gi, replacement: 'eliminated' },
  { pattern: /\bfirst and foremost\b/gi, replacement: 'first' },
  { pattern: /\bfinal outcome\b/gi, replacement: 'outcome' },
  { pattern: /\bunexpected surprise\b/gi, replacement: 'surprise' },
  { pattern: /\badvance notice\b/gi, replacement: 'notice' },
  { pattern: /\bfree gift\b/gi, replacement: 'gift' },
  { pattern: /\brevert back\b/gi, replacement: 'revert' },
  { pattern: /\bplan ahead\b/gi, replacement: 'plan' },
  { pattern: /\bmerge together\b/gi, replacement: 'merge' },
  { pattern: /\bgather together\b/gi, replacement: 'gather' },
  { pattern: /\brepeat again\b/gi, replacement: 'repeat' },
  { pattern: /\bjoin together\b/gi, replacement: 'join' },
  { pattern: /\bsum total\b/gi, replacement: 'total' },
  { pattern: /\bbrief summary\b/gi, replacement: 'summary' },
  { pattern: /\bexact same\b/gi, replacement: 'same' },
  { pattern: /\bmutually agree\b/gi, replacement: 'agree' },
];

export class RedundancyRemovalTransformation extends BaseTransformation {
  readonly id = 'redundancy-removal';
  readonly name = 'Redundancy Removal';
  readonly description = 'Removes pleonasms and tautological word combinations';

  async applicability(text: string, _context: TransformationContext): Promise<number> {
    let matches = 0;
    for (const item of REDUNDANCY_PATTERNS) {
      item.pattern.lastIndex = 0;
      if (item.pattern.test(text)) matches++;
    }
    return Math.min(1.0, matches * 0.4);
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: 0.8,
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

    for (const item of REDUNDANCY_PATTERNS) {
      item.pattern.lastIndex = 0;
      const matches = [...text.matchAll(item.pattern)];

      for (const match of matches) {
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
          type: 'redundancy-removal',
          original: { text: origMatch, start: origStart, end: origEnd },
          replacement,
          reason: `Removed redundant phrasing: "${origMatch}" -> "${replacement}"`,
        });
      }
    }

    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No redundant phrasing identified');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createRedundancyRemovalTransformation(): RedundancyRemovalTransformation {
  return new RedundancyRemovalTransformation();
}
