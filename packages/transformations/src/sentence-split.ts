/**
 * Sentence Split Transformation
 * 
 * Splits long compound or run-on sentences into shorter, clearer independent sentences.
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface SplitPattern {
  pattern: RegExp;
  replacement: string;
}

const SPLIT_PATTERNS: SplitPattern[] = [
  // Semicolon followed by whitespace and word
  {
    pattern: /;\s+([a-z])/g,
    replacement: '. $1',
  },
  // ", and therefore," -> ". Therefore,"
  {
    pattern: /,\s+and\s+therefore,?\s+([a-z])/gi,
    replacement: '. Therefore, $1',
  },
  // ", and as a result," -> ". As a result,"
  {
    pattern: /,\s+and\s+as\s+a\s+result,?\s+([a-z])/gi,
    replacement: '. As a result, $1',
  },
  // ", and consequently," -> ". Consequently,"
  {
    pattern: /,\s+and\s+consequently,?\s+([a-z])/gi,
    replacement: '. Consequently, $1',
  },
  // ", furthermore," -> ". Furthermore,"
  {
    pattern: /,\s+furthermore,?\s+([a-z])/gi,
    replacement: '. Furthermore, $1',
  },
  // ", moreover," -> ". Moreover,"
  {
    pattern: /,\s+moreover,?\s+([a-z])/gi,
    replacement: '. Moreover, $1',
  },
  // ", however," with independent clause -> ". However,"
  {
    pattern: /,\s+however,?\s+([a-z])/gi,
    replacement: '. However, $1',
  },
  // Run-on: "and they/he/she/it/the/this" after verb — split repeated subject chains
  {
    pattern: /\s+and\s+(they|he|she|it|the|this|these|those)\s+/g,
    replacement: '. $1 ',
  },
  // ", and also," -> ". Additionally,"
  {
    pattern: /,?\s+and\s+also,?\s+([a-z])/gi,
    replacement: '. Additionally, $1',
  },
  // Trailing participial clauses in long sentences
  {
    pattern: /,\s+resulting\s+in\s+([a-z])/gi,
    replacement: '. This results in $1',
  },
  {
    pattern: /,\s+returning\s+([a-z])/gi,
    replacement: '. This returns $1',
  },
  {
    pattern: /,\s+leading\s+to\s+([a-z])/gi,
    replacement: '. This leads to $1',
  },
  {
    pattern: /,\s+which\s+guards\s+against\s+/gi,
    replacement: '. It protects against ',
  },
  {
    pattern: /,\s+which\s+protects\s+against\s+/gi,
    replacement: '. It protects against ',
  },
];

export class SentenceSplitTransformation extends BaseTransformation {
  readonly id = 'sentence-split';
  readonly name = 'Sentence Split';
  readonly description = 'Splits overly long compound sentences into concise units';

  async applicability(text: string, context: TransformationContext): Promise<number> {
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 18) return 0.0;

    let matches = 0;
    for (const p of SPLIT_PATTERNS) {
      p.pattern.lastIndex = 0;
      if (p.pattern.test(text)) matches++;
    }

    const base = Math.min(1.0, matches * 0.5);
    return context.features.averageSentenceLength > 25 ? Math.min(1.0, base * 1.5) : base;
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: context.features.averageSentenceLength > 25 ? 0.9 : 0.5,
          strength: context.strength,
        },
      ],
      preserve: ['numbers', 'urls', 'technical_terms', 'negation', 'code'],
      skipTransformations: ['sentence-merge'],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    const modifications: Modification[] = [];
    let modifiedText = text;
    let cumulativeOffset = 0;

    for (const sp of SPLIT_PATTERNS) {
      sp.pattern.lastIndex = 0;
      const matches = [...text.matchAll(sp.pattern)];

      for (const match of matches) {
        if (match.index === undefined) continue;

        const origMatch = match[0];
        const origStart = match.index;
        const origEnd = origStart + origMatch.length;

        if (this.isProtected(origStart, context.protectedSpans)) continue;

        // Capitalize only the first letter of the captured group
        const capturedWord = match[1] || '';
        const capitalizedWord = capturedWord.length > 0
          ? capturedWord[0].toUpperCase() + capturedWord.slice(1)
          : '';
        const replacement = sp.replacement.replace('$1', capitalizedWord);

        const adjustedStart = origStart + cumulativeOffset;
        const adjustedEnd = origEnd + cumulativeOffset;

        modifiedText =
          modifiedText.substring(0, adjustedStart) +
          replacement +
          modifiedText.substring(adjustedEnd);

        cumulativeOffset += replacement.length - origMatch.length;

        modifications.push({
          type: 'sentence-split',
          original: { text: origMatch, start: origStart, end: origEnd },
          replacement,
          reason: 'Split compound clause into separate sentences',
        });
      }
    }

    if (modifications.length === 0) {
      return this.createFailedResult(text, 'No compound structures found to split');
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createSentenceSplitTransformation(): SentenceSplitTransformation {
  return new SentenceSplitTransformation();
}
