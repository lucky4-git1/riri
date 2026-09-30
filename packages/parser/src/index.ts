/**
 * Parser Package
 * 
 * Text parsing, tokenization, and protected span detection for Riri
 */

export { Parser, createParser } from './parser.js';
export type { ParserOptions } from './parser.js';

export { SentenceSegmenter, createSentenceSegmenter } from './sentence-segmenter.js';
export { Tokenizer, createTokenizer } from './tokenizer.js';
export { ProtectedSpanDetector, createProtectedSpanDetector } from './protected-span-detector.js';

export {
  PROTECTED_PATTERNS,
  SENTENCE_BOUNDARIES,
  TOKEN_PATTERNS,
  NEGATION_WORDS,
  PASSIVE_VOICE_INDICATORS,
  TECHNICAL_INDICATORS,
} from './patterns.js';

export type { PatternDefinition } from './patterns.js';
