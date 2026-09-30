import type { Modification, TransformationContext, TransformationPlan, TransformationResult } from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

type StructuralRule = { pattern: RegExp; replacement: string | ((match: string, ...args: string[]) => string); reason: string };

const RULES: StructuralRule[] = [
  // Nominalized predicate compression
  { pattern: /\bmade a decision to\s+/gi, replacement: 'decided to ', reason: 'Compressed nominalized predicate' },
  { pattern: /\bconducted an analysis of\s+/gi, replacement: 'analyzed ', reason: 'Compressed nominalized predicate' },
  { pattern: /\bhad a strong inhibitory effect on\s+/gi, replacement: 'strongly suppressed ', reason: 'Rephrased nominalized predicate into active verb phrase' },
  { pattern: /\bhas a strong inhibitory effect on\s+/gi, replacement: 'strongly suppresses ', reason: 'Rephrased nominalized predicate into active verb phrase' },
  { pattern: /\bhave a strong inhibitory effect on\s+/gi, replacement: 'strongly suppress ', reason: 'Rephrased nominalized predicate into active verb phrase' },
  { pattern: /\bhad an? inhibitory effect on\s+/gi, replacement: 'inhibited ', reason: 'Rephrased nominalized predicate into direct verb' },
  { pattern: /\bhas an? inhibitory effect on\s+/gi, replacement: 'inhibits ', reason: 'Rephrased nominalized predicate into direct verb' },
  { pattern: /\bprovides? protection against\s+/gi, replacement: 'protects against ', reason: 'Rephrased predicate' },
  { pattern: /\bcauses? (?:an? )?(?:increase|elevation) in\s+/gi, replacement: 'increases ', reason: 'Compressed causative phrase' },
  { pattern: /\bcauses? (?:an? )?(?:reduction|decrease) in\s+/gi, replacement: 'reduces ', reason: 'Compressed causative phrase' },
  { pattern: /\bplays? an? (?:important|vital|crucial|key)? role in\s+/gi, replacement: 'is vital to ', reason: 'Compressed idiom' },
  { pattern: /\bmakes? a contribution to\s+/gi, replacement: 'contributes to ', reason: 'Compressed nominalization' },

  // Causal and approval predicates
  { pattern: /\bhas decided\s+(?:to\s+)?not\s+(?:to\s+)?approve\s+(the\s+)?([^,.]+?)(?=\s+(?:because|due to)|[,.]|$)/gi, replacement: (_match, article, object) => `rejected ${article ?? ''}${object}`, reason: 'Re-expressed negative approval as direct predicate' },
  { pattern: /\bdecided\s+(?:to\s+)?not\s+(?:to\s+)?approve\s+(the\s+)?([^,.]+?)(?=\s+(?:because|due to)|[,.]|$)/gi, replacement: (_match, article, object) => `rejected ${article ?? ''}${object}`, reason: 'Re-expressed negative approval as direct predicate' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because', reason: 'Converted verbose causal clause' },
  { pattern: /\b(?:absolutely|completely|entirely)\s+(?=(?:inadequate|unnecessary|essential|clear)\b)/gi, replacement: '', reason: 'Removed unsupported intensifier' },
  { pattern: /\b(?:furthermore|moreover)\s+(?=(?:completely|entirely)?\s*(?:unnecessary|redundant)\b)/gi, replacement: '', reason: 'Integrated coordinated predicate' },

  // Relative clause & form delivery restructuring
  { pattern: /\bcomes in capsules that are simple to inject into\b/gi, replacement: 'is formulated in capsules designed for easy administration into', reason: 'Restructured formulation and delivery clause' },
  { pattern: /\bthat are simple to ([a-z]+) into\b/gi, replacement: 'designed for straightforward $1ion into', reason: 'Rephrased relative clause' },
  { pattern: /\bthat are simple to ([a-z]+)\b/gi, replacement: 'easy to $1', reason: 'Compressed relative clause' },
  { pattern: /\bthat are easy to ([a-z]+)\b/gi, replacement: 'readily $1ed', reason: 'Compressed relative clause' },
  { pattern: /\bthat were resistant to\b/gi, replacement: 'displaying resistance to', reason: 'Rephrased relative clause into participial phrase' },
  { pattern: /\bthose resistant to\b/gi, replacement: 'strains resistant to', reason: 'Clarified referent in comparative clause' },
  { pattern: /\bwhether in the free-state or inside a cell\b/gi, replacement: 'both extracellularly and intracellularly', reason: 'Synthesized dual-state condition' },
  { pattern: /\bdifferent medicines such as\b/gi, replacement: 'various medications, such as', reason: 'Elevated professional register' },
  { pattern: /\bdifferent medicines such\b/gi, replacement: 'various medications such as', reason: 'Corrected syntax and elevated register' },

  // Passive voice refinement
  { pattern: /\b(?:are|were) inhibited by\b/gi, replacement: 'are suppressed by', reason: 'Varied passive verb construction' },
  { pattern: /\b(?:is|was) inhibited by\b/gi, replacement: 'is suppressed by', reason: 'Varied passive verb construction' },
  { pattern: /\b(?:are|were) isolated from\b/gi, replacement: 'were harvested from', reason: 'Rephrased passive origin clause' },
  { pattern: /\brecurrent vaginal episodes\b/gi, replacement: 'recurrent vaginal infections', reason: 'Refined medical precision' },
  { pattern: /\breturning the ([a-z ]+?) to normal\b/gi, replacement: 'restoring normal $1', reason: 'Restructured outcome clause' },
];


export class StructuralRewriteTransformation extends BaseTransformation {
  readonly id = 'structural-rewrite';
  readonly name = 'Structural Rewrite';
  readonly description = 'Re-expresses sentence predicates and coordinated clauses while preserving anchors';

  async applicability(text: string): Promise<number> {
    return RULES.some(rule => rule.pattern.test(text)) ? 0.85 : 0;
  }

  async plan(_text: string, context: TransformationContext): Promise<TransformationPlan> {
    return { complexity: context.features.complexity, recommendedTransformations: [{ id: this.id, priority: 0.9, strength: context.strength }], preserve: ['protected-content', 'negation'], skipTransformations: [] };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    let output = text;
    const modifications: Modification[] = [];
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      output = output.replace(rule.pattern, (match, ...args) => {
        const offset = args.at(-2) as number;
        if (this.isProtected(offset, context.protectedSpans)) return match;
        const replacement = typeof rule.replacement === 'function' ? rule.replacement(match, ...args.slice(0, -2) as string[]) : rule.replacement;
        if (match === replacement) return match;
        modifications.push({ type: 'structural-change', original: { text: match, start: offset, end: offset + match.length }, replacement, reason: rule.reason });
        return replacement;
      });
    }
    output = output.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1');
    return modifications.length ? this.createResult(output, modifications, text) : this.createFailedResult(text, 'No safe structural rewrite was applicable');
  }
}

export function createStructuralRewriteTransformation(): StructuralRewriteTransformation {
  return new StructuralRewriteTransformation();
}
