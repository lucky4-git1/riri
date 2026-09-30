# Riri Codebase Audit — Antigravity / Claude Opus

**Auditor:** Claude Opus (Antigravity)  
**Date:** 2026-09-29  
**Scope:** Full repository inspection + execution  
**Verdict:** ~25% implemented. Good foundations, significant bugs in implemented code, most packages are empty stubs.

---

## Executive Summary

Kiro established a well-planned monorepo with solid architecture documentation, correct Laya model references, and working (but buggy) parser/analyzer/transformations code. However:

1. **4 of 10 packages are completely empty** (core, decision-engine, validator, scoring)
2. **Zero test files exist** anywhere in the project
3. **Apps (playground, benchmark) are empty directories**
4. **Critical bugs** in position tracking, synonym replacement, and phrase substitution
5. **The official `@receptron/laya` npm package exists** — Kiro's custom download/verify/quantize scripts are unnecessary overhead
6. **pnpm-workspace.yaml has broken config** (placeholder strings instead of booleans)
7. **Documentation is ahead of implementation** — README and roadmap describe features that don't exist

### What's Good
- Clean monorepo structure with pnpm workspaces
- Correct Laya model identification (receptron/laya, ModernBERT-large, 421M params, Apache 2.0)
- Well-designed type system (@riri/types — 438 lines of solid interfaces)
- Working parser with sentence segmentation, tokenization, protected span detection
- Working analyzer with readability, formality, complexity scoring
- Working transformations with conservative synonyms and phrase substitution
- Proper separation of concerns (parser → analyzer → transformations)
- Good protected content pattern library (URLs, emails, code, numbers, etc.)

### What's Broken or Missing
- No tests at all (0 test files)
- Token position tracking is broken
- Synonym replacement has position-drift corruption bug
- Synonym and phrase databases conflict with each other
- `getSynonyms()` rebuilds Map on every call (O(n²) performance)
- No core pipeline, no quality engine, no validation engine, no decision engine
- No CLI beyond stub scripts
- No Laya integration (adapter is a placeholder)
- No grammar, spelling, punctuation, summarizer, tone, citation, originality engines

---

## Component-by-Component Audit

### 1. `@riri/types` — ✅ WORKING

| Aspect | Detail |
|--------|--------|
| **Status** | Complete and correct |
| **Files** | `src/index.ts` (438 lines) |
| **Evidence** | Builds clean. All interfaces are well-designed. Error types extend properly. |
| **Issues** | None significant |
| **Severity** | N/A |

Provides: `TextSpan`, `ProtectedSpan`, `Sentence`, `Token`, `LinguisticFeatures`, `AnalyzedText`, `DecisionEngine`, `Transformation`, `QualityMetrics`, `RewriteResult`, `ModelRuntime`, `RiriConfig`, `BenchmarkResult`, error classes.

---

### 2. `@riri/parser` — 🟡 PARTIAL (working but buggy)

| Aspect | Detail |
|--------|--------|
| **Status** | Functional with bugs |
| **Files** | 6 source files (~720 lines total) |
| **Evidence** | `test-parser.js` runs 10/10 passing. Builds clean. Protected spans detect URLs, emails, code, numbers, percentages. |
| **Test files** | ❌ ZERO |

#### Issues

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 HIGH | `tokenizer.ts` | **Token `start`/`end` positions are broken.** `String.split()` with a capturing group produces interleaved segments, but `position` tracking doesn't account for gaps between tokens. All downstream position-dependent code is unreliable. |
| 2 | 🟡 MED | `tokenizer.ts` | `_protectedSpans` parameter is accepted but completely unused. Tokenization doesn't respect protected spans. |
| 3 | 🟡 MED | `patterns.ts` | `NEGATION_WORDS` contains apostrophe-less forms (`cant`, `wont`, `doesnt`) that won't match actual contractions. |
| 4 | 🟡 MED | `patterns.ts` | Technical identifier regex misses `OAuth2`-style identifiers (mixed alphanumeric). Test confirms: `OAuth2` not detected. |
| 5 | 🟡 MED | `patterns.ts` | No time pattern — `9am`, `5pm` not protected. Test confirms these are missed. |
| 6 | 🟢 LOW | `tokenizer.ts` | POS tagging is extremely naive (suffix-based). "bed" → VERB, "fly" → ADV. |
| 7 | 🟢 LOW | `sentence-segmenter.ts` | Sentence boundary detection doesn't handle quotes, parenthetical periods, or numbered lists. |

---

### 3. `@riri/analyzer` — 🟡 PARTIAL (working but issues)

| Aspect | Detail |
|--------|--------|
| **Status** | Functional with quality issues |
| **Files** | 2 source files (~370 lines) |
| **Evidence** | `test-parser.js` shows analyzer output (readability, formality, complexity) producing reasonable values. |
| **Test files** | ❌ ZERO |

#### Issues

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🟡 MED | `analyzer.ts` | Uses `any[]` type in `countTotalSyllables()` and `calculateVocabularyDiversity()` instead of `Token[]`. |
| 2 | 🟡 MED | `analyzer.ts` | `isContraction()` matches possessives ("John's") as contractions — false positives affect formality score. |
| 3 | 🟡 MED | `analyzer.ts` | Passive voice detection omits `'am'` (present in `patterns.ts` but not in analyzer's check). |
| 4 | 🟡 MED | `analyzer.ts` | `detectSubordinateClauses()` returns values > 1.0, skewing complexity calculations. |
| 5 | 🟡 MED | `analyzer.ts` | Multi-word negation `'no one'` in NEGATION_WORDS can never match after whitespace splitting. |
| 6 | 🟢 LOW | `analyzer.ts` | `isIrregularPastParticiple()` allocates `new Set()` on every call. |
| 7 | 🟢 LOW | `analyzer.ts` | Passive detection misses adverb-separated patterns ("was quickly taken"). |

---

### 4. `@riri/transformations` — 🟡 PARTIAL (working but critical bugs)

| Aspect | Detail |
|--------|--------|
| **Status** | Functional with corruption bugs |
| **Files** | 6 source files (~1,200 lines) |
| **Evidence** | Builds clean. Never actually tested via integration — no tests, no CLI exercises it. |
| **Test files** | ❌ ZERO |

#### Issues

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 **CRITICAL** | `conservative-synonym.ts` L201-206 | **Position drift corruption.** After a replacement with different length than original, all subsequent token positions are stale. Code has comment acknowledging this: *"This is simplified — in production we'd need to adjust all future positions."* **Output will be corrupted.** |
| 2 | 🔴 HIGH | `phrases.ts` L330 | `!match.index` — match at position 0 is silently skipped. `!0` is `true` in JS. Should be `match.index === undefined`. |
| 3 | 🟠 HIGH | `synonyms.ts` ↔ `phrases.ts` | **Conflicting transformations.** Synonyms maps `before` → `prior to` and `after` → `subsequent to`. Phrases maps `prior to` → `before` and `subsequent to` → `after`. Running both undoes each other's work. |
| 4 | 🟠 HIGH | `synonyms.ts` | `getSynonyms()`, `hasSynonyms()`, `getSynonymEntry()` all call `buildSynonymMap()` **every time**, rebuilding the entire Map on each invocation inside the hot loop. O(n × m) instead of O(n). |
| 5 | 🟡 MED | `base-transformation.ts` L138 | Proper-noun detection blocks ALL sentence-initial words from replacement (any capitalized word). |
| 6 | 🟡 MED | `synonyms.ts` L49 | `same` → `similar` is semantically incorrect. "Same" and "similar" have different meanings. |
| 7 | 🟡 MED | `synonyms.ts` L99 | `and` → `as well as` is dangerous. Changes grammatical structure in most contexts. |
| 8 | 🟡 MED | `conservative-synonym.ts` | Deterministic synonym choice (always picks shortest). No variation across runs. |
| 9 | 🟢 LOW | `base-transformation.ts` | `isTechnicalTerm()` rebuilds `new Set()` on every call. |
| 10 | 🟢 LOW | Both `plan()` methods | Computed data is discarded; plans are generic stubs. |

**Data sizes:** 73 synonym entries, 44 phrase patterns. Adequate for v0.1 but needs significant expansion.

---

### 5. `@riri/model-runtime` — 🟡 PARTIAL (untested)

| Aspect | Detail |
|--------|--------|
| **Status** | Code exists, never tested (ONNX Runtime not installed) |
| **Files** | 2 source files (~260 lines) |
| **Evidence** | Builds clean. Doctor script confirms `onnxruntime-node` not installed. Cannot verify runtime behavior. |
| **Test files** | ❌ ZERO |

#### Issues

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🟡 MED | `onnx-runtime.ts` | `predict()` accepts `unknown`, casts to `Record<string, ort.Tensor>` with no runtime validation. |
| 2 | 🟡 MED | `onnx-runtime.ts` | `unload()` just sets `session = null` — no explicit `session.release()`. |
| 3 | 🟢 LOW | `onnx-runtime.ts` | `metadata()` returns hardcoded `parameters: 0`. |

---

### 6. `@riri/laya-adapter` — 🔴 PLACEHOLDER

| Aspect | Detail |
|--------|--------|
| **Status** | Placeholder — single constant export |
| **Files** | `src/index.ts` (10 lines: `export const LAYA_ADAPTER_VERSION = '0.1.0';`) |
| **Evidence** | No actual Laya integration code. |
| **Severity** | HIGH — core dependency is missing |

**Critical finding:** The official `@receptron/laya` npm package exists and handles model download, caching, and inference automatically. The custom download/verify scripts are unnecessary. The adapter should wrap the official package.

---

### 7. `@riri/core` — 🔴 MISSING

| Aspect | Detail |
|--------|--------|
| **Status** | Empty directory — no `package.json`, no source files |
| **Evidence** | Only contains empty `src/` directory |

---

### 8. `@riri/decision-engine` — 🔴 MISSING

| Aspect | Detail |
|--------|--------|
| **Status** | Empty directory — no `package.json`, no source files |
| **Evidence** | Only contains empty `src/` directory |

---

### 9. `@riri/validator` — 🔴 MISSING

| Aspect | Detail |
|--------|--------|
| **Status** | Empty directory — no `package.json`, no source files |
| **Evidence** | Only contains empty `src/` directory |

---

### 10. `@riri/scoring` — 🔴 MISSING

| Aspect | Detail |
|--------|--------|
| **Status** | Empty directory — no `package.json`, no source files |
| **Evidence** | Only contains empty `src/` directory |

---

### 11. Scripts

| Script | Status | Issues |
|--------|--------|--------|
| `doctor.js` | 🟡 PARTIAL | Uses `require('os')` in ESM module — crashes at line 195. Should use `import os from 'node:os'`. |
| `download-laya.js` | 🟡 WORKS (untested) | Dead import (`pipeline`), no retry logic, HF revision pinned to `main` not a commit. **Redundant** — `@receptron/laya` handles this. |
| `verify-laya.js` | 🟠 BROKEN | Reads entire ~1.7 GB ONNX file into memory with `readFile()`. ONNX validation is superficial (checks for "onnx" string in header). **Redundant.** |
| `quantize-laya.py` | 🟡 WORKS (untested) | Dead import (`numpy`), interactive prompt blocks CI, no argparse, loads entire FP32 model into memory. |
| `test-parser.js` | ✅ WORKS | Runs 10/10 test cases passing. Detects some gaps (OAuth2, 9am/5pm not protected). |

---

### 12. Apps

| App | Status |
|-----|--------|
| `apps/playground/` | 🔴 EMPTY — no files at all |
| `apps/benchmark/` | 🔴 EMPTY — no files at all |

---

### 13. Configuration

| File | Status | Issue |
|------|--------|-------|
| `pnpm-workspace.yaml` | 🔴 BROKEN | `allowBuilds` values are literal strings `"set this to true or false"` instead of booleans |
| `tsconfig.json` | 🟡 WORKS | Root config builds everything including scripts into `dist/`. Should use project references. |
| `package.json` | ✅ WORKS | Correct monorepo setup. |
| `.gitignore` | ✅ WORKS | Correct exclusions. |
| `.npmrc` | ✅ WORKS | Standard config. |

---

### 14. Documentation

| Document | Status | Issue |
|----------|--------|-------|
| `README.md` | 🟡 MISLEADING | Documents features that don't exist. Placeholder git URL. References 4 nonexistent docs. |
| `docs/architecture.md` | ✅ GOOD | Comprehensive design doc. Accurate about current state. |
| `docs/model-license.md` | ✅ GOOD | Correct license info (Apache 2.0). "Convai Innovations" attribution unverified. |
| `docs/development-environment.md` | 🟢 OK | Snapshot of one machine, not a requirements doc. |
| `STATUS.md` | 🟡 OUT OF SYNC | Conflicts with PROGRESS_REPORT and IMPLEMENTATION_ROADMAP. |
| `IMPLEMENTATION_ROADMAP.md` | 🟡 OUT OF SYNC | Says Phase 3 complete but progress report says Phase 6. |
| `PROGRESS_REPORT.md` | 🟡 INFLATED | Claims 5/10 packages complete but 4 are empty. Claims ~50% but closer to ~25%. |

---

### 15. Laya Model Verification

| Claim | Verified? | Evidence |
|-------|-----------|----------|
| Repository: `receptron/laya` | ✅ YES | Real GitHub repo. Active project. |
| HuggingFace: `receptron/laya-onnx` | ✅ YES | Real HF model repo. Community forks exist. |
| Architecture: ModernBERT-large | ✅ YES | Confirmed: ModernBERT-large backbone (395M) + decision head (26M) = 421M total. |
| Parameters: ~421M | ✅ YES | Confirmed across multiple sources. |
| Format: ONNX | ✅ YES | ONNX export available. |
| License: Apache 2.0 | ✅ YES | Confirmed. Commercial use permitted. |
| npm: `@receptron/laya` | ✅ YES | **Official npm package exists.** Handles download, caching, inference. This is the proper integration path. |
| Model downloaded locally | ❌ NO | No model files in `models/laya/`. No `manifest.json`. |

**Key insight:** Kiro's custom download/verify/quantize scripts are unnecessary. The official `@receptron/laya` npm package provides `Laya.load()` which handles model acquisition, caching, and ONNX inference automatically. Riri should depend on this package directly.

---

### 16. Tests

| Category | Count |
|----------|-------|
| Unit tests | 0 |
| Integration tests | 0 |
| Regression tests | 0 |
| Safety tests | 0 |
| Benchmark tests | 0 |
| **Total** | **0** |

The `tests/` directory has 5 subdirectories — all empty. The only "test" that runs is `scripts/test-parser.js` which is a manual validation script, not a proper test suite.

---

## Severity Summary

| Severity | Count | Examples |
|----------|-------|---------|
| 🔴 CRITICAL/HIGH | 7 | Position drift corruption, empty core packages, zero tests, broken workspace config |
| 🟡 MEDIUM | 15 | Type safety issues, misleading docs, data conflicts, performance bugs |
| 🟢 LOW | 8 | Set allocation per call, naive POS, minor omissions |

---

## Recommendations

### Immediate Fixes (before building new features)
1. Fix position-drift bug in `conservative-synonym.ts`
2. Fix `!match.index` bug in `phrases.ts`
3. Fix `pnpm-workspace.yaml` placeholder booleans
4. Fix `doctor.js` `require('os')` crash in ESM
5. Remove conflicting synonym ↔ phrase entries
6. Cache `buildSynonymMap()` — call once, reuse
7. Fix semantically incorrect synonyms (`same` → `similar`, `and` → `as well as`)

### Architecture Decisions
1. **Use `@receptron/laya` npm package** instead of custom download/verify/quantize scripts
2. Remove or repurpose the custom model scripts
3. Build proper `package.json` for core, decision-engine, validator, scoring packages
4. Implement heuristic decision engine first (doesn't require model)
5. Add project references to root `tsconfig.json`

### Build Order
1. Fix existing bugs in parser/analyzer/transformations
2. Write tests for existing code (target: 100+ for existing components)
3. Build decision-engine (heuristic first, Laya adapter second)
4. Build validator
5. Build scoring/quality engine
6. Build core pipeline
7. Build CLI
8. Build remaining transformation plugins
9. Continue with P1/P2 features

---

*This audit was produced by inspecting every source file, executing existing scripts, verifying external dependencies, and tracing actual execution paths. No claims were accepted at face value.*
