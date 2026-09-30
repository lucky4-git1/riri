import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Laya, type LayaOptions } from '@receptron/laya';
import type { DecisionFeatures, ModelMetadata } from '@riri/types';

export const LAYA_ADAPTER_VERSION = '0.2.0';

export interface LayaAdapterOptions {
  modelDir?: string;
  timeoutMs?: number;
  threadCount?: number;
}

export interface LayaAdapterHealth {
  ready: boolean;
  modelLoaded: boolean;
  lastError?: string;
  lastInferenceMs?: number;
}

type LayaDecisionOutput = {
  complexity: number;
  recommendedTransformations: Array<{
    id: string;
    priority: number;
    strength: number;
    confidence: number;
  }>;
  preserve: string[];
  skipTransformations: string[];
  reasoning: string;
  layaInferenceMs: number;
};

/** Laya produces local decision signals; text generation remains downstream. */
export class LayaAdapter {
  private readonly options: Required<LayaAdapterOptions>;
  private model: Laya | null = null;
  private loading: Promise<void> | null = null;
  private lastError: string | undefined;
  private lastInferenceMs: number | undefined;

  constructor(options: LayaAdapterOptions = {}) {
    this.options = {
      modelDir: resolve(options.modelDir ?? 'models/laya'),
      timeoutMs: options.timeoutMs ?? 2_000,
      threadCount: Math.max(1, options.threadCount ?? 4),
    };
  }

  isReady(): boolean {
    return this.model !== null;
  }

  async load(): Promise<void> {
    if (this.model) return;
    if (this.loading) return this.loading;
    if (!existsSync(resolve(this.options.modelDir, 'laya.onnx'))) {
      this.lastError = `Laya model not found at ${this.options.modelDir}`;
      throw new Error(this.lastError);
    }

    this.loading = (async () => {
      try {
        const config: LayaOptions = {
          modelDir: this.options.modelDir,
          executionProviders: ['cpu'],
          sessionOptions: {
            intraOpNumThreads: this.options.threadCount,
            executionMode: 'sequential',
            graphOptimizationLevel: 'all',
          },
        };
        this.model = await Laya.load(config);
        this.lastError = undefined;
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
        throw error;
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  }

  async unload(): Promise<void> {
    const model = this.model;
    this.model = null;
    this.lastInferenceMs = undefined;
    if (model) await model.close();
  }

  async predictDecisions(features: DecisionFeatures, timeoutMs = this.options.timeoutMs): Promise<LayaDecisionOutput> {
    if (!this.model) throw new Error('Laya model is not loaded');
    const start = performance.now();
    const result = await this.withTimeout(this.model.systemOne(
      {
        language: features.language,
        sentenceCount: features.sentenceCount,
        averageSentenceLength: features.averageSentenceLength,
        complexity: features.complexity,
        technicalTermRatio: features.technicalTermRatio,
        repetitionScore: features.repetitionScore,
        passiveVoiceRatio: features.passiveVoiceRatio,
        mode: features.mode,
        aggressiveness: features.aggressiveness,
        protectedEntityCount: features.protectedEntityCount,
      },
      {
        strategy: {
          type: 'choice',
          instructions: 'Choose the safest primary rewrite strategy for this writing profile.',
          criteria: {
            lexical: 'Use conservative contextual lexical changes.',
            concise: 'Compress redundant phrasing while retaining facts.',
            structural: 'Restructure predicates or clauses while retaining facts.',
            fluency: 'Improve natural phrasing with limited structural change.',
            minimal: 'Make only minimal edits because preservation risk is high.',
          },
        },
        strength: {
          type: 'score',
          instructions: 'How much safe rewriting is appropriate?',
          criteria: ['minimal', 'light', 'moderate', 'strong', 'maximum-safe'],
        },
        preserve_structure: {
          type: 'noul',
          instructions: 'Should original structure be preserved because technical or protected content makes changes risky?',
        },
      }
    ), timeoutMs);

    const inferenceMs = performance.now() - start;
    this.lastInferenceMs = inferenceMs;
    const strategy = result.answers.strategy;
    const strength = result.answers.strength;
    const preserveStructure = result.answers.preserve_structure;
    const normalizedStrength = Math.max(0.1, Math.min(1, strength.score / 4));
    const primary = this.strategyToTransformations(strategy.choice, normalizedStrength, strategy.confidence, preserveStructure.noul, features.aggressiveness ?? 0.5);


    return {
      complexity: features.complexity,
      recommendedTransformations: primary,
      preserve: ['numbers', 'urls', 'emails', 'dates', 'citations', 'code', 'negation', 'technical_terms'],
      skipTransformations: preserveStructure.noul >= 0.65 ? ['structural-rewrite', 'sentence-split'] : [],
      reasoning: `Laya selected ${strategy.choice} with ${(strategy.confidence * 100).toFixed(0)}% confidence.`,
      layaInferenceMs: inferenceMs,
    };
  }

  async health(): Promise<LayaAdapterHealth> {
    return { ready: this.isReady(), modelLoaded: this.isReady(), lastError: this.lastError, lastInferenceMs: this.lastInferenceMs };
  }

  metadata(): ModelMetadata {
    return { name: 'Laya', version: LAYA_ADAPTER_VERSION, architecture: 'ModernBERT decision model', parameters: 421_000_000, format: 'onnx', precision: 'fp32', quantized: false };
  }

  getLastInferenceMs(): number | undefined {
    return this.lastInferenceMs;
  }

  private strategyToTransformations(strategy: string, strength: number, confidence: number, preserveStructure: number, aggressiveness = 0.5) {
    const structuralAllowed = preserveStructure < 0.65;
    // If Laya picked 'minimal' but aggressiveness is moderate-to-high, still run structural rewrite and synonym passes
    const effectiveStrategy = strategy === 'minimal' && aggressiveness >= 0.5 ? 'fluency' : strategy;
    const ordered: Record<string, string[]> = {
      lexical: ['contextual-lexical', 'conservative-synonym', 'phrase-substitution'],
      concise: ['structural-rewrite', 'concision', 'redundancy-removal', 'contextual-lexical'],
      structural: ['structural-rewrite', 'sentence-restructure', 'contextual-lexical', 'conservative-synonym'],
      fluency: ['structural-rewrite', 'contextual-lexical', 'conservative-synonym', 'redundancy-removal'],
      minimal: ['contextual-lexical'],
    };
    return (ordered[effectiveStrategy] ?? ordered.fluency)
      .filter(id => structuralAllowed || id !== 'structural-rewrite')
      .map((id, index) => ({ id, priority: Math.max(0.1, 1 - index * 0.16), strength, confidence }));
  }


  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([promise, new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Laya inference timed out after ${timeoutMs}ms`)), timeoutMs);
      })]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

export function createLayaAdapter(options?: LayaAdapterOptions): LayaAdapter {
  return new LayaAdapter(options);
}
