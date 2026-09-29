/**
 * Core type definitions for Riri
 */

// =============================================================================
// Text Analysis
// =============================================================================

export interface TextSpan {
  start: number;
  end: number;
  text: string;
}

export type ProtectedContentType =
  | 'number'
  | 'url'
  | 'email'
  | 'date'
  | 'currency'
  | 'percentage'
  | 'filepath'
  | 'package'
  | 'code'
  | 'markdown'
  | 'citation'
  | 'proper_noun'
  | 'technical_identifier'
  | 'version'
  | 'quoted';

export interface ProtectedSpan extends TextSpan {
  type: ProtectedContentType;
  value: string;
  metadata?: Record<string, unknown>;
}

export interface Sentence extends TextSpan {
  index: number;
  tokens: Token[];
  length: number;
}

export interface Token extends TextSpan {
  value: string;
  pos?: string; // Part of speech
  lemma?: string;
}

export interface LinguisticFeatures {
  language: string;
  sentenceCount: number;
  averageSentenceLength: number;
  complexity: number; // 0-1
  technicalTermRatio: number;
  repetitionScore: number;
  passiveVoiceRatio: number;
  hasNumbers: boolean;
  hasUrls: boolean;
  hasCode: boolean;
  protectedEntityCount: number;
  readabilityScore?: number;
  formalityScore?: number;
}

export interface AnalyzedText {
  original: string;
  sentences: Sentence[];
  tokens: Token[];
  protectedSpans: ProtectedSpan[];
  features: LinguisticFeatures;
  metadata: Record<string, unknown>;
}

// =============================================================================
// Decision Engine
// =============================================================================

export interface DecisionFeatures {
  language: string;
  sentenceCount: number;
  averageSentenceLength: number;
  complexity: number;
  technicalTermRatio: number;
  repetitionScore: number;
  passiveVoiceRatio: number;
  mode: WritingMode;
  aggressiveness: number; // 0-1
  hasNumbers: boolean;
  hasUrls: boolean;
  hasCode: boolean;
  protectedEntityCount: number;
}

export interface TransformationDecision {
  id: string;
  priority: number; // 0-1, higher = more important
  strength: number; // 0-1, how aggressive
  confidence?: number;
}

export interface TransformationPlan {
  complexity: number;
  recommendedTransformations: TransformationDecision[];
  preserve: string[];
  skipTransformations: string[];
  reasoning?: string;
}

export interface ValidationResult {
  valid: boolean;
  confidence: number;
  issues: string[];
  warnings: string[];
}

export interface DecisionEngine {
  analyze(features: DecisionFeatures): Promise<DecisionFeatures>;
  plan(
    features: DecisionFeatures,
    context: DecisionContext
  ): Promise<TransformationPlan>;
  validatePlan(plan: TransformationPlan): Promise<ValidationResult>;
}

export interface DecisionContext {
  mode: WritingMode;
  aggressiveness: number;
  maxTransformations: number;
  timeout: number;
}

// =============================================================================
// Transformations
// =============================================================================

export type WritingMode =
  | 'standard'
  | 'fluency'
  | 'academic'
  | 'professional'
  | 'formal'
  | 'simple'
  | 'concise';

export interface TransformationContext {
  mode: WritingMode;
  strength: number; // 0-1
  protectedSpans: ProtectedSpan[];
  features: LinguisticFeatures;
}

export interface TransformationResult {
  text: string;
  applied: boolean;
  confidence: number;
  modifications: Modification[];
  reasoning?: string;
}

export interface Modification {
  type: string;
  original: TextSpan;
  replacement: string;
  reason?: string;
}

export interface Transformation {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  /**
   * Check if transformation is applicable to the text
   */
  applicability(
    text: string,
    context: TransformationContext
  ): Promise<number>; // 0-1

  /**
   * Plan the transformation without executing
   */
  plan(
    text: string,
    context: TransformationContext
  ): Promise<TransformationPlan>;

  /**
   * Execute the transformation
   */
  execute(
    text: string,
    context: TransformationContext
  ): Promise<TransformationResult>;

  /**
   * Validate transformation output
   */
  validate(
    original: string,
    transformed: string,
    context: TransformationContext
  ): Promise<ValidationResult>;
}

// =============================================================================
// Quality & Validation
// =============================================================================

export interface QualityMetrics {
  semanticPreservation: number; // 0-1
  grammarScore: number; // 0-1
  naturalnessScore: number; // 0-1
  protectedContentPreserved: boolean;
  overallQuality: number; // 0-1
  issues: QualityIssue[];
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  span?: TextSpan;
}

export interface ValidationEngine {
  validateGrammar(text: string): Promise<ValidationResult>;
  validateSemantics(
    original: string,
    transformed: string,
    protectedSpans: ProtectedSpan[]
  ): Promise<ValidationResult>;
  validateNaturalness(text: string): Promise<ValidationResult>;
  validateProtectedContent(
    original: string,
    transformed: string,
    protectedSpans: ProtectedSpan[]
  ): Promise<ValidationResult>;
}

export interface QualityScorer {
  score(
    original: string,
    transformed: string,
    context: ScoringContext
  ): Promise<QualityMetrics>;
}

export interface ScoringContext {
  protectedSpans: ProtectedSpan[];
  features: LinguisticFeatures;
  mode: WritingMode;
}

// =============================================================================
// Rewrite Engine
// =============================================================================

export interface RewriteOptions {
  mode?: WritingMode;
  aggressiveness?: number; // 0-1, default 0.3
  maxTransformations?: number; // default 6
  maxCandidates?: number; // default 5
  maxRetries?: number; // default 2
  timeout?: number; // milliseconds
  preserveFormatting?: boolean;
  decisionEngine?: 'laya' | 'heuristic';
}

export interface RewriteResult {
  text: string;
  original: string;
  metrics: QualityMetrics;
  transformations: AppliedTransformation[];
  warnings: string[];
  metadata: RewriteMetadata;
}

export interface AppliedTransformation {
  id: string;
  name: string;
  confidence: number;
  modifications: Modification[];
}

export interface RewriteMetadata {
  mode: WritingMode;
  aggressiveness: number;
  decisionEngine: string;
  fallbackUsed: boolean;
  latencyMs: number;
  candidatesGenerated: number;
  transformationsAttempted: number;
  transformationsApplied: number;
}

export interface Candidate {
  text: string;
  quality: QualityMetrics;
  transformations: AppliedTransformation[];
  score: number; // Combined quality score
}

// =============================================================================
// Model Runtime
// =============================================================================

export interface ModelConfig {
  modelPath: string;
  quantized: boolean;
  quantization?: 'int8' | 'int4' | 'fp16';
  executionProvider: 'cpu' | 'cuda' | 'webgl' | 'wasm';
  sessionOptions?: Record<string, unknown>;
}

export interface ModelMetadata {
  name: string;
  version: string;
  architecture: string;
  parameters: number;
  format: string;
  precision: string;
  quantized: boolean;
}

export interface ModelRuntime {
  load(config: ModelConfig): Promise<void>;
  unload(): Promise<void>;
  predict(input: unknown): Promise<unknown>;
  health(): Promise<HealthStatus>;
  metadata(): ModelMetadata;
}

export interface HealthStatus {
  loaded: boolean;
  healthy: boolean;
  lastError?: string;
  memoryUsageMB?: number;
}

// =============================================================================
// Configuration
// =============================================================================

export interface RiriConfig {
  decisionEngine?: 'laya' | 'heuristic';
  modelPath?: string;
  timeout?: number;
  maxInputSize?: number;
  maxTransformations?: number;
  maxCandidates?: number;
  debug?: boolean;
  logging?: LoggingConfig;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  logUserText?: boolean; // Default false for privacy
  logDecisions?: boolean;
  logTransformations?: boolean;
}

// =============================================================================
// Benchmarking
// =============================================================================

export interface BenchmarkResult {
  testCase: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  metrics?: QualityMetrics;
}

export interface BenchmarkSuite {
  name: string;
  testCases: number;
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
}

export interface BenchmarkSummary {
  totalTests: number;
  passed: number;
  failed: number;
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  averageQuality?: number;
}

// =============================================================================
// Error Types
// =============================================================================

export class RiriError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RiriError';
  }
}

export class ModelError extends RiriError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MODEL_ERROR', details);
    this.name = 'ModelError';
  }
}

export class TransformationError extends RiriError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRANSFORMATION_ERROR', details);
    this.name = 'TransformationError';
  }
}

export class ValidationError extends RiriError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends RiriError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}
