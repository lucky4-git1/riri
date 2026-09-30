/**
 * Core Configuration & Defaults
 */

import type { RiriConfig, RewriteOptions } from '@riri/types';

export const DEFAULT_CONFIG: Required<RiriConfig> = {
  decisionEngine: 'heuristic',
  modelPath: '',
  timeout: 5000,
  maxInputSize: 500000, // 500 KB limit
  maxTransformations: 6,
  maxCandidates: 5,
  debug: false,
  logging: {
    level: 'info',
    logUserText: false, // Privacy default: never log user text
    logDecisions: false,
    logTransformations: false,
  },
};

export const DEFAULT_REWRITE_OPTIONS: Required<Omit<RewriteOptions, 'timeout'>> & { timeout: number } = {
  mode: 'standard',
  aggressiveness: 0.3,
  maxTransformations: 6,
  maxCandidates: 5,
  maxRetries: 2,
  timeout: 5000,
  preserveFormatting: true,
  decisionEngine: 'heuristic',
  generator: 'auto',
  quality: 'balanced',
  intensity: 2,
  seed: 0,
};

export function resolveConfig(userConfig?: RiriConfig): Required<RiriConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    logging: {
      ...DEFAULT_CONFIG.logging,
      ...userConfig?.logging,
    },
  };
}

export function resolveRewriteOptions(
  options?: RewriteOptions,
  config?: RiriConfig
): typeof DEFAULT_REWRITE_OPTIONS {
  return {
    ...DEFAULT_REWRITE_OPTIONS,
    decisionEngine: config?.decisionEngine || DEFAULT_REWRITE_OPTIONS.decisionEngine,
    timeout: config?.timeout || DEFAULT_REWRITE_OPTIONS.timeout,
    ...options,
  };
}
