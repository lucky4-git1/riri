# Riri

**Local-First Intelligent Writing Transformation Engine**

Riri is a privacy-focused, CPU-first writing transformation engine that performs intelligent text transformations **without requiring cloud LLM APIs**. It uses a quantized Laya decision engine to make smart decisions about how to transform text, while keeping all processing local and private.

## What Riri Is

Riri is **not an LLM**. It's a sophisticated linguistic transformation engine that:

- Analyzes text structure and linguistic features
- Uses a local quantized decision model (Laya) to plan transformations
- Applies deterministic transformations guided by the decision model
- Validates and scores outputs for quality and semantic preservation
- Runs entirely on CPU without requiring GPU or cloud services

## Why Riri Exists

Most writing tools today require:
- ❌ Cloud API subscriptions (OpenAI, Anthropic, etc.)
- ❌ GPU hardware (NVIDIA, CUDA)
- ❌ Internet connectivity
- ❌ Sending private text to third parties

Riri requires:
- ✅ Local CPU (any modern processor)
- ✅ No internet after installation
- ✅ No external LLM services
- ✅ Complete privacy
- ✅ Deterministic, explainable transformations

## Architecture

```
USER TEXT
    ↓
RIRI ANALYZER (linguistic features, protected spans)
    ↓
LINGUISTIC FEATURES
    ↓
QUANTIZED LAYA DECISION ENGINE (INT8, CPU-optimized)
    ↓
TRANSFORMATION PLAN (which transformations, strength, priority)
    ↓
LOCAL TRANSFORMATION ENGINE (synonym, restructure, etc.)
    ↓
VALIDATION ENGINE (grammar, semantics, protected content)
    ↓
QUALITY SCORER (semantic preservation, naturalness)
    ↓
FINAL RESULT
```

### Key Components

- **Laya**: Decision engine (NOT a text generator) - determines what transformations to apply
- **Analyzer**: Extracts linguistic features, identifies protected content (numbers, URLs, entities)
- **Transformations**: Modular plugins for different rewriting strategies
- **Validator**: Ensures semantic preservation, grammar correctness
- **Quality Scorer**: Measures output quality without external APIs

## Installation

```bash
# Clone repository
git clone https://github.com/your-org/riri.git
cd riri

# Install dependencies
pnpm install

# Download and prepare Laya model
pnpm model:download
pnpm model:verify
pnpm model:quantize

# Verify installation
pnpm doctor

# Build
pnpm build
```

## Usage

### CLI

```bash
# Basic rewrite
riri rewrite "Your text here"

# With mode
riri rewrite "Your text here" --mode academic
riri rewrite "Your text here" --mode formal
riri rewrite "Your text here" --mode concise

# Generate multiple variants
riri rewrite "Your text here" --variants 5

# Analyze text
riri analyze "Your text here"

# Run benchmarks
riri benchmark
riri benchmark:laya
riri benchmark:rewrite

# Health check
riri doctor
```

### API

```typescript
import { Riri } from "@riri/core";

const riri = new Riri({
  decisionEngine: "laya"
});

const result = await riri.rewrite("Your text here", {
  mode: "academic",
  aggressiveness: 0.3
});

console.log(result.text);
console.log(result.metrics);
console.log(result.transformations);
```

## Features

### Supported Transformations

- **Conservative Synonyms**: Context-aware word replacement
- **Phrase Substitution**: Multi-word phrase improvements
- **Sentence Restructuring**: Active/passive voice, clause reordering
- **Sentence Splitting/Merging**: Improve readability
- **Redundancy Removal**: Eliminate repetitive content
- **Formalization**: Increase academic/professional tone
- **Simplification**: Reduce complexity
- **Concision**: Remove unnecessary verbosity

### Protected Content

Riri preserves:
- Numbers and measurements
- URLs and email addresses
- Dates and times
- Technical identifiers
- Code snippets
- Proper nouns and entities
- Quoted content
- Citations

### Writing Modes

- `standard`: Balanced transformation
- `fluency`: Focus on natural flow
- `academic`: Formal, technical style
- `professional`: Business-appropriate
- `formal`: Increased formality
- `simple`: Reduce complexity
- `concise`: Maximum brevity

## Performance

Target performance on modern CPU (Intel i5 or equivalent):

- **Short sentence** (< 20 words): < 50ms
- **Paragraph** (100-200 words): < 150ms
- **Laya inference**: < 10ms (warm)
- **Model size**: ~200MB (INT8 quantized)
- **Memory usage**: < 500MB runtime

*Actual performance depends on CPU and text complexity*

## Model: Laya

Riri uses **Laya** as its decision engine:

- **Purpose**: Decision-making (NOT text generation)
- **Architecture**: ModernBERT-based
- **Parameters**: ~421M (quantized to INT8)
- **Runtime**: ONNX Runtime (CPU)
- **License**: See [docs/model-license.md](docs/model-license.md)

Laya determines:
- Which transformations to apply
- Transformation strength and priority
- What content to preserve
- When to skip transformations

The actual text transformation is performed by Riri's deterministic transformation engine.

## Limitations

Riri v1 has clear limitations:

- **Not a generative AI**: Cannot create entirely new content
- **Extractive summarization only**: No abstractive summarization
- **English-focused**: Primary support for English text
- **Bounded creativity**: Deterministic transformations, not open-ended generation
- **Quality depends on input**: Poor input → limited improvement
- **CPU latency**: Slower than cloud GPU inference, but acceptable for interactive use

## Development

```bash
# Run tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration
pnpm test:regression

# Lint
pnpm lint

# Build all packages
pnpm build

# Start playground
pnpm playground
```

## Project Structure

```
riri/
├── packages/          # Core libraries
│   ├── core/         # Main orchestration
│   ├── analyzer/     # Text analysis
│   ├── transformations/ # Transformation plugins
│   ├── validator/    # Output validation
│   ├── scoring/      # Quality metrics
│   ├── laya-adapter/ # Laya integration
│   └── model-runtime/ # ONNX Runtime abstraction
├── apps/
│   ├── playground/   # Developer UI
│   └── benchmark/    # Performance testing
├── models/           # Model files (gitignored)
├── scripts/          # Tooling scripts
├── datasets/         # Test datasets
└── docs/            # Documentation
```

## Documentation

- [Architecture](docs/architecture.md)
- [Laya Decision Engine](docs/laya.md)
- [Transformations](docs/transformations.md)
- [Benchmarks](docs/benchmarks.md)
- [Model License](docs/model-license.md)
- [Development Environment](docs/development-environment.md)
- [RewriteBot Integration](docs/rewritebot-integration.md)

## Contributing

Contributions welcome! Please:

1. Read the architecture documentation
2. Write tests for new features
3. Ensure benchmarks don't regress
4. Follow the existing code style
5. Add regression tests for bug fixes

## License

MIT License - see [LICENSE](LICENSE)

**Model License**: See [docs/model-license.md](docs/model-license.md) for Laya model licensing

## Privacy

Riri is designed for privacy:

- All processing happens locally
- No telemetry or tracking
- No network requests after installation
- No data sent to third parties
- User text never leaves the machine

## Roadmap

- [ ] v1.0: Core engine with Laya INT8
- [ ] Browser/WASM support
- [ ] Additional language support
- [ ] Optional cloud model providers
- [ ] Fine-tuned Laya for specific domains
- [ ] RewriteBot integration

## Credits

- **Laya Model**: [receptron/laya](https://github.com/receptron/laya)
- **ONNX Runtime**: Microsoft
- Built with TypeScript, Node.js, and Python
