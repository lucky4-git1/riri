/**
 * Heuristic Decision Engine
 * 
 * Deterministic rule-based planner for writing transformations.
 * Operates offline with zero model dependencies and sub-millisecond latency.
 */

import type {
  DecisionEngine,
  DecisionFeatures,
  DecisionContext,
  TransformationPlan,
  TransformationDecision,
  ValidationResult,
} from '@riri/types';
import { getModeProfile } from './mode-profiles.js';

export class HeuristicDecisionEngine implements DecisionEngine {
  /**
   * Refine or normalize features before planning
   */
  async analyze(features: DecisionFeatures): Promise<DecisionFeatures> {
    return {
      ...features,
      aggressiveness: Math.max(0, Math.min(1, features.aggressiveness)),
      complexity: Math.max(0, Math.min(1, features.complexity)),
    };
  }

  /**
   * Create a transformation plan based on linguistic features and context
   */
  async plan(
    features: DecisionFeatures,
    context: DecisionContext
  ): Promise<TransformationPlan> {
    const profile = getModeProfile(context.mode);
    const aggressiveness = context.aggressiveness ?? profile.defaultAggressiveness;
    const maxTransformations = context.maxTransformations || 6;

    const decisions: TransformationDecision[] = [];

    // Base recommendations from mode profile
    for (const pref of profile.preferredTransformations) {
      if (profile.skipTransformations.includes(pref.id)) {
        continue;
      }

      let priority = 0.5 * pref.priorityMultiplier;
      let strength = aggressiveness * pref.strengthMultiplier;

      // Adjust based on linguistic features
      if (pref.id === 'simplification' && features.complexity > 0.6) {
        priority += 0.25;
        strength = Math.min(1.0, strength * 1.2);
      }

      if (pref.id === 'sentence-split' && features.averageSentenceLength > 25) {
        priority += 0.3;
        strength = Math.min(1.0, strength * 1.3);
      }

      if (pref.id === 'redundancy-removal' && features.repetitionScore > 0.15) {
        priority += 0.25;
        strength = Math.min(1.0, strength * 1.2);
      }

      if (pref.id === 'phrase-substitution' && features.complexity > 0.4) {
        priority += 0.15;
      }

      // If text is heavily technical, dial back synonym replacement
      if (pref.id === 'conservative-synonym' && features.technicalTermRatio > 0.15) {
        priority -= 0.15;
        strength *= 0.7;
      }

      decisions.push({
        id: pref.id,
        priority: Math.max(0.1, Math.min(1.0, priority)),
        strength: Math.max(0.05, Math.min(1.0, strength)),
        confidence: 0.9,
      });
    }

    // Sort by priority descending
    decisions.sort((a, b) => b.priority - a.priority);

    // Limit to maxTransformations
    const recommendedTransformations = decisions.slice(0, maxTransformations);

    // Build preservation list
    const preserve = new Set<string>(profile.preserve);
    if (features.hasNumbers) preserve.add('numbers');
    if (features.hasUrls) preserve.add('urls');
    if (features.hasCode) preserve.add('code');
    if (features.protectedEntityCount > 0) preserve.add('entities');
    preserve.add('negation');

    return {
      complexity: features.complexity,
      recommendedTransformations,
      preserve: Array.from(preserve),
      skipTransformations: [...profile.skipTransformations],
      reasoning: `Heuristic plan generated for ${context.mode} mode (aggressiveness: ${aggressiveness.toFixed(2)})`,
    };
  }

  /**
   * Validate a plan for safety
   */
  async validatePlan(plan: TransformationPlan): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!plan.preserve.includes('negation')) {
      issues.push('Plan must preserve negation');
    }

    if (plan.recommendedTransformations.length === 0) {
      warnings.push('Plan has no recommended transformations');
    }

    // Check for duplicate transformation IDs
    const ids = plan.recommendedTransformations.map(t => t.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      issues.push('Plan contains duplicate transformation IDs');
    }

    return {
      valid: issues.length === 0,
      confidence: issues.length === 0 ? 0.95 : 0.0,
      issues,
      warnings,
    };
  }
}

export function createHeuristicDecisionEngine(): HeuristicDecisionEngine {
  return new HeuristicDecisionEngine();
}
