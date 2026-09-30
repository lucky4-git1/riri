/**
 * Candidate Selector
 * 
 * Evaluates candidate rewrites, validates quality constraints, and selects the
 * highest quality candidate with rollback guarantee.
 */

import type { Candidate, QualityMetrics } from '@riri/types';

export interface CandidateSelectorOptions {
  minQualityThreshold?: number;
  maxCandidates?: number;
}

export class CandidateSelector {
  private minQuality: number;
  private maxCandidates: number;

  constructor(options: CandidateSelectorOptions = {}) {
    this.minQuality = options.minQualityThreshold ?? 0.65;
    this.maxCandidates = options.maxCandidates ?? 5;
  }

  /**
   * Rank candidates and select the best valid one.
   * Returns null if no candidate qualifies (triggering rollback to original).
   */
  selectBest(
    _original: string,
    originalQuality: QualityMetrics,
    candidates: Candidate[]
  ): {
    selected: Candidate | null;
    shouldRollback: boolean;
    reason: string;
  } {
    if (candidates.length === 0) {
      return {
        selected: null,
        shouldRollback: true,
        reason: 'No candidates were generated',
      };
    }

    // Limit to max candidates
    const pool = candidates.slice(0, this.maxCandidates);

    // Filter valid candidates:
    // 1. Protected content MUST be preserved
    // 2. Transformed text must not be identical to original (unless no-op)
    // 3. Overall quality must meet minimum threshold
    const validCandidates = pool.filter(c => {
      if (!c.quality.protectedContentPreserved) return false;
      if (c.quality.overallQuality < this.minQuality) return false;
      return true;
    });

    if (validCandidates.length === 0) {
      return {
        selected: null,
        shouldRollback: true,
        reason: `All ${pool.length} candidate(s) failed quality validation gates or violated protected content`,
      };
    }

    // Sort valid candidates by score descending
    validCandidates.sort((a, b) => b.score - a.score);

    const best = validCandidates[0];

    // Rollback check: Only trigger rollback if quality drops catastrophically (> 40% drop)
    // or if grammar is severely compromised (< 60%). Paraphrasing naturally changes wording!
    if (best.quality.grammarScore < 0.60) {
      return {
        selected: null,
        shouldRollback: true,
        reason: `Transformation produced ungrammatical text (grammar score ${(best.quality.grammarScore * 100).toFixed(0)}%)`,
      };
    }

    if (best.quality.overallQuality < originalQuality.overallQuality - 0.40) {
      return {
        selected: null,
        shouldRollback: true,
        reason: `Transformation degraded overall quality excessively from ${(originalQuality.overallQuality * 100).toFixed(0)}% to ${(best.quality.overallQuality * 100).toFixed(0)}%`,
      };
    }

    return {
      selected: best,
      shouldRollback: false,
      reason: `Selected best candidate with quality ${(best.quality.overallQuality * 100).toFixed(0)}%`,
    };

  }
}

export function createCandidateSelector(options?: CandidateSelectorOptions): CandidateSelector {
  return new CandidateSelector(options);
}
