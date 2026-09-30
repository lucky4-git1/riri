import type { Modification, TransformationContext, TransformationPlan, TransformationResult } from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

type LexicalCandidate = {
  source: string;
  replacement: string;
  modes?: TransformationContext['mode'][];
  left?: RegExp;
  right?: RegExp;
};

// Curated phrase-level candidates. Context guards avoid treating a thesaurus as grammar.
const CANDIDATES: LexicalCandidate[] = [
  { source: 'a large number of', replacement: 'many', modes: ['concise', 'simple', 'standard'] },
  { source: 'in order to', replacement: 'to', modes: ['concise', 'simple', 'standard'] },
  { source: 'at this point in time', replacement: 'now', modes: ['concise', 'simple'] },
  { source: 'provide assistance', replacement: 'help', modes: ['simple', 'concise', 'fluency'] },
  { source: 'utilize', replacement: 'use', modes: ['simple', 'concise', 'fluency'] },
  { source: 'help', replacement: 'assist', modes: ['academic', 'professional', 'formal'], left: /(?:will|can|to)\s*$/i },
  { source: 'show', replacement: 'demonstrate', modes: ['academic', 'formal'], left: /(?:results?|evidence|data)\s*$/i },
];

export class ContextualLexicalTransformation extends BaseTransformation {
  readonly id = 'contextual-lexical';
  readonly name = 'Contextual Lexical Rewrite';
  readonly description = 'Uses mode and local phrase context to select safe lexical alternatives';

  async applicability(text: string, context: TransformationContext): Promise<number> {
    return CANDIDATES.some(candidate => this.matches(text, candidate, context)) ? 0.5 : 0;
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return { complexity: context.features.complexity, recommendedTransformations: [{ id: this.id, priority: 0.65, strength: context.strength }], preserve: ['protected-content', 'negation'], skipTransformations: [] };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    let output = text;
    const modifications: Modification[] = [];
    for (const candidate of CANDIDATES) {
      if (!this.matches(output, candidate, context)) continue;
      const pattern = new RegExp(`\\b${candidate.source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&').replace(/\\ /g, '\\s+')}\\b`, 'i');
      const match = pattern.exec(output);
      if (!match || this.isProtected(match.index, context.protectedSpans)) continue;
      const replacement = this.matchCapitalization(match[0], candidate.replacement);
      output = `${output.slice(0, match.index)}${replacement}${output.slice(match.index + match[0].length)}`;
      modifications.push({ type: 'contextual-lexical', original: { text: match[0], start: match.index, end: match.index + match[0].length }, replacement, reason: 'Selected for compatible local context and writing mode' });
      if (modifications.length >= Math.max(1, Math.round(context.strength * 3))) break;
    }
    return modifications.length ? this.createResult(output, modifications, text) : this.createFailedResult(text, 'No compatible contextual lexical candidate');
  }

  private matches(text: string, candidate: LexicalCandidate, context: TransformationContext): boolean {
    if (candidate.modes && !candidate.modes.includes(context.mode)) return false;
    const index = text.toLowerCase().indexOf(candidate.source.toLowerCase());
    if (index < 0) return false;
    const before = text.slice(Math.max(0, index - 40), index);
    const after = text.slice(index + candidate.source.length, index + candidate.source.length + 40);
    return (!candidate.left || candidate.left.test(before)) && (!candidate.right || candidate.right.test(after));
  }

  private matchCapitalization(original: string, replacement: string): string {
    return /^[A-Z]/.test(original) ? `${replacement[0].toUpperCase()}${replacement.slice(1)}` : replacement;
  }
}

export function createContextualLexicalTransformation(): ContextualLexicalTransformation {
  return new ContextualLexicalTransformation();
}
