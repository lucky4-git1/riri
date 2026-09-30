/**
 * Transformations Package
 * 
 * Modular, pluggable text transformations for Riri.
 */

// Base class
export { BaseTransformation } from './base-transformation.js';

// Transformations
export {
  ConservativeSynonymTransformation,
  createConservativeSynonymTransformation,
} from './conservative-synonym.js';

export {
  PhraseSubstitutionTransformation,
  createPhraseSubstitutionTransformation,
} from './phrase-substitution.js';

export {
  SimplificationTransformation,
  createSimplificationTransformation,
} from './simplification.js';

export {
  ConcisionTransformation,
  createConcisionTransformation,
} from './concision.js';

export {
  FormalizationTransformation,
  createFormalizationTransformation,
} from './formalization.js';

export {
  RedundancyRemovalTransformation,
  createRedundancyRemovalTransformation,
} from './redundancy-removal.js';

export {
  SentenceSplitTransformation,
  createSentenceSplitTransformation,
} from './sentence-split.js';

export {
  SentenceRestructureTransformation,
  createSentenceRestructureTransformation,
} from './sentence-restructure.js';

export {
  StructuralRewriteTransformation,
  createStructuralRewriteTransformation,
} from './structural-rewrite.js';

export {
  ContextualLexicalTransformation,
  createContextualLexicalTransformation,
} from './contextual-lexical.js';

// Data
export {
  SYNONYM_DATABASE,
  buildSynonymMap,
  getSynonyms,
  hasSynonyms,
  getSynonymEntry,
} from './synonyms.js';

export type { SynonymEntry } from './synonyms.js';

export {
  PHRASE_SUBSTITUTIONS,
  applyPhraseSubstitutions,
  findVerbosePhrases,
} from './phrases.js';

export type { PhraseSubstitution } from './phrases.js';

import type { Transformation } from '@riri/types';
import { createConservativeSynonymTransformation } from './conservative-synonym.js';
import { createPhraseSubstitutionTransformation } from './phrase-substitution.js';
import { createSimplificationTransformation } from './simplification.js';
import { createConcisionTransformation } from './concision.js';
import { createFormalizationTransformation } from './formalization.js';
import { createRedundancyRemovalTransformation } from './redundancy-removal.js';
import { createSentenceSplitTransformation } from './sentence-split.js';
import { createSentenceRestructureTransformation } from './sentence-restructure.js';
import { createStructuralRewriteTransformation } from './structural-rewrite.js';
import { createContextualLexicalTransformation } from './contextual-lexical.js';
import { createActiveVoiceTransformation } from './active-voice.js';

export {
  ActiveVoiceTransformation,
  createActiveVoiceTransformation,
} from './active-voice.js';

/**
 * Get all available transformation plugin instances
 */
export function getAllTransformations(): Transformation[] {
  return [
    createActiveVoiceTransformation(),
    createStructuralRewriteTransformation(),
    createContextualLexicalTransformation(),
    createConservativeSynonymTransformation(),
    createPhraseSubstitutionTransformation(),
    createSimplificationTransformation(),
    createConcisionTransformation(),
    createFormalizationTransformation(),
    createRedundancyRemovalTransformation(),
    createSentenceSplitTransformation(),
    createSentenceRestructureTransformation(),
  ];
}

