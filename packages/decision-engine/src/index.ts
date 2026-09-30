/**
 * @riri/decision-engine
 * 
 * Transformation planning engine for Riri.
 * Provides HeuristicDecisionEngine (fast, offline) and LayaDecisionEngine (ML-powered with heuristic fallback).
 */

export { HeuristicDecisionEngine, createHeuristicDecisionEngine } from './heuristic-engine.js';
export { LayaDecisionEngine, createLayaDecisionEngine } from './laya-engine.js';
export type { LayaAdapterLike, LayaEngineOptions } from './laya-engine.js';
export { MODE_PROFILES, getModeProfile } from './mode-profiles.js';
export type { ModeProfile } from './mode-profiles.js';
