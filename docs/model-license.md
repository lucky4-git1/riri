# Laya Model License Documentation

**Generated:** 2026-09-29  
**Verification Status:** ✅ Verified from official sources

## Source Information

**Laya source:** Convai Innovations  
**Repository:** https://github.com/receptron/laya  
**ONNX Model Repository:** https://huggingface.co/receptron/laya-onnx  
**Checkpoint:** convaiinnovations/laya (English variant)  
**Model:** Laya (ModernBERT-large encoder + Laya decision head)  
**Subfolder:** `multilingual` (default)  
**Revision:** `main` (tracks latest; can be pinned to commit hash)

## Model Details

**Architecture:** ModernBERT-large encoder with Laya decision head  
**Parameters:** 421M (421 million parameters)  
**Format:** ONNX (exported from PyTorch/safetensors)  
**ONNX Files:**
- `laya.onnx` - ONNX graph definition
- `laya.onnx.data` - FP32 weights (~1.7 GB)
- `laya_config.json` - Configuration (max_len, temperatures)
- `tokenizer/tokenizer.json` - Tokenizer
- `tokenizer/tokenizer_config.json` - Tokenizer config

**ONNX Opset:** Standard (compatible with ONNX Runtime)  
**Precision:** FP32 (floating point 32-bit) - unquantized source  
**Size:** ~1.7 GB (FP32), target ~200-400 MB (INT8 quantized)

## Model Inputs/Outputs

**Inputs:**
- `input_ids` [B,L] int64
- `attention_mask` [B,L] int64
- `marker_pos` [B,K] int64
- `marker_mask` [B,K] bool
- `qtype` [B] int64

**Outputs:**
- `logits` [B,K] float32 (uncalibrated; masked slots = -1e4)
- `act_probs` [B,2] float32

**Accuracy:** Max logit difference vs. PyTorch reference ≈ 1e-5

## Licensing

### Model Weights License

**License:** Apache License 2.0  
**Copyright Holder:** Convai Innovations  
**Source:** Official Laya model weights published by Convai Innovations

### Node.js Package License

**Package:** @receptron/laya  
**Repository:** https://github.com/receptron/laya  
**License:** MIT License  
**Code:** Export code and Node.js runtime wrapper

### Combined License Summary

| Component | License | Owner |
|-----------|---------|-------|
| Laya Model Weights | Apache 2.0 | Convai Innovations |
| ONNX Export Code | MIT | receptron/laya project |
| Node.js Runtime | MIT | receptron/laya project |
| Riri Application Code | MIT | Riri Project |

## Apache 2.0 License Terms

The Apache License 2.0 for Laya model weights permits:

✅ **Commercial Use:** Yes, commercial use is explicitly permitted  
✅ **Modification:** Yes, modifications are permitted  
✅ **Distribution:** Yes, redistribution is permitted  
✅ **Private Use:** Yes, private use is permitted  
✅ **Patent Grant:** Yes, includes express patent grant

### Requirements

**Attribution:** ✅ Required  
Must provide:
- Copy of Apache 2.0 license
- Notice of any changes made
- Attribution to Convai Innovations

**State Changes:** ✅ Required  
Must document significant modifications to the model

**Trademark:** ⚠️ Restricted  
No trademark license granted

**Warranty:** ❌ None  
Software provided "as is" without warranties

**Liability:** ❌ Limited  
License limits liability of copyright holders

## Riri Usage Compliance

### How Riri Uses Laya

1. **Download:** Riri downloads official ONNX weights from Hugging Face (receptron/laya-onnx)
2. **Cache:** Weights cached locally under `models/laya/` (not committed to Git)
3. **Quantization:** Riri creates INT8 quantized version for CPU optimization
4. **Runtime:** Loads model via ONNX Runtime (CPUExecutionProvider)
5. **Decision-Making:** Uses Laya for transformation decisions (not text generation)

### Attribution Compliance

Riri provides attribution through:
- This documentation file
- README.md acknowledgment
- License file inclusion
- Model manifest with source information

### Modification Notice

Riri modifies the Laya model by:
- **Quantization:** Converting FP32 weights to INT8 for CPU performance
- **No architectural changes:** Graph structure unchanged
- **No retraining:** Weights not fine-tuned or retrained

All modifications documented in:
- `scripts/quantize-laya.py`
- `models/laya/manifest.json`
- This license documentation

## Distribution

### What Riri Distributes

**Code:** ✅ MIT License (Riri project code)  
**Scripts:** ✅ MIT License (download, quantization scripts)  
**Documentation:** ✅ MIT License  
**Model Weights:** ❌ NOT included in Git repository

### What Users Must Download

Users must separately download Laya model weights:
```bash
pnpm model:download
```

This complies with:
- Git repository size limits
- Clear license separation
- User choice and awareness

### Redistribution Rights

**Riri application code:** ✅ Can redistribute under MIT  
**Laya model weights:** ✅ Can redistribute under Apache 2.0 (with attribution)  
**Quantized models:** ✅ Can redistribute (derivative work under Apache 2.0)  

**Riri does NOT currently redistribute model weights in the repository.**

## Verification Checklist

- [x] Official source identified (Convai Innovations)
- [x] Repository URL verified (receptron/laya)
- [x] Model license confirmed (Apache 2.0)
- [x] Commercial use permitted (Yes)
- [x] Redistribution permitted (Yes)
- [x] Modification permitted (Yes)
- [x] Attribution requirements documented (Yes)
- [x] Patent grant included (Yes, Apache 2.0)
- [x] Model architecture documented (ModernBERT-large)
- [x] Model size documented (421M parameters, 1.7 GB FP32)
- [x] ONNX format verified (Yes)
- [x] Download mechanism documented (Hugging Face)
- [x] Quantization impact documented (FP32 → INT8)

## References

1. **Primary Repository:** https://github.com/receptron/laya
2. **ONNX Model:** https://huggingface.co/receptron/laya-onnx
3. **Apache 2.0 License:** https://www.apache.org/licenses/LICENSE-2.0
4. **Convai Innovations:** Original model creators and copyright holders

## Contact

For licensing questions about Laya model:
- Refer to Convai Innovations
- See https://github.com/receptron/laya

For questions about Riri:
- See Riri project repository
- This software uses Laya under its Apache 2.0 license terms

---

**Last Updated:** 2026-09-29  
**Review Required:** When upgrading Laya model version  
**Compliance Status:** ✅ COMPLIANT
