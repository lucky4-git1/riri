/**
 * Sentence Restructure Transformation
 * 
 * Reorganizes sentence clause openings and transitional phrases for better cadence.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface RestructurePattern {
  pattern: RegExp;
  replacement: string;
}

const RESTRUCTURE_PATTERNS: RestructurePattern[] = [
  { pattern: /\bin addition to this,?\s+/gi, replacement: 'Additionally, ' },
  { pattern: /\bfirst of all,?\s+/gi, replacement: 'First, ' },
  { pattern: /\bas a matter of fact,?\s+/gi, replacement: 'In fact, ' },
  { pattern: /\bat the end of the day,?\s+/gi, replacement: 'Ultimately, ' },
  { pattern: /\bwith that being said,?\s+/gi, replacement: 'Nonetheless, ' },
  { pattern: /\bit should be noted that\s+/gi, replacement: 'Notably, ' },
  { pattern: /\bit is important to remember that\s+/gi, replacement: 'Importantly, ' },
  { pattern: /\bthere is no doubt that\s+/gi, replacement: 'Undoubtedly, ' },
  { pattern: /\bit is worth mentioning that\s+/gi, replacement: 'Notably, ' },
  { pattern: /\bit is well known that\s+/gi, replacement: 'Clearly, ' },
  { pattern: /\bit is evident that\s+/gi, replacement: 'Evidently, ' },
  { pattern: /\bit is apparent that\s+/gi, replacement: 'Apparently, ' },
  { pattern: /\bit is clear that\s+/gi, replacement: 'Clearly, ' },
  { pattern: /\bit is possible that\s+/gi, replacement: 'Potentially, ' },
  { pattern: /\bit is probable that\s+/gi, replacement: 'Likely, ' },
  { pattern: /\bit goes without saying that\s+/gi, replacement: 'Naturally, ' },
  { pattern: /\bin terms of\s+/gi, replacement: 'Regarding ' },
  { pattern: /\bwith respect to\s+/gi, replacement: 'Concerning ' },
  { pattern: /\bwith regard to\s+/gi, replacement: 'Regarding ' },
  { pattern: /\btaking into account\s+/gi, replacement: 'Considering ' },
  { pattern: /\btaking into consideration\s+/gi, replacement: 'Considering ' },
  { pattern: /\bin an effort to\s+/gi, replacement: 'To ' },
  { pattern: /\bat the present moment,?\s+/gi, replacement: 'Currently, ' },
  { pattern: /\bin this day and age,?\s+/gi, replacement: 'Today, ' },
  { pattern: /\bin the near future,?\s+/gi, replacement: 'Soon, ' },
  { pattern: /\bin the majority of cases,?\s+/gi, replacement: 'Typically, ' },
  { pattern: /\bin most cases,?\s+/gi, replacement: 'Generally, ' },
  { pattern: /\bon the other hand,?\s+/gi, replacement: 'Conversely, ' },
  { pattern: /\bas a consequence,?\s+/gi, replacement: 'Consequently, ' },
  { pattern: /\ball things considered,?\s+/gi, replacement: 'Overall, ' },
  { pattern: /\bfor the most part,?\s+/gi, replacement: 'Largely, ' },
];


export class SentenceRestructureTransformation extends BaseTransformation {
  readonly id = 'sentence-restructure';
  readonly name = 'Sentence Restructure';
  readonly description = 'Reorganizes clause openers and transitional constructions';

  async applicability(text: string, _context: TransformationContext): Promise<number> {
    let matches = 0;
    for (const p of RESTRUCTURE_PATTERNS) {
      p.pattern.lastIndex = 0;
      if (p.pattern.test(text)) matches++;
    }
    return Math.min(1.0, matches * 0.4);
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: 0.75,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation', 'code'],
      skipTransformations: [],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    const rawMatches: Array<{
      origMatch: string;
      origStart: number;
      origEnd: number;
      replacement: string;
      reason: string;
    }> = [];

    for (const item of RESTRUCTURE_PATTERNS) {
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

        rawMatches.push({
          origMatch,
          origStart,
          origEnd,
          replacement,
          reason: `Restructured clause opening: "${origMatch.trim()}" -> "${replacement.trim()}"`,
        });
      }
    }

    if (rawMatches.length === 0) {
      return this.createFailedResult(text, 'No clause openings eligible for restructuring');
    }

    // Sort descending by position so back-to-front replacement never drifts
    rawMatches.sort((a, b) => b.origStart - a.origStart);

    // Filter out overlapping matches
    const nonOverlapping: typeof rawMatches = [];
    let lastStart = Infinity;
    for (const m of rawMatches) {
      if (m.origEnd <= lastStart) {
        nonOverlapping.push(m);
        lastStart = m.origStart;
      }
    }

    let modifiedText = text;
    const modifications: Modification[] = [];

    for (const item of nonOverlapping) {
      modifiedText =
        modifiedText.substring(0, item.origStart) +
        item.replacement +
        modifiedText.substring(item.origEnd);

      modifications.push({
        type: 'sentence-restructure',
        original: { text: item.origMatch, start: item.origStart, end: item.origEnd },
        replacement: item.replacement,
        reason: item.reason,
      });
    }


    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No clause openings eligible for restructuring');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createSentenceRestructureTransformation(): SentenceRestructureTransformation {
  return new SentenceRestructureTransformation();
}
