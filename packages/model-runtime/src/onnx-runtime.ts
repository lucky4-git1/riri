/**
 * ONNX Runtime implementation for Riri
 * 
 * Provides a clean abstraction over onnxruntime-node for loading and
 * running ONNX models with CPU execution provider.
 */

import * as ort from 'onnxruntime-node';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type {
  ModelRuntime,
  ModelConfig,
  ModelMetadata,
  HealthStatus,
  ModelError,
} from '@riri/types';

export interface ONNXRuntimeOptions {
  intraOpNumThreads?: number;
  interOpNumThreads?: number;
  graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
  enableCpuMemArena?: boolean;
  enableMemPattern?: boolean;
  executionMode?: 'sequential' | 'parallel';
}

export class ONNXRuntime implements ModelRuntime {
  private session: ort.InferenceSession | null = null;
  private config: ModelConfig | null = null;
  private _metadata: ModelMetadata | null = null;
  private lastError: string | null = null;
  private loadTime: number = 0;

  /**
   * Load ONNX model from file
   */
  async load(config: ModelConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate model file exists
      if (!existsSync(config.modelPath)) {
        throw this.createError(
          `Model file not found: ${config.modelPath}`,
          'MODEL_NOT_FOUND'
        );
      }

      // Check file size
      const stats = await stat(config.modelPath);
      console.log(`Loading model: ${config.modelPath} (${this.formatBytes(stats.size)})`);

      // Configure session options
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        ...this.getDefaultSessionOptions(),
        ...(config.sessionOptions as any),
      };

      // Set execution providers
      const providers = this.getExecutionProviders(config.executionProvider);
      
      console.log(`Execution providers: ${providers.join(', ')}`);

      // Load model
      this.session = await ort.InferenceSession.create(
        config.modelPath,
        {
          ...sessionOptions,
          executionProviders: providers,
        }
      );

      this.config = config;
      this.loadTime = Date.now() - startTime;
      this.lastError = null;

      console.log(`Model loaded in ${this.loadTime}ms`);

      // Extract metadata
      await this.extractMetadata();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw this.createError(
        `Failed to load model: ${this.lastError}`,
        'MODEL_LOAD_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Unload model and free resources
   */
  async unload(): Promise<void> {
    if (this.session) {
      // onnxruntime-node doesn't have explicit unload, but releasing reference helps GC
      this.session = null;
    }
    this.config = null;
    this._metadata = null;
    this.lastError = null;
  }

  /**
   * Run inference
   */
  async predict(input: unknown): Promise<unknown> {
    if (!this.session) {
      throw this.createError('Model not loaded', 'MODEL_NOT_LOADED');
    }

    try {
      // Input should be a Record<string, ort.Tensor>
      const feeds = input as Record<string, ort.Tensor>;
      
      // Run inference
      const results = await this.session.run(feeds);
      
      return results;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      throw this.createError(
        `Inference failed: ${this.lastError}`,
        'INFERENCE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get health status
   */
  async health(): Promise<HealthStatus> {
    return {
      loaded: this.session !== null,
      healthy: this.session !== null && this.lastError === null,
      lastError: this.lastError || undefined,
      memoryUsageMB: this.getMemoryUsage(),
    };
  }

  /**
   * Get model metadata
   */
  metadata(): ModelMetadata {
    if (!this._metadata) {
      throw this.createError('Model not loaded', 'MODEL_NOT_LOADED');
    }
    return this._metadata;
  }

  /**
   * Get input metadata
   */
  getInputs(): ReadonlyArray<ort.InferenceSession.ValueMetadata> {
    if (!this.session) {
      throw this.createError('Model not loaded', 'MODEL_NOT_LOADED');
    }
    return this.session.inputNames.map(name => {
      const meta = (this.session as any).inputNames.indexOf(name);
      return {
        name,
        dims: [],
        type: 'tensor',
      };
    });
  }

  /**
   * Get output metadata
   */
  getOutputs(): ReadonlyArray<ort.InferenceSession.ValueMetadata> {
    if (!this.session) {
      throw this.createError('Model not loaded', 'MODEL_NOT_LOADED');
    }
    return this.session.outputNames.map(name => ({
      name,
      dims: [],
      type: 'tensor' as const,
    }));
  }

  /**
   * Warmup model with dummy input
   */
  async warmup(dummyInput: Record<string, ort.Tensor>): Promise<number> {
    const startTime = Date.now();
    await this.predict(dummyInput);
    return Date.now() - startTime;
  }

  // Private helpers

  private getDefaultSessionOptions(): ort.InferenceSession.SessionOptions {
    return {
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: 'sequential',
      intraOpNumThreads: 4, // Good default for quad-core
    };
  }

  private getExecutionProviders(provider: string): string[] {
    switch (provider) {
      case 'cpu':
        return ['cpu'];
      case 'cuda':
        return ['cuda', 'cpu']; // Fallback to CPU if CUDA unavailable
      case 'webgl':
        return ['webgl', 'cpu'];
      case 'wasm':
        return ['wasm', 'cpu'];
      default:
        console.warn(`Unknown provider: ${provider}, using CPU`);
        return ['cpu'];
    }
  }

  private async extractMetadata(): Promise<void> {
    if (!this.session || !this.config) {
      return;
    }

    // Extract what we can from session and config
    this._metadata = {
      name: this.config.modelPath.split('/').pop() || 'unknown',
      version: 'unknown',
      architecture: 'onnx',
      parameters: 0, // Would need to calculate from model
      format: 'onnx',
      precision: this.config.quantized
        ? this.config.quantization || 'quantized'
        : 'fp32',
      quantized: this.config.quantized,
    };
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      return Math.round(mem.heapUsed / 1024 / 1024);
    }
    return 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  private createError(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ): Error {
    // Create ModelError-like object
    const error = new Error(message) as any;
    error.code = code;
    error.details = details;
    error.name = 'ModelError';
    return error;
  }
}

/**
 * Create a new ONNX Runtime instance
 */
export function createONNXRuntime(): ONNXRuntime {
  return new ONNXRuntime();
}
