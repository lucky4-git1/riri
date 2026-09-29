# Riri Architecture

**Version:** 0.1.0  
**Status:** Design Document  
**Last Updated:** 2026-09-29

## Overview

Riri is a **local-first intelligent writing transformation engine** that uses a quantized decision model (Laya) to guide deterministic text transformations. Unlike LLMs, Riri does not generate text—it analyzes, plans, transforms, validates, and scores modifications using local algorithms and a non-autoregressive decision model.

## Core Principles

1. **Local-First:** All processing happens on the user's machine
2. **CPU-First:** No GPU required, optimized for CPU inference
3. **Privacy-First:** No data sent to external services
4. **Deterministic Core:** Transformations are rule-based and explainable
5. **Quality Over Aggressiveness:** Semantic preservation is paramount
6. **Modular Design:** Each component is independently testable
7. **Graceful Degradation:** Fallback to heuristics if model unavailable

## High-Level Pipeline

```
┌─────────────┐
│  USER TEXT  │
└──────┬──────┘
       ↓
┌─────────────────────────────┐
│  PARSER                     │
│  - Sentence segmentation    │
│  - Tokenization             │
│  - Protected span detection │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  ANALYZER                   │
│  - Linguistic features      │
│  - Complexity scoring       │
│  - Readability metrics      │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  DECISION ENGINE (Laya)     │
│  - Feature → Plan           │
│  - Transformation selection │
│  - Priority & strength      │
│  - [Fallback: Heuristic]    │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  TRANSFORMATION ENGINE      │
│  - Apply transformations    │
│  - Generate candidates      │
│  - Respect protected spans  │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  VALIDATION ENGINE          │
│  - Grammar validation       │
│  - Semantic preservation    │
│  - Protected content check  │
│  - Negation preservation    │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  QUALITY SCORER             │
│  - Semantic similarity      │
│  - Naturalness              │
│  - Grammar correctness      │
│  - Overall quality          │
└──────┬──────────────────────┘
       ↓
┌─────────────────────────────┐
│  CANDIDATE SELECTION        │
│  - Compare candidates       │
│  - Select best              │
│  - Rollback if needed       │
└──────┬──────────────────────┘
       ↓
┌──────────────┐
│ FINAL RESULT │
└──────────────┘
```

## Package Architecture

### 1. @riri/types

**Purpose:** Shared TypeScript types and interfaces

**Exports:**
- Core types (TextSpan, Sentence, Token, etc.)
- Protected content types
- Decision engine interfaces
- Transformation interfaces
- Quality metrics
- Configuration types
- Error classes

**Dependencies:** None

**Status:** ✅ Complete

---

### 2. @riri/parser

**Purpose:** Text parsing and tokenization

**Responsibilities:**
- Sentence boundary detection
- Tokenization (word-level)
- Protected span identification
- Source offset tracking

**Protected Content Detection:**
- Numbers: `421M`, `3.14`, `$99.99`, `50%`
- URLs: `https://example.com`
- Emails: `user@example.com`
- Dates: `2026-09-29`, `Sept 29`
- Code: backtick-enclosed, indented blocks
- Technical IDs: `package-name`, `camelCase`, `SCREAMING_SNAKE`
- Quoted content: `"text"`, `'text'`

**Key Functions:**
```typescript
parse(text: string): ParsedText
detectProtectedSpans(text: string): ProtectedSpan[]
tokenize(text: string): Token[]
segmentSentences(text: string): Sentence[]
```

**Implementation Strategy:**
- Regex patterns for protected content
- Simple sentence boundary detection (`.!?` + whitespace)
- Word-level tokenization (split on whitespace/punctuation)
- No external NLP libraries required

**Status:** ⏳ TODO

---

### 3. @riri/analyzer

**Purpose:** Linguistic feature extraction

**Responsibilities:**
- Calculate complexity metrics
- Compute readability scores
- Detect passive voice
- Identify repetition
- Count technical terms
- Calculate formality

**Features Extracted:**
```typescript
{
  language: string,
  sentenceCount: number,
  averageSentenceLength: number,
  complexity: number,  // 0-1
  technicalTermRatio: number,
  repetitionScore: number,
  passiveVoiceRatio: number,
  readabilityScore: number,
  formalityScore: number
}
```

**Complexity Metrics:**
- Average sentence length
- Vocabulary diversity (unique words / total words)
- Technical term density
- Subordinate clause indicators ("because", "although", "since")

**Passive Voice Detection:**
- Look for "be" verb + past participle
- Indicators: "was created", "is done", "were analyzed"

**Status:** ⏳ TODO

---

### 4. @riri/model-runtime

**Purpose:** ONNX Runtime abstraction

**Responsibilities:**
- Load ONNX models
- CPU inference
- Session management
- Health checks
- Memory monitoring

**Key Classes:**
```typescript
class ONNXRuntime implements ModelRuntime {
  load(config: ModelConfig): Promise<void>
  unload(): Promise<void>
  predict(input: Tensor): Promise<Tensor>
  health(): Promise<HealthStatus>
  warmup(input: Tensor): Promise<number>
}
```

**Configuration:**
- Execution provider: CPU (default)
- Thread count: 4 (configurable)
- Graph optimization: All (default)
- Memory arena: Enabled

**Status:** ✅ Complete

---

### 5. @riri/laya-adapter

**Purpose:** Laya decision model integration

**Responsibilities:**
- Convert Riri features → Laya input format
- Run Laya inference
- Parse Laya output
- Validate output schema (Zod)
- Enforce timeouts
- Fallback on failure

**Input Format:**
```typescript
{
  language: "en",
  sentenceCount: 3,
  averageSentenceLength: 18.4,
  complexity: 0.62,
  mode: "academic",
  aggressiveness: 0.30,
  hasNumbers: true,
  hasCode: false,
  protectedEntityCount: 2
}
```

**Output Format:**
```typescript
{
  complexity: 0.62,
  recommendedTransformations: [
    { id: "phrase-substitution", priority: 0.82, strength: 0.25 },
    { id: "sentence-restructure", priority: 0.61, strength: 0.20 }
  ],
  preserve: ["entities", "numbers", "technical_terms"],
  skipTransformations: []
}
```

**Timeout:** 250ms (configurable)

**Fallback:** Heuristic decision engine

**Status:** 🚧 Started (structure only)

---

### 6. @riri/decision-engine

**Purpose:** Heuristic fallback decision engine

**Responsibilities:**
- Transformation selection without Laya
- Rule-based decision logic
- Mode-specific policies

**Decision Rules:**

**Academic Mode:**
```typescript
{
  synonymStrength: 0.25,
  sentenceRestructure: true,
  formalityIncrease: true,
  preserveTechnical: true,
  preserveNumbers: true
}
```

**Concise Mode:**
```typescript
{
  redundancyRemoval: true,
  sentenceMerge: true,
  verbosityReduction: true,
  maxTransformations: 4
}
```

**Status:** ⏳ TODO

---

### 7. @riri/transformations

**Purpose:** Text transformation plugins

**Plugin Architecture:**
```typescript
interface Transformation {
  id: string
  name: string
  applicability(text, context): Promise<number>  // 0-1
  execute(text, context): Promise<TransformationResult>
  validate(original, transformed): Promise<ValidationResult>
}
```

**Transformations:**

1. **Conservative Synonyms**
   - Replace words with context-appropriate synonyms
   - Respect POS (part of speech)
   - Low strength by default (0.2-0.3)
   - Never replace technical terms

2. **Phrase Substitution**
   - Multi-word phrase improvements
   - "in order to" → "to"
   - "due to the fact that" → "because"

3. **Sentence Restructuring**
   - Active ↔ Passive voice
   - Clause reordering
   - Subordinate clause extraction

4. **Sentence Splitting**
   - Break long sentences at conjunctions
   - Respect semantic boundaries

5. **Sentence Merging**
   - Combine short related sentences
   - Reduce choppiness

6. **Redundancy Removal**
   - Eliminate repetitive phrases
   - Remove obvious statements

7. **Formalization**
   - Contractions → full forms
   - Colloquialisms → formal equivalents

8. **Simplification**
   - Complex words → simpler alternatives
   - Reduce nested clauses

**Constraint:** All transformations must preserve protected spans

**Status:** ⏳ TODO

---

### 8. @riri/validator

**Purpose:** Transformation validation

**Responsibilities:**
- Grammar validation
- Semantic preservation checking
- Protected content verification
- Negation preservation
- Structural validity

**Validation Checks:**

**Grammar:**
- Duplicate words ("the the")
- Malformed punctuation
- Basic agreement issues
- Sentence fragments

**Semantics:**
- Protected span preservation
- Token overlap > threshold
- Key term preservation
- Negation preservation

**Negation Preservation (Critical):**
```typescript
negationWords = ["not", "no", "never", "cannot", "shouldn't", ...]
```
- Count negations in original
- Count negations in transformed
- Must be equal

**Protected Content:**
- All protected spans must appear in output
- Values must be identical
- Positions may change but content must not

**Status:** ⏳ TODO

---

### 9. @riri/scoring

**Purpose:** Quality scoring and ranking

**Responsibilities:**
- Calculate semantic preservation score
- Calculate naturalness score
- Calculate grammar score
- Compute overall quality score
- Rank candidates

**Scoring Metrics:**

**Semantic Preservation (0-1):**
```typescript
semanticScore = 
  0.4 * tokenOverlap +
  0.3 * keyTermPreservation +
  0.2 * protectedContentScore +
  0.1 * structuralSimilarity
```

**Naturalness (0-1):**
- Penalize excessive synonym use
- Penalize repeated words
- Penalize awkward phrasing
- Penalize unchanged output

**Grammar (0-1):**
- Base score: 1.0
- Deduct for each grammar issue
- Severe issues: -0.3
- Minor issues: -0.1

**Overall Quality:**
```typescript
overallQuality = 
  0.5 * semanticPreservation +
  0.3 * naturalness +
  0.2 * grammar
```

**Acceptance Threshold:** 0.7

**Status:** ⏳ TODO

---

### 10. @riri/core

**Purpose:** Main orchestration and API

**Responsibilities:**
- Pipeline orchestration
- Candidate generation
- Candidate selection
- Rollback management
- Configuration management
- Error handling

**Main Class:**
```typescript
class Riri {
  constructor(config: RiriConfig)
  
  rewrite(text: string, options?: RewriteOptions): Promise<RewriteResult>
  analyze(text: string): Promise<AnalyzedText>
  simplify(text: string): Promise<RewriteResult>
  validate(original: string, transformed: string): Promise<ValidationResult>
}
```

**Pipeline Flow:**
1. Parse text → AnalyzedText
2. Extract features
3. Get transformation plan (Laya or heuristic)
4. For each transformation:
   - Check applicability
   - Generate candidates (limit: 5)
   - Validate each candidate
   - Score each candidate
5. Select best candidate
6. If quality < threshold, rollback
7. Return result

**Bounded Execution:**
- Max transformations: 6
- Max candidates: 5
- Max retries: 2
- Timeout: configurable
- Max document size: configurable

**Status:** ⏳ TODO

---

## Data Flow Example

### Input
```
"The system does not support real-time updates due to the fact that 
the API rate limit is 100 requests/minute."
```

### After Parser
```typescript
{
  sentences: [
    {
      text: "The system does not support real-time updates...",
      tokens: ["The", "system", "does", "not", "support", ...],
      protectedSpans: [
        { type: "number", value: "100", start: 89, end: 92 },
        { type: "technical_identifier", value: "API", start: 73, end: 76 }
      ]
    }
  ]
}
```

### After Analyzer
```typescript
{
  sentenceCount: 1,
  averageSentenceLength: 18,
  complexity: 0.58,
  technicalTermRatio: 0.11,
  hasNumbers: true,
  protectedEntityCount: 2
}
```

### After Laya
```typescript
{
  recommendedTransformations: [
    { id: "phrase-substitution", priority: 0.85, strength: 0.3 },
    { id: "simplification", priority: 0.62, strength: 0.2 }
  ],
  preserve: ["numbers", "technical_terms"]
}
```

### After Transformations
**Candidate 1 (phrase-substitution):**
```
"The system does not support real-time updates because 
the API rate limit is 100 requests/minute."
```

**Candidate 2 (simplification + phrase):**
```
"The system cannot provide real-time updates because 
the API rate limit is 100 requests/minute."
```

### After Validation & Scoring
```typescript
Candidate 1:
  semanticPreservation: 0.92
  naturalness: 0.88
  grammar: 1.0
  overallQuality: 0.91

Candidate 2:
  semanticPreservation: 0.89
  naturalness: 0.85
  grammar: 1.0
  overallQuality: 0.88
```

**Selected:** Candidate 1 (higher quality)

### Output
```typescript
{
  text: "The system does not support real-time updates because 
         the API rate limit is 100 requests/minute.",
  metrics: { semanticPreservation: 0.92, ... },
  transformations: [
    { id: "phrase-substitution", modifications: [...] }
  ],
  warnings: []
}
```

## Configuration

### Environment Variables
```bash
LAYA_MODEL_PATH=./models/laya/laya_int8.onnx
LAYA_TIMEOUT_MS=250
MAX_INPUT_SIZE=10000
MAX_TRANSFORMATIONS=6
MAX_CANDIDATES=5
DEBUG=false
```

### Programmatic Config
```typescript
const riri = new Riri({
  decisionEngine: 'laya',  // or 'heuristic'
  modelPath: './models/laya/laya_int8.onnx',
  timeout: 250,
  maxTransformations: 6,
  logging: {
    level: 'info',
    logUserText: false  // Privacy default
  }
});
```

## Performance Targets

### Latency (Warm, CPU)
- Short sentence (< 20 words): < 50ms
- Paragraph (100 words): < 150ms
- Long document (500 words): < 500ms

### Memory
- Model loaded: < 500 MB
- Per request: < 50 MB
- Peak: < 1 GB

### Cold Start
- Model loading: < 3 seconds
- First inference: < 500ms

## Error Handling

### Graceful Degradation
1. Laya timeout → Heuristic engine
2. Laya crash → Heuristic engine
3. Transformation failure → Skip transformation
4. Validation failure → Rollback
5. Quality too low → Return original

### Error Types
- `ModelError`: Model loading/inference failures
- `TransformationError`: Transformation execution failures
- `ValidationError`: Validation failures
- `TimeoutError`: Operation timeouts
- `RiriError`: General errors

## Testing Strategy

### Unit Tests
- Each package independently tested
- Mock dependencies
- Fast execution (< 1s total)

### Integration Tests
- Full pipeline tests
- Real model inference
- Protected content preservation
- Negation preservation

### Regression Tests
- 200+ documented test cases
- Edge cases and bug fixes
- Semantic preservation checks
- Quality regression prevention

### Benchmark Tests
- Latency measurements (P50, P95, P99)
- Memory profiling
- Quality metrics
- Model comparison (FP32 vs INT8)

## Security Considerations

### Input Validation
- Max input size: 10,000 characters
- Malicious Unicode filtering
- Regex DoS prevention

### Privacy
- No telemetry by default
- No user text logging (unless debug enabled)
- All processing local
- No network requests after model download

### Resource Limits
- Execution timeout: 5 seconds (configurable)
- Memory limit: Monitored but not hard-limited
- Thread limit: Configurable (default: 4)

## Future Enhancements

### v1.1+
- [ ] Browser/WASM support
- [ ] Additional languages
- [ ] Optional cloud model providers
- [ ] Fine-tuned Laya for specific domains
- [ ] Extractive summarization
- [ ] Better synonym database
- [ ] Optional small embedding model for semantic similarity

### Integration
- [ ] RewriteBot integration
- [ ] VS Code extension
- [ ] Web service API
- [ ] Electron app

## References

- **Laya:** https://github.com/receptron/laya
- **ONNX Runtime:** https://onnxruntime.ai/
- **Type Definitions:** `packages/types/src/index.ts`
- **Status:** `STATUS.md`
- **License:** `docs/model-license.md`

---

**Document Status:** Living document, will be updated as implementation progresses
