/**
 * Quality Scorer
 * 
 * Implements QualityScorer interface from @riri/types.
 * Combines semantic preservation, grammar correctness, naturalness, and protected content checks.
 */

import type {
  QualityScorer as IQualityScorer,
  QualityMetrics,
  QualityIssue,
  ScoringContext,
  AdvancedQualityMetrics,
} from '@riri/types';
import { SemanticScorer } from './semantic-scorer.js';
import { NaturalnessScorer } from './naturalness-scorer.js';
import { GrammarScorer } from './grammar-scorer.js';

export class QualityScorer implements IQualityScorer {
  private semanticScorer: SemanticScorer;
  private naturalnessScorer: NaturalnessScorer;
  private grammarScorer: GrammarScorer;

  constructor() {
    this.semanticScorer = new SemanticScorer();
    this.naturalnessScorer = new NaturalnessScorer();
    this.grammarScorer = new GrammarScorer();
  }

  async score(
    original: string,
    transformed: string,
    context: ScoringContext
  ): Promise<QualityMetrics> {
    const issues: QualityIssue[] = [];

    // 1. Semantic preservation
    const semanticPreservation = this.semanticScorer.score(original, transformed);
    if (semanticPreservation < 0.5) {
      issues.push({
        severity: 'warning',
        type: 'low-semantic-preservation',
        message: `Semantic preservation score is low: ${(semanticPreservation * 100).toFixed(0)}%`,
      });
    }

    // 2. Grammar score
    const grammarScore = this.grammarScorer.score(transformed);
    if (grammarScore < 0.7) {
      issues.push({
        severity: 'warning',
        type: 'grammar-issues',
        message: `Grammar score is low: ${(grammarScore * 100).toFixed(0)}%`,
      });
    }

    // 3. Naturalness score
    const naturalnessScore = this.naturalnessScorer.score(transformed);
    if (naturalnessScore < 0.6) {
      issues.push({
        severity: 'info',
        type: 'low-naturalness',
        message: `Naturalness score is sub-optimal: ${(naturalnessScore * 100).toFixed(0)}%`,
      });
    }

    // 4. Protected content preservation check
    let protectedContentPreserved = true;
    for (const span of context.protectedSpans || []) {
      if (!transformed.includes(span.value)) {
        protectedContentPreserved = false;
        issues.push({
          severity: 'error',
          type: 'protected-content-missing',
          message: `Protected span "${span.value}" (${span.type}) missing from output`,
        });
      }
    }

    // 5. Calculate overall quality
    let overallQuality =
      0.45 * semanticPreservation +
      0.30 * grammarScore +
      0.25 * naturalnessScore;

    // Severe penalty if protected content was violated
    if (!protectedContentPreserved) {
      overallQuality *= 0.3;
    }

    return {
      semanticPreservation,
      grammarScore,
      naturalnessScore,
      protectedContentPreserved,
      overallQuality: Math.max(0.0, Math.min(1.0, overallQuality)),
      issues,
    };
  }

  async scoreAdvanced(original: string, transformed: string, context: ScoringContext): Promise<AdvancedQualityMetrics> {
    const base = await this.score(original, transformed, context);
    const originalWords = new Set((original.toLowerCase().match(/[a-z]+/g) || []));
    const transformedWords = transformed.toLowerCase().match(/[a-z]+/g) || [];
    const changedWords = transformedWords.filter(word => !originalWords.has(word)).length / Math.max(1, transformedWords.length);
    const sentenceDelta = Math.abs((original.match(/[.!?]+/g) || []).length - (transformed.match(/[.!?]+/g) || []).length);
    const styleAlignment = this.styleAlignment(transformed, context.mode);
    const protectedContent = base.protectedContentPreserved ? 1 : 0;
    const informationPreservation = Math.min(1, base.semanticPreservation + protectedContent * 0.08);
    const hallucinationRisk = this.anchorDelta(original, transformed);
    const usefulness = Math.min(1, 0.55 * base.semanticPreservation + 0.25 * base.naturalnessScore + 0.2 * Math.max(changedWords, sentenceDelta ? 0.2 : 0));
    const overall = Math.max(0, Math.min(1,
      0.28 * base.semanticPreservation + 0.15 * base.grammarScore + 0.12 * base.naturalnessScore +
      0.12 * styleAlignment + 0.1 * informationPreservation + 0.1 * usefulness + 0.08 * protectedContent - 0.25 * hallucinationRisk
    ));
    return {
      semantic: base.semanticPreservation, grammar: base.grammarScore, naturalness: base.naturalnessScore,
      styleAlignment, lexicalDiversity: changedWords, structuralDiversity: Math.min(1, sentenceDelta * 0.5 + (transformed.length !== original.length ? 0.2 : 0)),
      readability: base.naturalnessScore, repetitionReduction: this.repetitionReduction(original, transformed),
      informationPreservation, protectedContent, hallucinationRisk, usefulness, overall,
    };
  }

  private styleAlignment(text: string, mode: ScoringContext['mode']): number {
    const words = text.toLowerCase();
    if (mode === 'concise') return Math.min(1, 0.65 + (text.length < 180 ? 0.2 : 0));
    if (mode === 'simple') return Math.min(1, 0.65 + (words.match(/\b(?:use|help|start|end)\b/g)?.length ?? 0) * 0.05);
    if ((['formal', 'academic', 'professional'] as string[]).includes(mode)) return Math.min(1, 0.65 + (words.match(/\b(?:demonstrate|therefore|assist|analysis)\b/g)?.length ?? 0) * 0.06);
    return 0.8;
  }

  private anchorDelta(original: string, transformed: string): number {
    const anchors: string[] = original.match(/\b[A-Z][A-Za-z0-9_-]*\b|\b\d+(?:\.\d+)?%?\b/g) || [];
    const introduced = (transformed.match(/\b[A-Z][A-Za-z0-9_-]*\b|\b\d+(?:\.\d+)?%?\b/g) || []).filter(token => !anchors.includes(token));
    return introduced.length ? Math.min(1, introduced.length / Math.max(1, anchors.length)) : 0;
  }

  private repetitionReduction(original: string, transformed: string): number {
    const repeated = (text: string) => (text.toLowerCase().match(/\b([a-z]+)\s+\1\b/g) || []).length;
    return Math.max(0, Math.min(1, 0.5 + (repeated(original) - repeated(transformed)) * 0.25));
  }
}

export function createQualityScorer(): QualityScorer {
  return new QualityScorer();
}
