/**
 * @riri/core
 * 
 * Production-quality reusable local writing intelligence engine.
 */

export { Riri, createRiri } from './riri.js';
export { Pipeline, createPipeline } from './pipeline.js';
export type { PipelineOptions } from './pipeline.js';
export { FreezeWordsManager, createFreezeWordsManager } from './freeze-words.js';
export { CustomDictionary, createCustomDictionary } from './custom-dictionary.js';
export type { DictionaryExport } from './custom-dictionary.js';
export { GrammarEngine, createGrammarEngine } from './grammar-engine.js';
export type { GrammarIssue, ProofreadResult } from './grammar-engine.js';
export { ReadabilityEngine, createReadabilityEngine } from './readability-engine.js';
export type { ReadabilityMetrics } from './readability-engine.js';
export { ToneAnalyzer, createToneAnalyzer } from './tone-analyzer.js';
export type { ToneSignals } from './tone-analyzer.js';
export { ExtractiveSummarizer, createExtractiveSummarizer } from './summarizer.js';
export type { SummarizeOptions, SummaryResult } from './summarizer.js';
export { DEFAULT_CONFIG, DEFAULT_REWRITE_OPTIONS, resolveConfig, resolveRewriteOptions } from './config.js';
export { maskProtectedContent } from './protected-content-masker.js';
export type { MaskedText } from './protected-content-masker.js';
