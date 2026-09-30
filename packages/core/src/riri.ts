/**
 * Riri — Local Writing Intelligence Engine
 * 
 * Main public engine entry point.
 */

import type {
  RiriConfig,
  RewriteOptions,
  RewriteResult,
  AnalyzedText,
  ValidationResult,
  DecisionEngine,
} from '@riri/types';
import { createParser, Parser } from '@riri/parser';
import { createAnalyzer, Analyzer } from '@riri/analyzer';
import { createHeuristicDecisionEngine, createLayaDecisionEngine } from '@riri/decision-engine';
import { createLayaAdapter, LayaAdapter } from '@riri/laya-adapter';
import { getAllTransformations } from '@riri/transformations';
import { createValidationEngine, ValidationEngine, type ComprehensiveValidationOptions } from '@riri/validator';
import { Pipeline, createPipeline } from './pipeline.js';
import { FreezeWordsManager, createFreezeWordsManager } from './freeze-words.js';
import { CustomDictionary, createCustomDictionary } from './custom-dictionary.js';
import { GrammarEngine, createGrammarEngine, type ProofreadResult } from './grammar-engine.js';
import { ReadabilityEngine, createReadabilityEngine, type ReadabilityMetrics } from './readability-engine.js';
import { ToneAnalyzer, createToneAnalyzer, type ToneSignals } from './tone-analyzer.js';
import { ExtractiveSummarizer, createExtractiveSummarizer, type SummarizeOptions, type SummaryResult } from './summarizer.js';
import { resolveConfig } from './config.js';

export class Riri {
  private config: Required<RiriConfig>;
  private parser: Parser;
  private analyzer: Analyzer;
  private validator: ValidationEngine;
  private grammarEngine: GrammarEngine;
  private readabilityEngine: ReadabilityEngine;
  private toneAnalyzer: ToneAnalyzer;
  private summarizer: ExtractiveSummarizer;
  private freezeWordsManager: FreezeWordsManager;
  private customDictionary: CustomDictionary;
  private pipeline: Pipeline;
  private decisionEngine: DecisionEngine;
  private layaAdapter: LayaAdapter | null = null;

  constructor(config?: RiriConfig) {
    this.config = resolveConfig(config);
    this.parser = createParser();
    this.analyzer = createAnalyzer();
    this.validator = createValidationEngine();
    this.grammarEngine = createGrammarEngine();
    this.readabilityEngine = createReadabilityEngine();
    this.toneAnalyzer = createToneAnalyzer();
    this.summarizer = createExtractiveSummarizer();
    this.freezeWordsManager = createFreezeWordsManager();
    this.customDictionary = createCustomDictionary();

    // Select decision engine
    if (this.config.decisionEngine === 'laya') {
      this.layaAdapter = createLayaAdapter({
        modelDir: this.config.modelPath || undefined,
        timeoutMs: this.config.timeout,
      });
      this.decisionEngine = createLayaDecisionEngine({
        timeoutMs: this.config.timeout,
        adapter: this.layaAdapter,
      });
    } else {
      this.decisionEngine = createHeuristicDecisionEngine();
    }

    const transformations = getAllTransformations();

    this.pipeline = createPipeline({
      decisionEngine: this.decisionEngine,
      transformations,
      freezeWordsManager: this.freezeWordsManager,
    });
  }

  /** Explicitly load the optional local Laya decision model. */
  async load(): Promise<void> {
    if (this.layaAdapter) await this.layaAdapter.load();
  }

  /** Release the optional local decision model. */
  async unload(): Promise<void> {
    if (this.layaAdapter) await this.layaAdapter.unload();
  }

  async modelHealth() {
    return this.layaAdapter?.health() ?? { ready: false, modelLoaded: false };
  }

  /**
   * Main rewriting pipeline: Paraphrase, restructuring, and style transformations
   */
  async rewrite(
    text: string,
    options?: RewriteOptions & { freezeWords?: string[] }
  ): Promise<RewriteResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Input text cannot be empty');
    }
    if (text.length > this.config.maxInputSize) {
      throw new Error(`Input text exceeds maximum allowed size of ${this.config.maxInputSize} characters`);
    }

    return this.pipeline.rewrite(text, options);
  }

  /**
   * Parse text into sentences, tokens, and protected spans
   */
  parse(text: string): AnalyzedText {
    return this.parser.parse(text);
  }

  /**
   * Parse and extract linguistic features
   */
  async analyze(text: string): Promise<AnalyzedText> {
    return this.analyzer.analyze(text);
  }

  /**
   * Grammar, spelling, and punctuation proofreader
   */
  async grammar(text: string): Promise<ProofreadResult> {
    return this.grammarEngine.check(text);
  }

  /**
   * Dedicated plain-language simplifier
   */
  async simplify(text: string, options?: RewriteOptions): Promise<RewriteResult> {
    return this.rewrite(text, {
      ...options,
      mode: 'simple',
    });
  }

  /**
   * Extractive summarization
   */
  async summarize(text: string, options?: SummarizeOptions): Promise<SummaryResult> {
    return this.summarizer.summarize(text, options);
  }

  /**
   * Comprehensive readability metrics (Flesch, Flesch-Kincaid)
   */
  async readability(text: string): Promise<ReadabilityMetrics> {
    return this.readabilityEngine.analyze(text);
  }

  /**
   * Multi-dimensional tone signals
   */
  async tone(text: string): Promise<ToneSignals> {
    return this.toneAnalyzer.analyze(text);
  }

  /**
   * Safety, negation, and protected content validation
   */
  async validate(
    original: string,
    transformed: string,
    options?: ComprehensiveValidationOptions
  ): Promise<ValidationResult> {
    return this.validator.validateAll(original, transformed, options);
  }

  /**
   * Access custom dictionary
   */
  getCustomDictionary(): CustomDictionary {
    return this.customDictionary;
  }

  /**
   * Access freeze words manager
   */
  getFreezeWords(): FreezeWordsManager {
    return this.freezeWordsManager;
  }
}

export function createRiri(config?: RiriConfig): Riri {
  return new Riri(config);
}
