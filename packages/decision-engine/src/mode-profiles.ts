/**
 * Mode Profiles for Decision Engine
 * 
 * Defines linguistic policy parameters for each writing mode.
 */

import type { WritingMode } from '@riri/types';

export interface ModeProfile {
  mode: WritingMode;
  description: string;
  defaultAggressiveness: number;
  synonymStrength: number;
  preferredTransformations: Array<{
    id: string;
    priorityMultiplier: number;
    strengthMultiplier: number;
  }>;
  preserve: string[];
  skipTransformations: string[];
}

export const MODE_PROFILES: Record<WritingMode, ModeProfile> = {
  standard: {
    mode: 'standard',
    description: 'Balanced transformation preserving tone while improving phrasing',
    defaultAggressiveness: 0.3,
    synonymStrength: 0.3,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.25, strengthMultiplier: 1.0 },
      { id: 'structural-rewrite', priorityMultiplier: 1.15, strengthMultiplier: 1.0 },
      { id: 'contextual-lexical', priorityMultiplier: 1.0, strengthMultiplier: 0.8 },
      { id: 'conservative-synonym', priorityMultiplier: 1.0, strengthMultiplier: 1.0 },
      { id: 'phrase-substitution', priorityMultiplier: 0.9, strengthMultiplier: 0.9 },
      { id: 'redundancy-removal', priorityMultiplier: 0.7, strengthMultiplier: 0.7 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation', 'code'],
    skipTransformations: [],
  },

  fluency: {
    mode: 'fluency',
    description: 'Smooth natural phrasing and grammatical flow',
    defaultAggressiveness: 0.35,
    synonymStrength: 0.3,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.3, strengthMultiplier: 1.0 },
      { id: 'structural-rewrite', priorityMultiplier: 1.25, strengthMultiplier: 1.0 },
      { id: 'contextual-lexical', priorityMultiplier: 1.1, strengthMultiplier: 0.9 },
      { id: 'phrase-substitution', priorityMultiplier: 1.1, strengthMultiplier: 1.0 },
      { id: 'sentence-restructure', priorityMultiplier: 1.0, strengthMultiplier: 0.9 },
      { id: 'conservative-synonym', priorityMultiplier: 0.8, strengthMultiplier: 0.8 },
      { id: 'redundancy-removal', priorityMultiplier: 0.8, strengthMultiplier: 0.8 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation'],
    skipTransformations: [],
  },

  academic: {
    mode: 'academic',
    description: 'Scholarly, precise, rigorous language with high terminology preservation',
    defaultAggressiveness: 0.25,
    synonymStrength: 0.25,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.2, strengthMultiplier: 0.9 },
      { id: 'structural-rewrite', priorityMultiplier: 1.0, strengthMultiplier: 0.7 },
      { id: 'contextual-lexical', priorityMultiplier: 0.9, strengthMultiplier: 0.7 },
      { id: 'formalization', priorityMultiplier: 1.2, strengthMultiplier: 1.0 },
      { id: 'phrase-substitution', priorityMultiplier: 1.0, strengthMultiplier: 0.9 },
      { id: 'conservative-synonym', priorityMultiplier: 0.8, strengthMultiplier: 0.7 },
      { id: 'sentence-restructure', priorityMultiplier: 0.7, strengthMultiplier: 0.6 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation', 'citations', 'code'],
    skipTransformations: ['simplification'],
  },

  professional: {
    mode: 'professional',
    description: 'Direct, clear, executive communication for business contexts',
    defaultAggressiveness: 0.35,
    synonymStrength: 0.3,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.3, strengthMultiplier: 1.0 },
      { id: 'structural-rewrite', priorityMultiplier: 1.2, strengthMultiplier: 0.95 },
      { id: 'contextual-lexical', priorityMultiplier: 1.0, strengthMultiplier: 0.8 },
      { id: 'concision', priorityMultiplier: 1.2, strengthMultiplier: 1.0 },
      { id: 'phrase-substitution', priorityMultiplier: 1.1, strengthMultiplier: 1.0 },
      { id: 'formalization', priorityMultiplier: 0.9, strengthMultiplier: 0.8 },
      { id: 'conservative-synonym', priorityMultiplier: 0.7, strengthMultiplier: 0.7 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation', 'code'],
    skipTransformations: [],
  },

  formal: {
    mode: 'formal',
    description: 'Elevated register avoiding colloquialisms and conversational tone',
    defaultAggressiveness: 0.3,
    synonymStrength: 0.35,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.15, strengthMultiplier: 0.85 },
      { id: 'structural-rewrite', priorityMultiplier: 1.0, strengthMultiplier: 0.75 },
      { id: 'contextual-lexical', priorityMultiplier: 1.0, strengthMultiplier: 0.8 },
      { id: 'formalization', priorityMultiplier: 1.3, strengthMultiplier: 1.1 },
      { id: 'phrase-substitution', priorityMultiplier: 1.0, strengthMultiplier: 1.0 },
      { id: 'conservative-synonym', priorityMultiplier: 0.9, strengthMultiplier: 0.9 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation'],
    skipTransformations: ['simplification'],
  },

  simple: {
    mode: 'simple',
    description: 'Accessible vocabulary and shorter sentence structures',
    defaultAggressiveness: 0.4,
    synonymStrength: 0.4,
    preferredTransformations: [
      { id: 'active-voice', priorityMultiplier: 1.3, strengthMultiplier: 1.1 },
      { id: 'structural-rewrite', priorityMultiplier: 1.1, strengthMultiplier: 0.9 },
      { id: 'simplification', priorityMultiplier: 1.3, strengthMultiplier: 1.1 },
      { id: 'sentence-split', priorityMultiplier: 1.1, strengthMultiplier: 1.0 },
      { id: 'concision', priorityMultiplier: 1.0, strengthMultiplier: 0.9 },
      { id: 'conservative-synonym', priorityMultiplier: 0.8, strengthMultiplier: 0.8 },
    ],

    preserve: ['entities', 'numbers', 'technical_terms', 'negation'],
    skipTransformations: ['formalization'],
  },

  concise: {
    mode: 'concise',
    description: 'Eliminates filler, verbose idioms, and unnecessary words',
    defaultAggressiveness: 0.45,
    synonymStrength: 0.2,
    preferredTransformations: [
      { id: 'structural-rewrite', priorityMultiplier: 1.45, strengthMultiplier: 1.15 },
      { id: 'contextual-lexical', priorityMultiplier: 1.0, strengthMultiplier: 0.7 },
      { id: 'concision', priorityMultiplier: 1.4, strengthMultiplier: 1.2 },
      { id: 'phrase-substitution', priorityMultiplier: 1.3, strengthMultiplier: 1.1 },
      { id: 'redundancy-removal', priorityMultiplier: 1.2, strengthMultiplier: 1.0 },
      { id: 'sentence-split', priorityMultiplier: 0.7, strengthMultiplier: 0.7 },
    ],
    preserve: ['entities', 'numbers', 'technical_terms', 'negation'],
    skipTransformations: [],
  },

  creative: {
    mode: 'creative',
    description: 'Expressive, varied vocabulary with sentence restructuring for stylistic effect',
    defaultAggressiveness: 0.5,
    synonymStrength: 0.6,
    preferredTransformations: [
      { id: 'structural-rewrite', priorityMultiplier: 1.25, strengthMultiplier: 1.0 },
      { id: 'contextual-lexical', priorityMultiplier: 1.1, strengthMultiplier: 1.0 },
      { id: 'conservative-synonym', priorityMultiplier: 1.4, strengthMultiplier: 1.3 },
      { id: 'sentence-restructure', priorityMultiplier: 1.2, strengthMultiplier: 1.0 },
      { id: 'phrase-substitution', priorityMultiplier: 1.0, strengthMultiplier: 0.9 },
      { id: 'sentence-split', priorityMultiplier: 0.8, strengthMultiplier: 0.8 },
    ],
    preserve: ['entities', 'numbers', 'urls', 'negation'],
    skipTransformations: ['formalization', 'simplification'],
  },
};

export function getModeProfile(mode: WritingMode): ModeProfile {
  return MODE_PROFILES[mode] || MODE_PROFILES.standard;
}

