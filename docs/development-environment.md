# Riri Development Environment

**Generated:** 2026-09-29

## System Information

- **Operating System:** Microsoft Windows NT 10.0.26200.0
- **Platform:** Win32NT
- **Architecture:** x64

## Hardware

### CPU
- **Processor:** Intel(R) Core(TM) i5-8250U CPU @ 1.60GHz
- **Cores:** 4 physical cores
- **Logical Processors:** 8 threads
- **Max Clock Speed:** 1800 MHz

### Memory
- **Total RAM:** 15.85 GB

### GPU
- **Graphics:** Intel(R) UHD Graphics 620
- **VRAM:** 1 GB
- **Note:** Integrated GPU, not suitable for CUDA workloads

### Storage
- **Drive:** E:
- **Free Space:** 31.36 GB
- **Used Space:** 14.72 GB

## Software Environment

### Node.js Ecosystem
- **Node.js:** v24.14.1
- **npm:** 11.11.0
- **pnpm:** 11.0.0

### Python Ecosystem
- **Python:** 3.13.14
- **pip:** 26.1.2

### Development Tools
- **Git:** 2.52.0.windows.1

### Network
- **Internet Access:** Available

## Target Runtime Constraints

### CPU-First Design
- No CUDA support available
- No discrete NVIDIA GPU
- Target: CPU inference only
- ONNX Runtime must use CPUExecutionProvider

### Memory Constraints
- Available RAM: ~16 GB
- Model loading target: < 2 GB
- Quantization mandatory for production use

### Performance Targets
- Cold start: Acceptable delay for model loading
- Warm inference: < 250ms for decision engine
- Total rewrite latency: < 150ms for paragraph

## ONNX Runtime Requirements

- **Platform:** Windows x64
- **Execution Provider:** CPUExecutionProvider (mandatory)
- **CPU Features:** AVX2 likely supported (Intel i5-8250U)
- **No GPU acceleration required**

## Development Strategy

1. Use pnpm for package management
2. TypeScript for application code
3. Python for model tooling (quantization, conversion)
4. ONNX Runtime Node.js bindings for inference
5. All inference must run on CPU
6. Quantization (INT8) mandatory for acceptable performance

## Limitations

- No CUDA/GPU acceleration
- Limited to CPU-based inference
- Model size constrained by available RAM
- Inference latency higher than GPU, but acceptable for interactive use
