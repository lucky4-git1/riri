# Laya Model Directory

This directory contains the Laya decision model files.

## Important

**Model files are NOT committed to Git** due to their large size (~1.7 GB for FP32).

## Setup

To download and set up the Laya model:

```bash
# From project root
pnpm model:download
pnpm model:verify
pnpm model:quantize
```

## Expected Files

After running `pnpm model:download`:

- `laya.onnx` - ONNX graph definition
- `laya.onnx.data` - FP32 weights (~1.7 GB)
- `laya_config.json` - Model configuration
- `tokenizer/tokenizer.json` - Tokenizer
- `tokenizer/tokenizer_config.json` - Tokenizer config
- `manifest.json` - Download manifest with checksums

After running `pnpm model:quantize`:

- `laya_int8.onnx` - Quantized INT8 model
- `laya_int8.onnx.data` - INT8 weights (~200-400 MB)

## Model Information

- **Source:** receptron/laya-onnx on Hugging Face
- **License:** Apache 2.0 (Convai Innovations)
- **Architecture:** ModernBERT-large + Laya decision head
- **Parameters:** 421M
- **Format:** ONNX
- **Documentation:** See `docs/model-license.md`

## Cache Location

Models are also cached by @receptron/laya in:
- Windows: `%USERPROFILE%\.cache\receptron-laya`
- Linux/Mac: `~/.cache/receptron-laya`

Riri uses local models from this directory for better control over quantization and versioning.
