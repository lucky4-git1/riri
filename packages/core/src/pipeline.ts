/**
 * Core Pipeline Orchestrator
 * 
 * Executes the complete writing intelligence cycle:
 * Analysis -> Decision Planning -> Transformation -> Validation -> Scoring -> Candidate Selection
 */

import type {
  RewriteOptions,
  RewriteResult,
  DecisionEngine,
  DecisionContext,
  Transformation,
  ProtectedSpan,
  Candidate,
} from '@riri/types';
import { Parser, createParser } from '@riri/parser';
import { Analyzer, createAnalyzer, SemanticAnalyzer, createSemanticAnalyzer } from '@riri/analyzer';
import { ValidationEngine, createValidationEngine } from '@riri/validator';
import { QualityScorer, createQualityScorer, CandidateSelector, createCandidateSelector } from '@riri/scoring';
import { CandidateGenerator, createCandidateGenerator } from './candidate-generator.js';
import { FreezeWordsManager, createFreezeWordsManager } from './freeze-words.js';
import { resolveRewriteOptions } from './config.js';
import { maskProtectedContent } from './protected-content-masker.js';

export interface PipelineOptions {
  decisionEngine: DecisionEngine;
  transformations: Transformation[];
  freezeWordsManager?: FreezeWordsManager;
}

export class Pipeline {
  private parser: Parser;
  private analyzer: Analyzer;
  private semanticAnalyzer: SemanticAnalyzer;
  private validator: ValidationEngine;
  private scorer: QualityScorer;
  private selector: CandidateSelector;
  private decisionEngine: DecisionEngine;
  private candidateGenerator: CandidateGenerator;
  private freezeWordsManager: FreezeWordsManager;
  private transformationMap: Map<string, Transformation>;

  constructor(options: PipelineOptions) {
    this.parser = createParser();
    this.analyzer = createAnalyzer();
    this.semanticAnalyzer = createSemanticAnalyzer();
    this.validator = createValidationEngine();
    this.scorer = createQualityScorer();
    this.selector = createCandidateSelector();
    this.decisionEngine = options.decisionEngine;
    this.freezeWordsManager = options.freezeWordsManager || createFreezeWordsManager();

    this.transformationMap = new Map();
    for (const t of options.transformations) {
      this.transformationMap.set(t.id, t);
    }

    this.candidateGenerator = createCandidateGenerator({
      transformations: this.transformationMap,
      scorer: this.scorer,
    });
  }

  setDecisionEngine(engine: DecisionEngine): void {
    this.decisionEngine = engine;
  }

  /**
   * Execute full rewrite pipeline
   */
  async rewrite(
    text: string,
    options?: RewriteOptions & { freezeWords?: string[] }
  ): Promise<RewriteResult> {
    const startTime = Date.now();
    const opts = resolveRewriteOptions(options);

    // 1. Detect freeze spans
    const freezeSpans = this.freezeWordsManager.detectSpans(text, options?.freezeWords || []);

    // 2. Parse & Analyze
    const parseStart = Date.now();
    const parsed = this.parser.parse(text);
    const analyzed = this.analyzer.analyze(text);
    const semantic = this.semanticAnalyzer.analyze(analyzed);
    const anchors = this.semanticAnalyzer.extractAnchors(semantic);
    const semanticProtectedSpans = anchors
      .filter(anchor => anchor.kind === 'entity')
      .map(anchor => ({ type: 'proper_noun' as const, value: anchor.text, text: anchor.text, start: anchor.start, end: anchor.end }));

    // Merge protected spans and freeze spans
    const allProtectedSpans: ProtectedSpan[] = [
      ...parsed.protectedSpans,
      ...freezeSpans,
      ...semanticProtectedSpans,
    ];

    const masked = maskProtectedContent(text, allProtectedSpans);

    // Compute original baseline quality
    const originalQuality = await this.scorer.score(text, text, {
      protectedSpans: allProtectedSpans,
      features: analyzed.features,
      mode: opts.mode,
    });

    // 3. Plan transformations via Decision Engine
    const decisionContext: DecisionContext = {
      mode: opts.mode,
      aggressiveness: opts.aggressiveness,
      maxTransformations: opts.maxTransformations,
      timeout: opts.timeout,
    };

    const plan = await this.decisionEngine.plan(
      {
        language: 'en',
        sentenceCount: analyzed.features.sentenceCount,
        averageSentenceLength: analyzed.features.averageSentenceLength,
        complexity: analyzed.features.complexity,
        technicalTermRatio: analyzed.features.technicalTermRatio,
        repetitionScore: analyzed.features.repetitionScore,
        passiveVoiceRatio: analyzed.features.passiveVoiceRatio,
        mode: opts.mode,
        aggressiveness: opts.aggressiveness,
        hasNumbers: analyzed.features.hasNumbers,
        hasUrls: analyzed.features.hasUrls,
        hasCode: analyzed.features.hasCode,
        protectedEntityCount: allProtectedSpans.length,
      },
      decisionContext
    );

    // 4. Generate candidates
    const generationStart = Date.now();
    const maskedCandidates = await this.candidateGenerator.generate(
      masked.text,
      plan,
      {
        mode: opts.mode,
        strength: opts.aggressiveness,
        protectedSpans: [],
        features: analyzed.features,
      },
      []
    );
    const candidates: Candidate[] = await Promise.all(maskedCandidates.map(async candidate => {
      const restoredText = masked.restore(candidate.text);
      const quality = await this.scorer.score(text, restoredText, { protectedSpans: allProtectedSpans, features: analyzed.features, mode: opts.mode });
      const advancedMetrics = await this.scorer.scoreAdvanced(text, restoredText, { protectedSpans: allProtectedSpans, features: analyzed.features, mode: opts.mode });
      const modCount = candidate.transformations.reduce((sum, t) => sum + t.modifications.length, 0);
      const multiTransformBonus = Math.min(0.20, candidate.transformations.length * 0.05);
      const depthBonus = Math.min(0.15, modCount * 0.02);
      const structuralBonus = candidate.transformations.some(transformation => transformation.id === 'structural-rewrite') ? 0.15 : 0;
      const finalScore = Math.min(1, advancedMetrics.overall * 0.60 + multiTransformBonus + depthBonus + structuralBonus);
      return { ...candidate, text: restoredText, quality, score: finalScore, advancedMetrics };


    }));

    // 5. Select best candidate with rollback validation
    const selection = this.selector.selectBest(text, originalQuality, candidates);

    const warnings: string[] = [];
    if (selection.shouldRollback) {
      warnings.push(`Rollback to original: ${selection.reason}`);
    }

    const finalCandidate = selection.selected;
    const finalResultText = finalCandidate ? finalCandidate.text : text;
    // Detect if fallback was used
    const decisionEngineName =
      'getEngineUsed' in this.decisionEngine &&
      typeof (this.decisionEngine as any).getEngineUsed === 'function'
        ? (this.decisionEngine as any).getEngineUsed()
        : opts.decisionEngine || 'heuristic';

    const fallbackUsed =
      'getFallbackReason' in this.decisionEngine &&
      typeof (this.decisionEngine as any).getFallbackReason === 'function'
        ? (this.decisionEngine as any).getFallbackReason() !== null
        : false;

    const finalTransformations = finalCandidate ? finalCandidate.transformations : [];
    const finalQuality = finalCandidate ? finalCandidate.quality : originalQuality;
    const diagnostics = 'getDiagnostics' in this.decisionEngine && typeof (this.decisionEngine as any).getDiagnostics === 'function'
      ? (this.decisionEngine as any).getDiagnostics()
      : undefined;
    const stageLatencies = { parse: Date.now() - parseStart, generation: Date.now() - generationStart, total: Date.now() - startTime };

    // Final safety gate: comprehensive validation
    if (finalCandidate && finalCandidate.text !== text) {
      const finalValidation = await this.validator.validateAll(text, finalResultText, {
        protectedSpans: allProtectedSpans,
        freezeWords: options?.freezeWords,
      });

      if (!finalValidation.valid) {
        warnings.push(...finalValidation.issues.map(i => `Safety gate rejection: ${i}`));
        return {
          text,
          original: text,
          metrics: originalQuality,
          transformations: [],
          warnings: [...warnings, 'Final transformation rejected by safety gate; rolled back to original text.'],
          metadata: {
            mode: opts.mode,
            aggressiveness: opts.aggressiveness,
            decisionEngine: decisionEngineName,
            fallbackUsed,
            latencyMs: Date.now() - startTime,
            candidatesGenerated: candidates.length,
            transformationsAttempted: plan.recommendedTransformations.length,
            transformationsApplied: 0,
            engine: diagnostics?.engine ?? decisionEngineName,
            generator: opts.generator,
            intensity: opts.intensity,
            layaInferenceMs: diagnostics?.layaInferenceMs,
            modelLoaded: diagnostics?.engine === 'laya',
            candidatesRejected: maskedCandidates.length - candidates.length,
            candidatesValidated: candidates.length,
            stageLatencies,
          },
        };
      }
    }

    return {
      text: finalResultText,
      original: text,
      metrics: finalQuality,
      advancedMetrics: finalCandidate?.advancedMetrics,
      transformations: finalTransformations,
      changes: finalCandidate?.transformations.flatMap(transformation => transformation.modifications.map(modification => ({
        type: modification.type.includes('structural') ? 'structural' as const : modification.original.text.includes(' ') ? 'phrase' as const : 'word' as const,
        operation: transformation.id,
        original: modification.original.text,
        replacement: modification.replacement,
        sentenceIndex: 0,
        confidence: transformation.confidence,
        reason: modification.reason,
        strategy: finalCandidate.strategy,
      }))),
      warnings,
      metadata: {
        mode: opts.mode,
        aggressiveness: opts.aggressiveness,
        decisionEngine: decisionEngineName,
        fallbackUsed,
        latencyMs: Date.now() - startTime,
        candidatesGenerated: candidates.length,
        transformationsAttempted: plan.recommendedTransformations.length,
        transformationsApplied: finalTransformations.length,
        engine: diagnostics?.engine ?? decisionEngineName,
        generator: opts.generator,
        intensity: opts.intensity,
        layaInferenceMs: diagnostics?.layaInferenceMs,
        modelLoaded: diagnostics?.engine === 'laya',
        candidatesRejected: maskedCandidates.length - candidates.length,
        candidatesValidated: candidates.length,
        finalStrategy: finalCandidate?.strategy,
        stageLatencies,
      },
    };
  }
}

export function createPipeline(options: PipelineOptions): Pipeline {
  return new Pipeline(options);
}
