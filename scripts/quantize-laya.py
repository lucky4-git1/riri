#!/usr/bin/env python3

"""
Laya Model Quantization Script

Converts FP32 Laya ONNX model to INT8 for CPU-optimized inference.

This uses ONNX Runtime's quantization tools to create a quantized model
suitable for fast CPU inference with minimal quality degradation.
"""

import sys
import os
import json
from pathlib import Path
import time

def check_dependencies():
    """Check if required packages are installed."""
    missing = []
    
    try:
        import onnx
    except ImportError:
        missing.append('onnx')
    
    try:
        import onnxruntime
    except ImportError:
        missing.append('onnxruntime')
    
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        missing.append('onnxruntime quantization tools')
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("\nInstall with:")
        print("  pip install onnx onnxruntime")
        sys.exit(1)

check_dependencies()

import onnx
import onnxruntime as ort
from onnxruntime.quantization import quantize_dynamic, QuantType
import numpy as np

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MODELS_DIR = PROJECT_ROOT / 'models' / 'laya'
SOURCE_MODEL = MODELS_DIR / 'laya.onnx'
QUANTIZED_MODEL = MODELS_DIR / 'laya_int8.onnx'
MANIFEST_PATH = MODELS_DIR / 'manifest.json'

# ANSI colors
class Colors:
    RESET = '\033[0m'
    BRIGHT = '\033[1m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    CYAN = '\033[36m'

def log(message, color=Colors.RESET):
    """Print colored log message."""
    print(f"{color}{message}{Colors.RESET}")

def format_bytes(size):
    """Format bytes to human-readable string."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"

def verify_source_model():
    """Verify source model exists and is valid."""
    log("\n=== Verifying Source Model ===\n", Colors.BRIGHT)
    
    if not SOURCE_MODEL.exists():
        log(f"❌ Source model not found: {SOURCE_MODEL}", Colors.RED)
        log("\nRun: pnpm model:download", Colors.YELLOW)
        sys.exit(1)
    
    log(f"✓ Source model found: {SOURCE_MODEL}", Colors.GREEN)
    
    source_size = SOURCE_MODEL.stat().st_size
    log(f"  Size: {format_bytes(source_size)}", Colors.BLUE)
    
    # Check if data file exists
    data_file = MODELS_DIR / 'laya.onnx.data'
    if data_file.exists():
        data_size = data_file.stat().st_size
        log(f"✓ Data file found: {format_bytes(data_size)}", Colors.GREEN)
        source_size += data_size
    
    # Validate ONNX structure
    try:
        log("\nValidating ONNX model...", Colors.CYAN)
        model = onnx.load(str(SOURCE_MODEL))
        onnx.checker.check_model(model)
        log("✓ ONNX model is valid", Colors.GREEN)
        
        # Print model info
        graph = model.graph
        log(f"\nModel Information:", Colors.CYAN)
        log(f"  Inputs: {len(graph.input)}", Colors.BLUE)
        for inp in graph.input:
            log(f"    - {inp.name}: {inp.type}", Colors.BLUE)
        log(f"  Outputs: {len(graph.output)}", Colors.BLUE)
        for out in graph.output:
            log(f"    - {out.name}: {out.type}", Colors.BLUE)
        
        return source_size
    except Exception as e:
        log(f"❌ ONNX validation failed: {e}", Colors.RED)
        sys.exit(1)

def quantize_model(source_size):
    """Quantize the model to INT8."""
    log("\n=== Quantizing Model ===\n", Colors.BRIGHT)
    
    log("Quantization method: Dynamic INT8", Colors.CYAN)
    log("Target: CPU inference optimization", Colors.CYAN)
    log("This may take a few minutes...\n", Colors.YELLOW)
    
    start_time = time.time()
    
    try:
        # Dynamic quantization (INT8)
        # This converts weights to INT8 and quantizes activations dynamically at runtime
        quantize_dynamic(
            model_input=str(SOURCE_MODEL),
            model_output=str(QUANTIZED_MODEL),
            weight_type=QuantType.QUInt8,  # Unsigned INT8 for weights
            optimize_model=True,  # Apply ONNX Runtime optimizations
            extra_options={
                'EnableSubgraph': True,
                'ForceQuantizeNoInputCheck': False
            }
        )
        
        duration = time.time() - start_time
        log(f"✓ Quantization completed in {duration:.1f}s", Colors.GREEN)
        
        # Get quantized model size
        quantized_size = QUANTIZED_MODEL.stat().st_size
        
        # Check for data file
        quantized_data = Path(str(QUANTIZED_MODEL) + '.data')
        if quantized_data.exists():
            quantized_size += quantized_data.stat().st_size
        
        log(f"\nModel Sizes:", Colors.CYAN)
        log(f"  FP32: {format_bytes(source_size)}", Colors.BLUE)
        log(f"  INT8: {format_bytes(quantized_size)}", Colors.BLUE)
        
        compression_ratio = (1 - quantized_size / source_size) * 100
        log(f"  Compression: {compression_ratio:.1f}%", Colors.GREEN)
        
        return quantized_size
    except Exception as e:
        log(f"❌ Quantization failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)

def verify_quantized_model():
    """Verify quantized model is valid."""
    log("\n=== Verifying Quantized Model ===\n", Colors.BRIGHT)
    
    try:
        # Load and check
        log("Loading quantized model...", Colors.CYAN)
        model = onnx.load(str(QUANTIZED_MODEL))
        onnx.checker.check_model(model)
        log("✓ ONNX structure valid", Colors.GREEN)
        
        # Try to create inference session (CPU only)
        log("Creating ONNX Runtime session...", Colors.CYAN)
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        
        session = ort.InferenceSession(
            str(QUANTIZED_MODEL),
            sess_options=sess_options,
            providers=['CPUExecutionProvider']
        )
        
        log("✓ ONNX Runtime session created", Colors.GREEN)
        log(f"  Execution providers: {session.get_providers()}", Colors.BLUE)
        
        # Print input/output info
        log("\nModel I/O:", Colors.CYAN)
        for inp in session.get_inputs():
            log(f"  Input: {inp.name} {inp.shape} {inp.type}", Colors.BLUE)
        for out in session.get_outputs():
            log(f"  Output: {out.name} {out.shape} {out.type}", Colors.BLUE)
        
        return True
    except Exception as e:
        log(f"❌ Verification failed: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return False

def update_manifest():
    """Update manifest with quantized model info."""
    log("\n=== Updating Manifest ===\n", Colors.BRIGHT)
    
    try:
        if MANIFEST_PATH.exists():
            with open(MANIFEST_PATH, 'r') as f:
                manifest = json.load(f)
        else:
            manifest = {}
        
        manifest['quantized_model'] = {
            'path': 'laya_int8.onnx',
            'quantization': 'INT8 dynamic (QUInt8)',
            'method': 'onnxruntime.quantization.quantize_dynamic',
            'created_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'size_bytes': QUANTIZED_MODEL.stat().st_size
        }
        
        with open(MANIFEST_PATH, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        log("✓ Manifest updated", Colors.GREEN)
    except Exception as e:
        log(f"⚠️  Manifest update failed: {e}", Colors.YELLOW)

def main():
    """Main quantization workflow."""
    log("\n" + "="*50, Colors.BRIGHT)
    log("  Laya Model Quantization (FP32 → INT8)", Colors.BRIGHT)
    log("="*50, Colors.BRIGHT)
    
    # Check if already quantized
    if QUANTIZED_MODEL.exists():
        log(f"\n⚠️  Quantized model already exists: {QUANTIZED_MODEL}", Colors.YELLOW)
        response = input("Overwrite? [y/N]: ").strip().lower()
        if response != 'y':
            log("Aborted.", Colors.YELLOW)
            sys.exit(0)
    
    # Step 1: Verify source
    source_size = verify_source_model()
    
    # Step 2: Quantize
    quantized_size = quantize_model(source_size)
    
    # Step 3: Verify quantized
    if not verify_quantized_model():
        log("\n❌ Quantized model validation failed!", Colors.RED)
        sys.exit(1)
    
    # Step 4: Update manifest
    update_manifest()
    
    # Success summary
    log("\n" + "="*50, Colors.BRIGHT)
    log("  ✅ Quantization Complete!", Colors.GREEN)
    log("="*50, Colors.BRIGHT)
    log(f"\nQuantized model: {QUANTIZED_MODEL}", Colors.CYAN)
    log(f"Size: {format_bytes(quantized_size)}", Colors.CYAN)
    log("\nNext steps:", Colors.YELLOW)
    log("  1. Run: pnpm model:benchmark", Colors.YELLOW)
    log("  2. Run: pnpm doctor", Colors.YELLOW)
    log("  3. Run: pnpm build", Colors.YELLOW)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log("\n\n❌ Interrupted by user", Colors.RED)
        sys.exit(1)
    except Exception as e:
        log(f"\n❌ Unexpected error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        sys.exit(1)
