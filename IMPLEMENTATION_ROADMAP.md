# Riri Implementation Roadmap

**Project:** Riri - Local-First Intelligent Writing Engine  
**Started:** 2026-09-29  
**Current Phase:** 3 of 12 Complete (25%)  
**Next Session:** Phase 5 - Parser & Analyzer

---

## ✅ Completed Work (Phases 1-3)

### Phase 1: Environment & Foundation
- ✅ Environment inspection (CPU: i5-8250U, 16GB RAM, Windows)
- ✅ Git repository initialized
- ✅ Monorepo structure (pnpm workspaces)
- ✅ TypeScript configuration
- ✅ MIT License
- ✅ Comprehensive README
- ✅ .gitignore for models and artifacts

### Phase 2: Laya Model Verification
- ✅ Official source verified: receptron/laya (GitHub)
- ✅ Model repository: receptron/laya-onnx (Hugging Face)
- ✅ License verified: Apache 2.0 (Convai Innovations)
- ✅ Commercial use confirmed
- ✅ Architecture documented: ModernBERT-large + Laya head, 421M params
- ✅ Download script: `scripts/download-laya.js`
- ✅ Verification script: `scripts/verify-laya.js`
- ✅ Quantization script: `scripts/quantize-laya.py` (FP32 → INT8)
- ✅ Complete license documentation

### Phase 3: Core Infrastructure
- ✅ Complete type system (@riri/types)
- ✅ ONNX Runtime wrapper (@riri/model-runtime)
- ✅ CPU execution provider configuration
- ✅ Model loading, health checks, inference interfaces
- ✅ Error handling and timeout support
- ✅ Laya adapter structure (@riri/laya-adapter)
- ✅ Doctor script (`scripts/doctor.js`)
- ✅ Complete architecture documentation
- ✅ Status tracking system

---

## 🚧 Current Status

**Files Created:** 28  
**Lines of Code:** ~5,000+  
**Packages Defined:** 10 (3 partially implemented)  
**Documentation:** 6 comprehensive markdown files  
**Scripts:** 4 operational scripts

**Repository Location:** `e:\riri-source\riri`

**Git Commits:** 2
1. Initial setup (Phase 1-2)
2. Runtime + documentation (Phase 3)

---

## 📋 Remaining Implementation (Phases 4-12)

### Phase 4: Quantization Execution
**Estimated Time:** 1-2 hours  
**Priority:** HIGH

```bash
# Run these commands:
pnpm model:download      # Download FP32 model from Hugging Face
pnpm model:verify        # Verify integrity and checksums
pip install onnx onnxruntime  # Install Python dependencies
pnpm model:quantize      # Create INT8 quantized version
pnpm model:benchmark     # Measure performance (TODO: create script)
```

**Deliverables:**
- [ ] Downloaded Laya model (1.7 GB FP32)
- [ ] Verified checksums
- [ ] Quantized INT8 model (~200-400 MB)
- [ ] Performance measurements (cold start, warm inference)
- [ ] Memory usage documentation

---

### Phase 5: Parser Package
**Estimated Time:** 4-6 hours  
**Priority:** HIGH

**Package:** `@riri/parser`

**Implementation Tasks:**
1. Sentence segmentation (regex-based, handle `.!?` + edge cases)
2. Word tokenization (split on whitespace/punctuation)
3. Protected span detection:
   - Numbers: `/\d+\.?\d*[KMB]?/`, `/\$\d+\.?\d*/`, `/\d+%/`
   - URLs: `/https?:\/\/[^\s]+/`
   - Emails: `/[\w.-]+@[\w.-]+\.\w+/`
   - Dates: Common formats
   - Technical IDs: camelCase, PascalCase, snake_case, SCREAMING_SNAKE
   - Code: backticks, indentation patterns
   - Quoted: `"..."`, `'...'`
4. Source offset tracking (maintain character positions)
5. Unit tests (20+ test cases)

**Key Files:**
```
packages/parser/
├── src/
│   ├── index.ts
│   ├── sentence-segmenter.ts
│   ├── tokenizer.ts
│   ├── protected-span-detector.ts
│   └── patterns.ts
├── tests/
│   ├── sentence.test.ts
│   ├── tokenizer.test.ts
│   └── protected-spans.test.ts
└── package.json
```

**Test Cases Must Include:**
- Simple sentences
- Multiple sentences
- Abbreviations (Dr., Mr., U.S., etc.)
- Numbers in various formats
- URLs and emails
- Code snippets
- Mixed content

---

### Phase 6: Analyzer Package
**Estimated Time:** 4-6 hours  
**Priority:** HIGH

**Package:** `@riri/analyzer`

**Implementation Tasks:**
1. Linguistic feature extraction
2. Complexity scoring:
   - Sentence length average
   - Vocabulary diversity
   - Technical term density
   - Subordinate clause indicators
3. Readability metrics (simplified Flesch-Kincaid)
4. Passive voice detection (be + past participle patterns)
5. Repetition scoring (repeated n-grams)
6. Formality indicators
7. Unit tests (30+ test cases)

**Key Functions:**
```typescript
analyze(parsedText: ParsedText): LinguisticFeatures
calculateComplexity(sentences: Sentence[]): number
detectPassiveVoice(sentence: Sentence): boolean
calculateRepetition(tokens: Token[]): number
estimateFormality(text: string): number
```

**Test Cases Must Include:**
- Simple vs complex sentences
- Passive vs active voice
- Repetitive text
- Technical vs casual text
- Various formality levels

---

### Phase 7: Transformations Package
**Estimated Time:** 12-16 hours  
**Priority:** HIGH

**Package:** `@riri/transformations`

**Implementation Tasks:**

1. **Base Transformation Class**
   ```typescript
   abstract class BaseTransformation implements Transformation {
     abstract id: string
     abstract name: string
     abstract execute(text, context): Promise<TransformationResult>
     
     protected preserveSpans(text: string, spans: ProtectedSpan[]): void
     protected validateOutput(original, transformed): boolean
   }
   ```

2. **Conservative Synonyms** (6-8 hours)
   - Create small synonym dictionary (500-1000 word pairs)
   - Context-aware replacement (POS matching where possible)
   - Strength parameter (0.0 = no change, 1.0 = aggressive)
   - Never replace protected content
   - Never replace within 5 words of another replacement

3. **Phrase Substitution** (2-3 hours)
   - Common verbose phrases → concise alternatives
   - Examples:
     - "due to the fact that" → "because"
     - "in order to" → "to"
     - "at this point in time" → "now"
   - Dictionary-based (50-100 phrase pairs)

4. **Sentence Restructuring** (4-5 hours)
   - Active ↔ Passive voice transformation
   - Clause reordering (careful with meaning)
   - Simple patterns only (avoid breaking semantics)

5. **Other Transformations** (stubs initially)
   - Sentence splitting (identify conjunctions)
   - Sentence merging (combine short related sentences)
   - Redundancy removal (detect and remove)

**Critical Requirements:**
- MUST preserve ALL protected spans
- MUST preserve negation
- MUST provide rollback on failure
- MUST be independently testable

**Test Cases:** 50+ per transformation type

---

### Phase 8: Laya Adapter Completion
**Estimated Time:** 6-8 hours  
**Priority:** HIGH

**Package:** `@riri/laya-adapter`

**Implementation Tasks:**
1. Feature → Laya input conversion
2. ONNX tensor creation
3. Laya inference execution
4. Output parsing and validation (Zod schemas)
5. Timeout handling (250ms default)
6. Error recovery
7. Integration tests with real model

**Key Files:**
```
packages/laya-adapter/
├── src/
│   ├── index.ts
│   ├── laya-engine.ts
│   ├── input-converter.ts
│   ├── output-parser.ts
│   └── schemas.ts (Zod)
└── tests/
    ├── laya-engine.test.ts
    └── integration.test.ts
```

**Critical:** Must work with both FP32 and INT8 models

---

### Phase 9: Heuristic Decision Engine
**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

**Package:** `@riri/decision-engine`

**Implementation Tasks:**
1. Implement `DecisionEngine` interface
2. Mode-specific policies (academic, concise, formal, etc.)
3. Rule-based transformation selection
4. Priority and strength calculation
5. No ML required—purely deterministic

**Example Policy (Academic Mode):**
```typescript
{
  transformations: [
    { id: 'conservative-synonyms', priority: 0.7, strength: 0.25 },
    { id: 'sentence-restructure', priority: 0.6, strength: 0.3 },
    { id: 'formalization', priority: 0.8, strength: 0.4 }
  ],
  preserve: ['technical_terms', 'numbers', 'entities']
}
```

---

### Phase 10: Validator Package
**Estimated Time:** 4-6 hours  
**Priority:** HIGH

**Package:** `@riri/validator`

**Implementation Tasks:**
1. Grammar validation (duplicate words, malformed punctuation)
2. Semantic preservation checks (token overlap, key terms)
3. Protected content verification (100% preservation required)
4. Negation preservation (count negation words)
5. Structural validity

**Critical Tests:**
- Negation flip detection (MUST catch)
- Number preservation (MUST catch violations)
- Protected span preservation (MUST catch violations)

**Test Cases:** 40+ including all critical safety checks

---

### Phase 11: Quality Scorer Package
**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

**Package:** `@riri/scoring`

**Implementation Tasks:**
1. Semantic preservation scoring (token overlap + key terms)
2. Naturalness scoring (penalize over-transformation)
3. Grammar scoring (deduct for issues)
4. Overall quality calculation (weighted combination)
5. Candidate ranking

**Acceptance Threshold:** 0.7 (configurable)

---

### Phase 12: Core Package
**Estimated Time:** 6-8 hours  
**Priority:** HIGH

**Package:** `@riri/core`

**Implementation Tasks:**
1. Main `Riri` class
2. Pipeline orchestration
3. Candidate generation (max 5)
4. Candidate selection (best quality)
5. Rollback system
6. Configuration management
7. Error handling
8. Integration tests

**Public API:**
```typescript
class Riri {
  rewrite(text: string, options?: RewriteOptions): Promise<RewriteResult>
  analyze(text: string): Promise<AnalyzedText>
  validate(original: string, transformed: string): Promise<ValidationResult>
}
```

---

### Phase 13: CLI Implementation
**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

**Commands:**
```bash
riri rewrite "text" [--mode MODE] [--variants N]
riri analyze "text"
riri doctor
riri benchmark
```

**Implementation:**
- Use `commander` or similar CLI framework
- Colorized output
- Progress indicators
- Error handling

---

### Phase 14: Test Suites
**Estimated Time:** 8-10 hours  
**Priority:** HIGH

**Test Coverage:**
1. Unit tests: Each package independently (existing)
2. Integration tests: Full pipeline (NEW)
3. Regression tests: 200+ documented cases (NEW)
4. Safety tests: Negation, numbers, protected content (NEW)
5. Benchmark tests: Performance measurement (NEW)

**Test Dataset Structure:**
```
datasets/
├── paraphrase/
│   ├── simple.json
│   ├── academic.json
│   ├── technical.json
│   └── professional.json
├── edge-cases/
│   ├── negation.json
│   ├── numbers.json
│   ├── urls.json
│   └── code.json
├── regression/
│   └── [bug-fix-test-cases].json
└── benchmark/
    └── performance.json
```

---

### Phase 15: Benchmark Implementation
**Estimated Time:** 4-5 hours  
**Priority:** MEDIUM

**Scripts:**
1. `scripts/benchmark-laya.js` - Model inference performance
2. `apps/benchmark/` - Full pipeline benchmarking

**Metrics:**
- Latency: P50, P95, P99, min, max
- Memory: RSS before/after, peak
- Quality: Average scores across test set
- Success rate

**Outputs:**
- Console summary
- JSON results file
- Markdown report

---

### Phase 16: Playground App
**Estimated Time:** 6-8 hours  
**Priority:** LOW (nice-to-have)

**Tech Stack:** Simple HTML + Vite (or similar)

**Features:**
- Text input
- Mode selection
- Rewrite button
- Side-by-side comparison
- Metrics display
- Transformation inspection
- Developer diagnostics

---

### Phase 17: Optimization
**Estimated Time:** 4-6 hours  
**Priority:** MEDIUM (after v1.0 works)

**Tasks:**
1. Profile with real workloads
2. Identify bottlenecks
3. Cache frequently-used resources
4. Optimize hot paths
5. Parallel transformation attempts (if safe)
6. Memory optimization

---

### Phase 18: Documentation Completion
**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

**Documents to Complete:**
1. `docs/laya.md` - Laya integration details
2. `docs/transformations.md` - Transformation catalog
3. `docs/benchmarks.md` - Performance results
4. `docs/rewritebot-integration.md` - Integration guide
5. API documentation (JSDoc → generated docs)

---

### Phase 19: Packaging & Release
**Estimated Time:** 2-3 hours  
**Priority:** LOW (after v1.0 complete)

**Tasks:**
1. Build all packages
2. Test installation from scratch
3. Create release checklist
4. Tag v1.0.0
5. Publish to npm (if desired)
6. Create GitHub release with notes

---

## 📊 Time Estimates

| Phase | Description | Hours | Priority |
|-------|-------------|-------|----------|
| 4 | Quantization Execution | 1-2 | HIGH |
| 5 | Parser | 4-6 | HIGH |
| 6 | Analyzer | 4-6 | HIGH |
| 7 | Transformations | 12-16 | HIGH |
| 8 | Laya Adapter | 6-8 | HIGH |
| 9 | Heuristic Engine | 3-4 | MEDIUM |
| 10 | Validator | 4-6 | HIGH |
| 11 | Scorer | 3-4 | MEDIUM |
| 12 | Core | 6-8 | HIGH |
| 13 | CLI | 3-4 | MEDIUM |
| 14 | Test Suites | 8-10 | HIGH |
| 15 | Benchmarks | 4-5 | MEDIUM |
| 16 | Playground | 6-8 | LOW |
| 17 | Optimization | 4-6 | MEDIUM |
| 18 | Documentation | 3-4 | MEDIUM |
| 19 | Release | 2-3 | LOW |

**Total Estimated Time:** 75-100 hours  
**Critical Path (HIGH priority):** 50-65 hours

---

## 🎯 Next Session Checklist

### Start with Phase 4 (Quantization)
```bash
cd e:\riri-source\riri

# 1. Install Python dependencies
pip install onnx onnxruntime

# 2. Download model
pnpm model:download

# 3. Verify
pnpm model:verify

# 4. Quantize
pnpm model:quantize

# 5. Check system health
pnpm doctor
```

### Then Move to Phase 5 (Parser)
1. Create package structure
2. Implement sentence segmentation
3. Implement tokenization
4. Implement protected span detection
5. Write tests (20+)
6. Verify all tests pass

### Key Success Criteria
- [ ] Model downloaded and verified
- [ ] INT8 quantized model created
- [ ] Parser package complete
- [ ] All parser tests passing
- [ ] Protected span detection working correctly

---

## 🚨 Critical Reminders

1. **DO NOT MODIFY REWRITEBOT** - Riri is independent
2. **ALWAYS PRESERVE PROTECTED CONTENT** - Numbers, URLs, entities, etc.
3. **NEGATION PRESERVATION IS CRITICAL** - Test extensively
4. **QUALITY > AGGRESSIVENESS** - Rollback if quality drops
5. **NO FAKE FUNCTIONALITY** - Only implement what actually works
6. **TEST EVERY COMPONENT** - Unit + integration + regression
7. **DOCUMENT FAILURES** - Create regression tests for bugs
8. **VERIFY MODEL LICENSE** - Already done, Apache 2.0 confirmed
9. **CPU-FIRST ALWAYS** - No GPU dependencies
10. **PRIVACY BY DEFAULT** - No logging of user text

---

## 📚 Reference Commands

```bash
# Project setup
cd e:\riri-source\riri
pnpm install

# Model setup
pnpm model:download
pnpm model:verify
pnpm model:quantize

# Build
pnpm build

# Test
pnpm test

# Health check
pnpm doctor

# Development
pnpm --filter @riri/parser dev
pnpm --filter @riri/core build

# Run CLI
pnpm cli rewrite "text" --mode academic
pnpm cli analyze "text"
```

---

## 📖 Documentation Structure

All docs in `e:\riri-source\riri\docs\`:
- ✅ `development-environment.md` - System specs
- ✅ `model-license.md` - Laya licensing
- ✅ `architecture.md` - Complete system design
- ⏳ `laya.md` - Laya integration details
- ⏳ `transformations.md` - Transformation catalog
- ⏳ `benchmarks.md` - Performance results
- ⏳ `rewritebot-integration.md` - Integration guide

---

**Remember:** This is a marathon, not a sprint. Build incrementally, test continuously, and never compromise on quality or semantic safety.

**Good luck with the next session!** 🚀
