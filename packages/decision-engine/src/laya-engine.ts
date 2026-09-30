/**
 * Laya Decision Engine
 * 
 * ML-backed decision engine using Laya non-autoregressive decision model
 * with automatic, guaranteed fallback to HeuristicDecisionEngine.
 */

import type {
  DecisionEngine,
  DecisionFeatures,
  DecisionContext,
  TransformationPlan,
  TransformationDecision,
  ValidationResult,
} from '@riri/types';
import { HeuristicDecisionEngine } from './heuristic-engine.js';

export interface LayaAdapterLike {
  isReady(): boolean;
  predictDecisions?(features: DecisionFeatures, timeoutMs?: number): Promise<unknown>;
  getLastInferenceMs?(): number | undefined;
}

export interface LayaEngineOptions {
  timeoutMs?: number;
  adapter?: LayaAdapterLike;
}

export class LayaDecisionEngine implements DecisionEngine {
  private fallback: HeuristicDecisionEngine;
  private adapter: LayaAdapterLike | null = null;
  private timeoutMs: number;
  private lastEngineUsed: 'laya' | 'heuristic' = 'heuristic';
  private lastFallbackReason: string | null = null;

  constructor(options: LayaEngineOptions = {}) {
    this.fallback = new HeuristicDecisionEngine();
    this.timeoutMs = options.timeoutMs ?? 250;
    this.adapter = options.adapter || null;
  }

  setAdapter(adapter: LayaAdapterLike): void {
    this.adapter = adapter;
  }

  getEngineUsed(): 'laya' | 'heuristic' {
    return this.lastEngineUsed;
  }

  getFallbackReason(): string | null {
    return this.lastFallbackReason;
  }

  getDiagnostics(): { engine: 'laya' | 'heuristic'; fallbackUsed: boolean; layaInferenceMs?: number } {
    return {
      engine: this.lastEngineUsed,
      fallbackUsed: this.lastFallbackReason !== null,
      layaInferenceMs: this.adapter?.getLastInferenceMs?.(),
    };
  }

  async analyze(features: DecisionFeatures): Promise<DecisionFeatures> {
    return this.fallback.analyze(features);
  }

  /**
   * Plan transformations using Laya model if available, falling back to heuristic engine.
   */
  async plan(
    features: DecisionFeatures,
    context: DecisionContext
  ): Promise<TransformationPlan> {
    // If no adapter or adapter is not ready, use heuristic immediately
    if (!this.adapter || !this.adapter.isReady()) {
      this.lastEngineUsed = 'heuristic';
      this.lastFallbackReason = 'Laya adapter not available or not ready';
      return this.fallback.plan(features, context);
    }

    try {
      // Execute with timeout
      const layaPromise = this.adapter.predictDecisions
        ? this.adapter.predictDecisions(features, this.timeoutMs)
        : Promise.reject(new Error('predictDecisions not implemented on adapter'));

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Laya inference timed out after ${this.timeoutMs}ms`)),
          this.timeoutMs
        )
      );

      const rawResult = await Promise.race([layaPromise, timeoutPromise]);
      const validatedPlan = this.validateAndNormalizeLayaOutput(rawResult, features, context);

      if (validatedPlan) {
        this.lastEngineUsed = 'laya';
        this.lastFallbackReason = null;
        return validatedPlan;
      }

      // Output failed validation -> fallback
      this.lastEngineUsed = 'heuristic';
      this.lastFallbackReason = 'Laya output schema validation failed';
      return this.fallback.plan(features, context);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastEngineUsed = 'heuristic';
      this.lastFallbackReason = `Laya error: ${msg}`;
      return this.fallback.plan(features, context);
    }
  }

  /**
   * Validate that Laya model output matches expected schema
   */
  private validateAndNormalizeLayaOutput(
    output: unknown,
    features: DecisionFeatures,
    context: DecisionContext
  ): TransformationPlan | null {
    if (!output || typeof output !== 'object') {
      return null;
    }

    const obj = output as Record<string, unknown>;

    if (!Array.isArray(obj.recommendedTransformations)) {
      return null;
    }

    const decisions: TransformationDecision[] = [];
    for (const item of obj.recommendedTransformations) {
      if (typeof item !== 'object' || item === null) continue;
      const t = item as Record<string, unknown>;
      if (typeof t.id !== 'string') continue;

      const priority = typeof t.priority === 'number' ? Math.max(0, Math.min(1, t.priority)) : 0.5;
      const strength = typeof t.strength === 'number' ? Math.max(0, Math.min(1, t.strength)) : 0.3;

      decisions.push({
        id: t.id,
        priority,
        strength,
        confidence: typeof t.confidence === 'number' ? t.confidence : 0.85,
      });
    }

    if (decisions.length === 0) {
      return null;
    }

    const preserve: string[] = Array.isArray(obj.preserve)
      ? (obj.preserve.filter(p => typeof p === 'string') as string[])
      : [];

    if (!preserve.includes('negation')) {
      preserve.push('negation');
    }

    const skipTransformations: string[] = Array.isArray(obj.skipTransformations)
      ? (obj.skipTransformations.filter(s => typeof s === 'string') as string[])
      : [];

    return {
      complexity: typeof obj.complexity === 'number' ? obj.complexity : features.complexity,
      recommendedTransformations: decisions.slice(0, context.maxTransformations || 6),
      preserve,
      skipTransformations,
      reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : 'Laya decision plan',
    };
  }

  async validatePlan(plan: TransformationPlan): Promise<ValidationResult> {
    return this.fallback.validatePlan(plan);
  }
}

export function createLayaDecisionEngine(options?: LayaEngineOptions): LayaDecisionEngine {
  return new LayaDecisionEngine(options);
}
