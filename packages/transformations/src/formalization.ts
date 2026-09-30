/**
 * Formalization Transformation
 * 
 * Replaces colloquialisms, phrasal verbs, and informal expressions
 * with elevated, professional, or academic vocabulary.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface FormalizationEntry {
  pattern: RegExp;
  replacement: string;
}

const FORMALIZATION_PATTERNS: FormalizationEntry[] = [
  // Contractions and slang (high priority)
  { pattern: /\bgotta\b/gi, replacement: 'must' },
  { pattern: /\bwanna\b/gi, replacement: 'want to' },
  { pattern: /\bgonna\b/gi, replacement: 'going to' },
  { pattern: /\bkinda\b/gi, replacement: 'somewhat' },
  { pattern: /\bsorta\b/gi, replacement: 'somewhat' },
  { pattern: /\bdunno\b/gi, replacement: 'do not know' },
  { pattern: /\byeah\b/gi, replacement: 'yes' },
  { pattern: /\bnope\b/gi, replacement: 'no' },
  { pattern: /\b'cause\b/gi, replacement: 'because' },
  { pattern: /\bkids\b/gi, replacement: 'children' },
  { pattern: /\bguys\b/gi, replacement: 'individuals' },
  { pattern: /\bawesome\b/gi, replacement: 'excellent' },
  { pattern: /\bstuff\b/gi, replacement: 'material' },
  // Phrasal verbs
  { pattern: /\ba lot of\b/gi, replacement: 'numerous' },
  { pattern: /\blots of\b/gi, replacement: 'numerous' },
  { pattern: /\bget rid of\b/gi, replacement: 'eliminate' },
  { pattern: /\bgets rid of\b/gi, replacement: 'eliminates' },
  { pattern: /\bgot rid of\b/gi, replacement: 'eliminated' },
  { pattern: /\bfigure out\b/gi, replacement: 'determine' },
  { pattern: /\bfigures out\b/gi, replacement: 'determines' },
  { pattern: /\bfigured out\b/gi, replacement: 'determined' },
  { pattern: /\blook into\b/gi, replacement: 'investigate' },
  { pattern: /\blooks into\b/gi, replacement: 'investigates' },
  { pattern: /\blooked into\b/gi, replacement: 'investigated' },
  { pattern: /\blooking into\b/gi, replacement: 'investigating' },
  { pattern: /\bdeal with\b/gi, replacement: 'address' },
  { pattern: /\bdeals with\b/gi, replacement: 'addresses' },
  { pattern: /\bdealt with\b/gi, replacement: 'addressed' },
  { pattern: /\btalk about\b/gi, replacement: 'discuss' },
  { pattern: /\btalks about\b/gi, replacement: 'discusses' },
  { pattern: /\btalked about\b/gi, replacement: 'discussed' },
  { pattern: /\bcome up with\b/gi, replacement: 'devise' },
  { pattern: /\bcomes up with\b/gi, replacement: 'devises' },
  { pattern: /\bcame up with\b/gi, replacement: 'devised' },
  { pattern: /\bput off\b/gi, replacement: 'postpone' },
  { pattern: /\bturn down\b/gi, replacement: 'reject' },
  { pattern: /\bturns down\b/gi, replacement: 'rejects' },
  { pattern: /\bturned down\b/gi, replacement: 'rejected' },
  { pattern: /\bshow up\b/gi, replacement: 'appear' },
  { pattern: /\bshows up\b/gi, replacement: 'appears' },
  { pattern: /\bshowed up\b/gi, replacement: 'appeared' },
  { pattern: /\bcheck out\b/gi, replacement: 'examine' },
  { pattern: /\bchecks out\b/gi, replacement: 'examines' },
  { pattern: /\bchecked out\b/gi, replacement: 'examined' },
  { pattern: /\bset up\b/gi, replacement: 'establish' },
  { pattern: /\bsets up\b/gi, replacement: 'establishes' },
  { pattern: /\bgrab\b/gi, replacement: 'obtain' },
  { pattern: /\bgood enough\b/gi, replacement: 'adequate' },
];


export class FormalizationTransformation extends BaseTransformation {
  readonly id = 'formalization';
  readonly name = 'Formalization';
  readonly description = 'Converts informal expressions and phrasal verbs into professional register';

  async applicability(text: string, context: TransformationContext): Promise<number> {
    let matchCount = 0;
    for (const item of FORMALIZATION_PATTERNS) {
      item.pattern.lastIndex = 0;
      if (item.pattern.test(text)) matchCount++;
    }

    const base = Math.min(1.0, matchCount * 0.35);
    if (context.mode === 'formal' || context.mode === 'academic') {
      return Math.min(1.0, base * 1.4);
    }
    return base;
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: context.mode === 'formal' || context.mode === 'academic' ? 0.95 : 0.65,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation', 'code', 'citations'],
      skipTransformations: ['simplification'],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    const modifications: Modification[] = [];
    let modifiedText = text;
    let cumulativeOffset = 0;

    const maxSubstitutions = Math.max(1, Math.ceil(context.strength * 5));

    // Collect all matches across all patterns first
    interface PendingMatch {
      origStart: number;
      origEnd: number;
      origMatch: string;
      replacement: string;
    }
    const pendingMatches: PendingMatch[] = [];

    for (const item of FORMALIZATION_PATTERNS) {
      item.pattern.lastIndex = 0;
      const matches = [...text.matchAll(item.pattern)];

      for (const match of matches) {
        if (match.index === undefined) continue;
        if (this.isProtected(match.index, context.protectedSpans)) continue;

        const origMatch = match[0];
        let replacement = item.replacement;
        if (origMatch[0] === origMatch[0].toUpperCase() && origMatch[0] !== origMatch[0].toLowerCase()) {
          replacement = replacement[0].toUpperCase() + replacement.slice(1);
        }

        pendingMatches.push({
          origStart: match.index,
          origEnd: match.index + origMatch.length,
          origMatch,
          replacement,
        });
      }
    }

    // Sort by start position ascending to ensure correct cumulative offset tracking
    pendingMatches.sort((a, b) => a.origStart - b.origStart);

    // Remove overlapping matches (keep the first one in case of overlap)
    const nonOverlapping: PendingMatch[] = [];
    let lastEnd = -1;
    for (const m of pendingMatches) {
      if (m.origStart >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.origEnd;
      }
    }

    // Apply substitutions in order, up to maxSubstitutions
    for (const m of nonOverlapping) {
      if (modifications.length >= maxSubstitutions) break;

      const adjustedStart = m.origStart + cumulativeOffset;
      const adjustedEnd = m.origEnd + cumulativeOffset;

      modifiedText =
        modifiedText.substring(0, adjustedStart) +
        m.replacement +
        modifiedText.substring(adjustedEnd);

      cumulativeOffset += m.replacement.length - m.origMatch.length;

      modifications.push({
        type: 'formalization',
        original: { text: m.origMatch, start: m.origStart, end: m.origEnd },
        replacement: m.replacement,
        reason: `Elevated informal phrase: "${m.origMatch}" -> "${m.replacement}"`,
      });
    }

    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No informal expressions found for formalization');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createFormalizationTransformation(): FormalizationTransformation {
  return new FormalizationTransformation();
}

