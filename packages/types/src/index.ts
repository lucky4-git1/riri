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
  | 'quoted'
  | 'negation'
  | 'freeze';

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
  | 'concise'
  | 'creative';

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

export type GeneratorKind = 'auto' | 'deterministic' | 'local-neural' | 'hybrid';

export interface RewriteOptions {
  mode?: WritingMode;
  aggressiveness?: number; // 0-1, default 0.3
  intensity?: RewriteIntensity; // 0-4 rewrite depth ladder
  maxTransformations?: number; // default 6
  maxCandidates?: number; // default 5
  maxRetries?: number; // default 2
  timeout?: number; // milliseconds
  preserveFormatting?: boolean;
  decisionEngine?: 'laya' | 'heuristic';
  generator?: GeneratorKind;
  quality?: 'fast' | 'balanced' | 'thorough';
  seed?: number;
}

export interface RewriteResult {
  text: string;
  original: string;
  metrics: QualityMetrics;
  advancedMetrics?: AdvancedQualityMetrics;
  transformations: AppliedTransformation[];
  changes?: ChangeRecord[];
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
  decisionEngine: string; // 'laya' | 'heuristic' | ...
  fallbackUsed: boolean;
  latencyMs: number;
  candidatesGenerated: number;
  transformationsAttempted: number;
  transformationsApplied: number;
  // Neural-upgrade metadata (Phases 1/24/25)
  engine?: 'laya' | 'heuristic';
  generator?: GeneratorKind | string;
  intensity?: RewriteIntensity;
  layaInferenceMs?: number;
  modelLoaded?: boolean;
  modelVersion?: string;
  candidatesRejected?: number;
  candidatesValidated?: number;
  finalStrategy?: string;
  repairIterations?: number;
  stageLatencies?: StageLatencies;
  seeded?: boolean;
}

export interface Candidate {
  text: string;
  quality: QualityMetrics;
  transformations: AppliedTransformation[];
  score: number; // Combined quality score
  // Neural-upgrade fields (optional for backward compatibility)
  strategy?: string;
  advancedMetrics?: AdvancedQualityMetrics;
  changes?: ChangeRecord[];
  rejected?: boolean;
  rejectionReason?: string;
}

export interface RewriteGenerationContext {
  originalText: string;
  sentences: SentenceSemantics[];
  plan: RewritePlan;
  protectedSpans: ProtectedSpan[];
  semanticAnchors: SemanticAnchor[];
  style: StyleVector;
  intensity: RewriteIntensity;
  mode: WritingMode;
  seed?: number;
}

export interface RewriteGenerator {
  readonly name: string;
  isAvailable(): boolean;
  generate(input: string, context: RewriteGenerationContext): Promise<Candidate[]>;
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
// Semantic Representation (Phase 3)
// =============================================================================

export type ClauseRole = 'main' | 'subordinate' | 'relative' | 'coordinate';

export interface ClauseInfo {
  text: string;
  start: number;
  end: number;
  role: ClauseRole;
  conjunction?: string;
}

export interface PhraseInfo {
  text: string;
  start: number;
  end: number;
  head?: string;
}

export type TenseName =
  | 'past'
  | 'present'
  | 'future'
  | 'past-perfect'
  | 'present-perfect'
  | 'modal'
  | 'unknown';

export interface EntityMention {
  text: string;
  kind: 'proper-noun' | 'number' | 'date' | 'technical' | 'quantity';
  start: number;
  end: number;
}

export interface SentenceSemantics {
  index: number;
  text: string;
  start: number;
  end: number;
  clauses: ClauseInfo[];
  subject: PhraseInfo | null;
  predicate: PhraseInfo | null;
  objects: PhraseInfo[];
  verbPhrase: PhraseInfo | null;
  negationCount: number;
  negationSpans: TextSpan[];
  tense: TenseName;
  voice: 'active' | 'passive' | 'unknown';
  modals: string[];
  entities: EntityMention[];
  contentWords: string[];
  discourseConnector: string | null;
  wordCount: number;
}

export interface SemanticAnalysis {
  sentences: SentenceSemantics[];
}

export type SemanticAnchorKind =
  | 'entity'
  | 'number'
  | 'date'
  | 'technical'
  | 'action'
  | 'negation'
  | 'other';

export interface SemanticAnchor {
  text: string;
  kind: SemanticAnchorKind;
  sentenceIndex: number;
  start: number;
  end: number;
}

// =============================================================================
// Rewrite Plan (Phase 2)
// =============================================================================

export type RewriteOperationType =
  | 'lexical-substitution'
  | 'phrase-compression'
  | 'syntactic-restructure'
  | 'clause-reorder'
  | 'voice-change'
  | 'predicate-restructure'
  | 'sentence-split'
  | 'sentence-merge'
  | 'connector-variation'
  | 'redundancy-removal'
  | 'formality-adjust'
  | 'simplification'
  | 'neural-generation';

export interface RewriteOperation {
  type: RewriteOperationType;
  targetSentence: number;
  targetSpan?: TextSpan;
  strength: number; // 0-1
  confidence: number; // 0-1
  source: 'laya' | 'heuristic';
  reason?: string;
}

export interface StyleVector {
  mode: WritingMode;
  formality: number; // 0-1 target
  fluency: number;
  concision: number;
  simplicity: number;
}

export type RewriteIntensity = 0 | 1 | 2 | 3 | 4;

export interface SentencePlanEntry {
  index: number;
  text: string;
  change: number; // 0-1 how much this sentence should change
}

export interface RewritePlan {
  sentences: SentencePlanEntry[];
  protectedSpans: ProtectedSpan[];
  semanticAnchors: SemanticAnchor[];
  operations: RewriteOperation[];
  preserve: string[];
  style: StyleVector;
  intensity: RewriteIntensity;
  engine: 'laya' | 'heuristic';
  reasoning?: string;
}

// =============================================================================
// Change Intelligence (Phase 16)
// =============================================================================

export type ChangeCategory = 'word' | 'phrase' | 'structural' | 'sentence';

export interface ChangeRecord {
  type: ChangeCategory;
  operation: string;
  original: string;
  replacement: string;
  sentenceIndex: number;
  confidence: number;
  reason?: string;
  strategy?: string;
}

// =============================================================================
// Advanced Quality Metrics (Phase 11)
// =============================================================================

export interface AdvancedQualityMetrics {
  semantic: number;
  grammar: number;
  naturalness: number;
  styleAlignment: number;
  lexicalDiversity: number;
  structuralDiversity: number;
  readability: number;
  repetitionReduction: number;
  informationPreservation: number;
  protectedContent: number;
  hallucinationRisk: number; // 0 = safe, 1 = invented facts present
  usefulness: number;
  overall: number;
}

export interface StageLatencies {
  parse?: number;
  analysis?: number;
  laya?: number;
  generation?: number;
  validation?: number;
  scoring?: number;
  repair?: number;
  total: number;
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
