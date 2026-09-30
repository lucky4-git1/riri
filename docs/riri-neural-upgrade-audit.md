# Riri Neural Upgrade — Full Repository Audit

**Date:** 2026-09-30
**Scope:** Pre-upgrade audit of the entire repository ahead of the neural upgrade
(Laya integration, semantic representation, structural transformations,
multi-candidate search, validation, and reranking).

---

## 1. Executive Summary

Riri v0.1 is a working deterministic rewrite engine with a clean 10-package
TypeScript monorepo, a real ONNX Runtime abstraction, and a functioning
pipeline (parse → analyze → plan → generate → select → validate). However,
the upgrade-relevant gaps are severe:

| Area | Status | Impact on rewrite quality |
| --- | --- | --- |
| Laya adapter | **Stub (9 lines)** — no inference ever runs | The "ML decision engine" is dead code; `LayaDecisionEngine` always falls back to heuristics |
| Model download script | **Broken** — pointed at non-existent `multilingual/` subfolder on HF | Model could never be downloaded; `models/laya/` is empty |
| Transformations | Regex/phrase substitution + naive synonym swap | Output quality = word swaps; no structural rewriting capability exists |
| Candidate generation | 1 cumulative + 1 conservative + N single-transformation candidates | Diversity is limited to "which transformation", never "which strategy combination" |
| Semantic representation | **None** — only aggregate numeric features | Nothing distinguishes subject/predicate/clause structure; passive↔active or clause reordering is impossible |
| Semantic validation | Token-overlap Jaccard | A rewrite that keeps word overlap but changes meaning passes; a rewrite with good synonyms is penalized |
| Naturalness scoring | Repeated-word/punctuation heuristics | Cannot distinguish "The committee did a determination." from natural prose |
| Scoring output | 3 dimensions | No style alignment, diversity, information preservation, hallucination risk, or usefulness |
| Diff intelligence | Flat `Modification[]` per transformation | No change taxonomy (word/phrase/structural/sentence), no strategy attribution |
| Tests | Zero test files (only `scripts/test-parser.js` + `integration-test.mjs`) | Nothing prevents regressions; upgrade cannot be measured |
| Playground | Single dropdown + textarea | No candidate count, generator, strength, or diagnostics surface |

**Baseline behavior** (measured via `integration-test.mjs`, the known failing example):

```
Input:    "The committee has decided to not approve the proposal due to the
           fact that it was absolutely inadequate and furthermore completely
           unnecessary in all respects."
standard: ...due to the fact that it was absolutely insufficient...   (1 word swapped)
concise:  ...because it was absolutely inadequate...                  (1 phrase swap)
```

This is exactly the "one phrase substitution" failure the upgrade targets.

---

## 2. Repository Inventory

```
riri/
├── packages/
│   ├── types/             441 LOC — full shared type system (working)
│   ├── model-runtime/     244 LOC — real onnxruntime-node wrapper (working, unused in prod path)
│   ├── laya-adapter/        9 LOC — STUB
│   ├── parser/          ~1,060 LOC — segmenter, tokenizer, protected spans (working, minor position bugs)
│   ├── analyzer/          371 LOC — linguistic features (working)
│   ├── decision-engine/   461 LOC — heuristic (used) + laya engine (dead code path)
│   ├── transformations/ ~2,080 LOC — 10 transformations, all lexical/phrase regex level
│   ├── validator/         376 LOC — protected content, negation, freeze, semantic, grammar gates
│   ├── scoring/           325 LOC — semantic (Jaccard), naturalness (heuristics), grammar, selector
│   └── core/            ~1,570 LOC — Riri facade, pipeline, candidate generator, CLI,
│                                     grammar/readability/tone/summarizer/freeze/dictionary
├── apps/playground/        web UI (mode dropdown, textarea, diff view)
├── apps/benchmark/         EMPTY
├── scripts/                download-laya.js (broken URL), verify-laya.js, quantize-laya.py,
│                           doctor.js, test-parser.js
├── datasets/               test-cases.json (10 parser cases); all other dirs EMPTY
├── models/laya/            EMPTY (no .onnx files)
└── tests/                  all subdirectories EMPTY (vitest configured, zero tests)
```

---

## 3. Pipeline Execution Path (as-built)

```
Riri.rewrite(text, options)                     packages/core/src/riri.ts
  └─ Pipeline.rewrite()                         packages/core/src/pipeline.ts
      1. FreezeWordsManager.detectSpans()       freeze words → ProtectedSpan[]
      2. Parser.parse(text)                     sentences, tokens, protected spans
      3. Analyzer.analyze(text)                 aggregate LinguisticFeatures (numbers only)
      4. QualityScorer.score(text, text)        baseline quality (always ~perfect)
      5. DecisionEngine.plan(features, ctx)     TransformationPlan
         ├─ LayaDecisionEngine.plan()           ← if adapter ready (NEVER: adapter is null)
         │    └─ adapter.predictDecisions()     ← does not exist
         └─ HeuristicDecisionEngine.plan()      ← ALWAYS used in practice
              └─ mode profile + feature tweaks  (static multipliers)
      6. CandidateGenerator.generate()          packages/core/src/candidate-generator.ts
         ├─ Candidate 1: cumulative chain of plan (priority order, strength 1.0)
         ├─ Candidate 2: same chain at 0.6 strength
         └─ Candidates 3+: each single transformation in isolation
      7. CandidateSelector.selectBest()         best overallQuality vs. baseline, rollback
      8. ValidationEngine.validateAll()         final safety gate (protected/negation/freeze/semantic/grammar)
```

### Information loss between stages

- `Analyzer.analyze()` discards sentence structure entirely: the decision engine
  receives ~15 scalar features. It cannot know *what* is verbose, only *how
  verbose overall* the text is.
- `TransformationPlan` carries only `TransformationDecision[]` (id/priority/
  strength). No sentence targets, no spans, no anchors, no style vector.
- `Candidate` carries final text + aggregate `QualityMetrics`. The selector
  cannot see *why* a candidate scored well, or compare candidates structurally.
- `Modification` positions refer to pre-transformation offsets in each step;
  after chained transformations, recorded spans are stale.

---

## 4. Laya Integration Status (Critical Gap)

**What Laya actually is** (verified against `receptron/laya-onnx` and
`@receptron/laya` docs):

- ModernBERT-large encoder (421M params) + decision head, exported to ONNX
  (Apache 2.0, Convai Innovations).
- NOT a text generator. It answers **typed questions about a state** in one
  forward pass:
  - `choice` — pick one of K options with calibrated probabilities
  - `score` — expected level on an ordered rubric with distribution
  - `noul` — calibrated P(true) for a yes/no statement
- ONNX signature: `input_ids[B,L]`, `attention_mask[B,L]`, `marker_pos[B,K]`,
  `marker_mask[B,K]`, `qtype[B]` → `logits[B,K]`, `act_probs[B,2]`.
- `laya_config.json` holds `max_len`, `head_max_len`, per-cardinality
  temperatures.
- Files live at the **root** of `receptron/laya-onnx` (no `multilingual/`
  subfolder — the current download script is wrong and 404s).
- Official Node runtime: `@receptron/laya` (npm, MIT, matches Python reference
  to 4 decimals; CPU via onnxruntime-node; ~140ms per batched call warm).

**Current state in repo:**

- `packages/laya-adapter/src/index.ts` exports one constant. No load, no
  tokenization, no inference, no health, no metadata.
- `packages/decision-engine/src/laya-engine.ts` correctly anticipates an
  adapter interface (`isReady`, `predictDecisions`) and validates/normalizes
  output, and falls back deterministically — good bones, no engine behind it.
- `Riri` constructor creates `createLayaDecisionEngine({ timeoutMs: 250 })`
  **without an adapter** when `decisionEngine: 'laya'` is configured → silent
  heuristic fallback (metadata reports it, but no model is ever touched).
- `@riri/model-runtime` (ONNXRuntime class) is complete but **never
  instantiated** anywhere in the production path.

**Conclusion:** No ONNX inference has ever executed in Riri. The claim
"Laya decision engine" in README/STATUS is aspirational, not factual.

---

## 5. Transformation Engine Analysis

All ten transformations operate at Level 1 (lexical) or shallow Level 4
(discourse-opener swaps). Nothing touches phrase structure or syntax.

| Transformation | Level | Mechanism | Notable issues |
| --- | --- | --- | --- |
| `conservative-synonym` | L1 | synonym map (≈190 entries) + inflection (`-s/-ed/-ing/-ly`) | Picks synonym by mode-length heuristic, not context; "made a decision" → "did a determination"-class errors are unguarded; `chooseSynonym` ignores collocations |
| `phrase-substitution` | L1 | ~44 phrase regexes | Overlaps/conflicts with concision (e.g. `prior to`↔`before` in both directions) |
| `concision` | L1 | 20 verbose-phrase regexes | Exactly the "due to the fact that → because" behavior called out as insufficient |
| `sentence-restructure` | L4 (opener swaps only) | 32 transitional-opener regexes | Renames openers; does not restructure anything |
| `formalization` | L1 | informal→formal word/phrase maps | Register-shift only |
| `simplification` | L1 | complex→simple word maps | Vocabulary swap only |
| `redundancy-removal` | L1/L4 | intensifier/redundancy regexes | Cannot merge double adjectives ("absolutely inadequate and furthermore completely unnecessary") |
| `sentence-split` | L4 | conjunction-based split | Naive; only splits at coordinating conjunctions |
| `sentence-merge` (in phrases/index) | L4 | — | minimal |
| — | L2/L3 | **MISSING** | No NP/VP restructuring, no modifier movement, no active↔passive, no clause reordering, no subject/object re-expression |

**Structural consequence:** even with perfect decisions, the transformation
arsenal cannot produce "The committee rejected the proposal because it was
considered inadequate and unnecessary in several respects." — there is no
operation that can compress `decided not to approve` → `rejected`,
`absolutely inadequate and furthermore completely unnecessary` →
`inadequate and unnecessary`, or restructure clause order.

**Dictionary quality notes:**

- `synonyms.ts`: solid curated entries with POS tags, but no semantic class,
  no collocation constraints, no register on most entries, no "avoid" lists
  (e.g., `decided → determined` is invalid for the committee sense; nothing
  prevents it beyond luck).
- Conflicting round-trips: `synonyms.ts` maps `before → prior to` while
  `phrases.ts` maps `prior to → before` (and vice versa), so chains can
  oscillate or double-apply across cumulative candidates.

---

## 6. Scoring & Validation Analysis

### Scoring (packages/scoring)

- `SemanticScorer`: content-word coverage + Jaccard + length ratio.
  - A meaning-flipping rewrite that keeps words passes (e.g., negation moved
    off the scored token window is caught only by the separate negation
    validator).
  - A high-quality paraphrase with several legitimate synonyms is *penalized*
    (coverage drops) — actively biases the selector against strong rewrites.
- `NaturalnessScorer`: repeated-word/word-variety/punctuation heuristics.
  Cannot detect collocation violations ("did a determination") or article
  errors introduced by replacement.
- `GrammarScorer` (49 LOC): token/ratio sanity checks only.
- `QualityScorer` weights: 0.45 semantic + 0.30 grammar + 0.25 naturalness.
  No style alignment, no diversity, no information preservation, no
  hallucination risk, no usefulness. Missing: 9 of the 12 required dimensions.
- `CandidateSelector`: picks max `overallQuality`, rolls back if not better
  than baseline. Because baseline (original vs. original) scores ~1.0, any
  candidate with several synonym changes starts ~0.2-0.3 lower on "semantic
  preservation" — the selector is structurally biased toward trivial edits.
  This explains the observed 1-word-swap outputs.

### Validation (packages/validator)

- Protected content: substring presence per span value (works; misses
  placeholder-corruption cases and count changes: "95%" appearing twice).
- Negation: count of negation words (works at word level; misses "not only…
  but also" scope, double negation semantics).
- Freeze words: presence check.
- Semantic validator: token overlap thresholds.
- Grammar validator: heuristics.
- **Missing entirely:** number/entity/date delta checks (anti-hallucination
  gate), fact/anchor delta, sentence-count sanity, quoted-material integrity,
  casing repair, article/agreement checks after substitution.

---

## 7. Parser & Analyzer Notes

- `ProtectedSpanDetector` covers URLs, emails, numbers, dates, code,
  versions, file paths, packages, citations, quoted text — a solid base for
  Phase 15 placeholders.
- Tokenizer position tracking has known drift issues in edge cases
  (contractions, hyphenates); `conservative-synonym.ts` works around it with
  cumulative offsets — fragile but currently functional.
- Analyzer computes: complexity, readability (Flesch), formality, passive
  ratio, repetition, technical ratio — aggregate only. Phase 3 needs
  per-sentence clause structure, which does not exist anywhere yet.

---

## 8. Tests, Datasets, Benchmark

- `tests/{unit,integration,regression,safety,benchmark}` — all empty.
  Vitest is configured per-package (`"test": "vitest run"`) but there are
  zero `*.test.ts` files.
- `datasets/test-cases.json` — 10 parser smoke cases.
- `datasets/{edge-cases,grammar,laya,paraphrase,regression,technical}` — empty.
- `apps/benchmark` — empty directory; `package.json` references
  `@riri/benchmark` scripts that do not exist (`benchmark:rewrite`,
  `scripts/benchmark-laya.js` missing).
- The committee example exists only as hardcoded strings in
  `integration-test.mjs`, `apps/playground/index.html`,
  `concision.ts`, `phrases.ts` — not as a property-based regression case.

---

## 9. Where the Pipeline Loses Quality (Root-Cause Map)

1. **Selector bias toward trivial edits** — `SemanticScorer` conflates
   "different words" with "different meaning", so strong paraphrases lose to
   weak ones. *(scoring/semantic-scorer.ts, scoring/candidate-selector.ts)*
2. **No structural operations exist** — Levels 2-3 transformations absent.
   *(packages/transformations/src/*)*
3. **Decisions are scalar, not structural** — plan cannot say "restructure
   sentence 0, compress predicate, protect anchor X".
   *(types: TransformationPlan; decision-engine; analyzer)*
4. **Synonym choice ignores context** — mode-length heuristic only.
   *(conservative-synonym.ts chooseSynonym)*
5. **Candidate space is 1-D** — only "which transformation first", never
   alternative strategy mixes. *(candidate-generator.ts)*
6. **No repair loop** — invalid candidates are dropped, never repaired.
   *(pipeline.ts)*
7. **Laya never runs** — dead code path. *(laya-adapter, riri.ts)*
8. **No intensity ladder** — `aggressiveness` scales replacement *counts*,
   not strategy depth. *(heuristic-engine, transformations)*
9. **No anti-hallucination gate** — new entities/numbers would pass
   validation if synonyms introduced them. *(validator)*
10. **Diff metadata unusable by UI** — no change taxonomy. *(types: Modification)*

---

## 10. What Works and Must Be Preserved

- Grammar proofreader, readability engine, tone analyzer, extractive
  summarizer, freeze words, custom dictionary — all independent of the
  rewrite path and functional.
- Protected-span detection (parser) — foundation for placeholders.
- Deterministic fallback behavior in `LayaDecisionEngine` (correct pattern).
- Final safety gate + rollback in `Pipeline.rewrite`.
- CLI (`packages/core/src/cli.ts`) with rewrite/analyze/benchmark/doctor.
- Playground server + diff rendering.
- ONNX Runtime wrapper in `@riri/model-runtime`.

---

## 11. Upgrade Plan (mapped to phases)

| Phase | Work | Primary files/packages |
| --- | --- | --- |
| 1 | Real Laya adapter via `@receptron/laya` (load/unload/isReady/health/metadata/predictDecisions), fix download script (done), wire into `Riri` with explicit load/warmup | `packages/laya-adapter/*`, `riri.ts`, `scripts/download-laya.js` |
| 2 | `RewritePlan` IR (sentences, protectedSpans, semanticAnchors, operations with type/strength/confidence, style vector); Laya drives plan via choice/score/noul questions | `@riri/types`, `decision-engine`, `laya-adapter` |
| 3 | Sentence-level semantic representation (clause splitting, subject/predicate/object, negation scope, tense/modality, anchors, entities) | new `packages/analyzer` module |
| 4-6 | Transformation Levels 2-4 (NP/VP restructure, modifier movement, active↔passive, clause reorder, verb-frame compression e.g. "decided not to approve"→"rejected", discourse merge), generator router, hybrid pipeline | `packages/transformations`, `packages/core/src/pipeline.ts` |
| 7-8 | Contextual lexical selector: POS/collocation/register/tense/number guards; synonym candidates scored, not first-match | `packages/transformations/src/contextual-lexical.ts` |
| 9-10 | Sentence-level ops + beam-search candidate generator (beamWidth 5, candidateLimit 12) | `packages/core/src/candidate-generator.ts` |
| 11-12 | 12-dimension quality metrics + semantic equivalence scoring (anchor alignment, not just overlap) | `packages/scoring` |
| 13-15 | Intensity levels 0-4 driving strategy depth; style profiles; placeholder-based protection | `decision-engine`, `parser`, `pipeline` |
| 16-18 | Typed diff metadata (word/phrase/structural/sentence), repair loop (max 2 iters), diversity + seeded mode | `types`, `scoring`, `pipeline` |
| 19-22 | Benchmarks (short/medium/long, p50/p95), property-based eval dataset, committee regression, anti-hallucination anchor-delta gate | `datasets`, `tests`, `apps/benchmark` |
| 24-27 | `rewrite(text, { mode, aggressiveness, intensity, generator, maxCandidates, seed, … })`, debug metadata without user text, playground upgrade | `@riri/types`, `core`, `apps/playground` |
| 5 (backend) | Optional local neural generator — evaluate small ONNX encoder-decoder paraphrasers; architecture ready, model optional | new `packages/laya-adapter` sibling or `packages/generator` |

**Anti-goal guardrails** (Phase 28): no giant regex dumps; every new pattern
list must be small, generalizable, and paired with structural operations and
model-guided decisions.

---

## 12. Immediate Correctness Fixes Required

1. `scripts/download-laya.js` — fixed in this audit (subfolder removed).
2. `scripts/benchmark-laya.js` referenced by `package.json` but missing.
3. `apps/benchmark` empty but referenced by workspace scripts.
4. Zero test files → vitest suites must be created before any refactor
   (regression safety net).

---

*End of audit. Implementation begins with Phase 1 (Laya integration).*
