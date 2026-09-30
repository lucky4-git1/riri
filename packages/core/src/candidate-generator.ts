/**
 * Candidate Generator
 * 
 * Executes transformation plans to generate diverse rewriting candidates,
 * applying validation checks at each step with instant rollback capability.
 */

import type {
  Candidate,
  TransformationContext,
  TransformationPlan,
  Transformation,
  AppliedTransformation,
  QualityScorer,
  ProtectedSpan,
} from '@riri/types';

export interface GeneratorOptions {
  maxCandidates?: number;
  transformations: Map<string, Transformation>;
  scorer: QualityScorer;
}

export class CandidateGenerator {
  private maxCandidates: number;
  private transformations: Map<string, Transformation>;
  private scorer: QualityScorer;

  constructor(options: GeneratorOptions) {
    this.maxCandidates = options.maxCandidates ?? 5;
    this.transformations = options.transformations;
    this.scorer = options.scorer;
  }

  /**
   * Generate candidates from plan
   */
  async generate(
    originalText: string,
    plan: TransformationPlan,
    baseContext: TransformationContext,
    protectedSpans: ProtectedSpan[]
  ): Promise<Candidate[]> {
    const candidates: Candidate[] = [];
    const ordered = [...plan.recommendedTransformations].sort((a, b) => b.priority - a.priority);
    const structuralFirst = [...ordered].sort((a, b) => Number(b.id === 'structural-rewrite') - Number(a.id === 'structural-rewrite'));
    const conciseFirst = [...ordered].sort((a, b) => Number(['concision', 'redundancy-removal'].includes(b.id)) - Number(['concision', 'redundancy-removal'].includes(a.id)));
    const lexicalOnly = ordered.filter(item => ['contextual-lexical', 'conservative-synonym', 'phrase-substitution'].includes(item.id));
    const strategies = [
      { name: 'balanced', decisions: ordered, scale: 1 },
      { name: 'structural-first', decisions: structuralFirst, scale: 0.9 },
      { name: 'concise', decisions: conciseFirst, scale: 0.85 },
      { name: 'conservative', decisions: ordered, scale: 0.55 },
      { name: 'lexical', decisions: lexicalOnly, scale: 0.75 },
    ];

    for (const strategy of strategies) {
      if (candidates.length >= this.maxCandidates || strategy.decisions.length === 0) break;
      const candidate = await this.buildCumulativeCandidate(originalText, strategy.decisions, baseContext, protectedSpans, strategy.scale);
      if (candidate && candidate.text !== originalText && !candidates.some(item => item.text === candidate.text)) {
        candidate.strategy = strategy.name;
        candidates.push(candidate);
      }
    }

    for (const decision of ordered) {
      if (candidates.length >= this.maxCandidates) break;
      const candidate = await this.buildSingleCandidate(originalText, decision.id, decision.strength, baseContext, protectedSpans);
      if (candidate && candidate.text !== originalText && !candidates.some(item => item.text === candidate.text)) {
        candidate.strategy = decision.id;
        candidates.push(candidate);
      }
    }
    return candidates;
  }

  private async buildCumulativeCandidate(
    originalText: string,
    decisions: TransformationPlan['recommendedTransformations'],
    baseContext: TransformationContext,
    protectedSpans: ProtectedSpan[],
    strengthScale: number
  ): Promise<Candidate | null> {
    let currentText = originalText;
    const appliedTransformations: AppliedTransformation[] = [];

    for (const decision of decisions) {
      const transform = this.transformations.get(decision.id);
      if (!transform) continue;

      const context: TransformationContext = {
        ...baseContext,
        strength: Math.max(0.1, Math.min(1.0, decision.strength * strengthScale)),
      };

      try {
        const result = await transform.execute(currentText, context);

        if (result.applied && result.text !== currentText) {
          // Pre-validation: ensure protected content wasn't lost
          const validation = await transform.validate(currentText, result.text, context);
          if (validation.valid) {
            currentText = result.text;
            appliedTransformations.push({
              id: transform.id,
              name: transform.name,
              confidence: result.confidence,
              modifications: result.modifications,
            });
          }
          // Otherwise rollback: do not update currentText!
        }
      } catch {
        // Safe rollback on error: continue with previous state
      }
    }

    if (appliedTransformations.length === 0) return null;

    const quality = await this.scorer.score(originalText, currentText, {
      protectedSpans,
      features: baseContext.features,
      mode: baseContext.mode,
    });

    return {
      text: currentText,
      quality,
      transformations: appliedTransformations,
      score: quality.overallQuality,
    };
  }

  private async buildSingleCandidate(
    originalText: string,
    transformId: string,
    strength: number,
    baseContext: TransformationContext,
    protectedSpans: ProtectedSpan[]
  ): Promise<Candidate | null> {
    const transform = this.transformations.get(transformId);
    if (!transform) return null;

    const context: TransformationContext = {
      ...baseContext,
      strength,
    };

    try {
      const result = await transform.execute(originalText, context);
      if (!result.applied || result.text === originalText) return null;

      const validation = await transform.validate(originalText, result.text, context);
      if (!validation.valid) return null;

      const quality = await this.scorer.score(originalText, result.text, {
        protectedSpans,
        features: baseContext.features,
        mode: baseContext.mode,
      });

      return {
        text: result.text,
        quality,
        transformations: [
          {
            id: transform.id,
            name: transform.name,
            confidence: result.confidence,
            modifications: result.modifications,
          },
        ],
        score: quality.overallQuality,
      };
    } catch {
      return null;
    }
  }
}

export function createCandidateGenerator(options: GeneratorOptions): CandidateGenerator {
  return new CandidateGenerator(options);
}
