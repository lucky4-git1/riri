/**
 * Regular expression patterns for detecting protected content
 */

import type { ProtectedContentType } from '@riri/types';

export interface PatternDefinition {
  type: ProtectedContentType;
  pattern: RegExp;
  priority: number; // Higher priority patterns checked first
}

/**
 * Protected content patterns
 * Ordered by priority (higher first)
 */
export const PROTECTED_PATTERNS: PatternDefinition[] = [
  // URLs (highest priority - must match before other patterns)
  {
    type: 'url',
    pattern: /https?:\/\/[^\s]+/gi,
    priority: 100,
  },
  
  // Email addresses
  {
    type: 'email',
    pattern: /\b[\w.+-]+@[\w.-]+\.\w+\b/gi,
    priority: 95,
  },
  
  // Code blocks (backticks)
  {
    type: 'code',
    pattern: /`[^`]+`/g,
    priority: 90,
  },
  
  // Negation keywords (must be protected from modification)
  {
    type: 'negation',
    pattern: /\b(?:not|no|never|none|nothing|nowhere|neither|cannot|can't|cant|won't|wont|wouldn't|wouldnt|shouldn't|shouldnt|couldn't|couldnt|don't|dont|doesn't|doesnt|didn't|didnt|isn't|isnt|aren't|arent|wasn't|wasnt|weren't|werent|hasn't|hasnt|haven't|havent|hadn't|hadnt|mustn't|mustnt|needn't|neednt|without|hardly|scarcely|barely|no\s+one|nobody)\b/gi,
    priority: 88,
  },

  // File paths (Windows and Unix, explicit path markers or file extensions)
  {
    type: 'filepath',
    pattern: /(?:[A-Za-z]:[\\/]|(?<=[\s"'\(\[\{<]|^)(?:\/|\.\.?[\\/]))(?:[\w.-]+[\\/])*[\w.-]+\b|[\w.-]+[\\/](?:[\w.-]+[\\/])*[\w.-]+\.(?:ts|js|json|py|md|txt|html|css|yaml|yml|sh|bat|docx|pdf|png|jpg|svg|onnx)\b/g,
    priority: 85,
  },
  
  // Currency with symbols
  {
    type: 'currency',
    pattern: /[$€£¥]\s?\d+(?:[.,]\d+)?(?:[KMB])?/gi,
    priority: 80,
  },
  
  // Percentages
  {
    type: 'percentage',
    pattern: /\d+(?:\.\d+)?%/g,
    priority: 75,
  },
  
  // Numbers with units (100M, 3.14K, etc.)
  {
    type: 'number',
    pattern: /\b\d+(?:\.\d+)?(?:[KMB]|MB|GB|TB|ms|MHz|GHz)?\b/g,
    priority: 70,
  },
  
  // Time expressions (9am, 5pm, 3:00pm, etc.)
  {
    type: 'date',
    pattern: /\b\d{1,2}(?::\d{2})?\s?(?:am|pm|AM|PM)\b/g,
    priority: 66,
  },

  // Dates (various formats)
  {
    type: 'date',
    pattern: /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    priority: 65,
  },
  
  // Version numbers
  {
    type: 'version',
    pattern: /\bv?\d+\.\d+(?:\.\d+)?(?:-[a-z0-9]+)?/gi,
    priority: 60,
  },
  
  // Package names (scoped npm-style)
  {
    type: 'package',
    pattern: /@[\w-]+\/[\w-]+/g,
    priority: 55,
  },
  
  // Technical identifiers (OAuth2, camelCase, PascalCase, snake_case, SCREAMING_SNAKE)
  {
    type: 'technical_identifier',
    pattern: /\b[a-zA-Z]+[0-9]+[a-zA-Z0-9]*\b|\b[a-z]+[A-Z][a-zA-Z0-9]*\b|\b[A-Z][a-z]+[A-Z][a-zA-Z0-9]*\b|\b[a-z]+_[a-z0-9_]+\b|\b[A-Z][A-Z0-9_]+[A-Z0-9]\b/g,
    priority: 50,
  },
  
  // Quoted content (double quotes)
  {
    type: 'quoted',
    pattern: /"[^"]+"/g,
    priority: 45,
  },
  
  // Quoted content (single quotes)
  {
    type: 'quoted',
    pattern: /'[^']+'/g,
    priority: 45,
  },
];

/**
 * Sentence boundary patterns
 */
export const SENTENCE_BOUNDARIES = {
  // Common abbreviations that don't end sentences
  abbreviations: new Set([
    'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr',
    'etc', 'inc', 'ltd', 'corp', 'co',
    'vs', 'viz', 'ie', 'eg', 'al',
    'st', 'ave', 'blvd', 'dept',
    'vol', 'no', 'nos', 'fig', 'figs',
    'approx', 'est',
  ]),
  
  // Sentence ending punctuation
  endings: /[.!?]+/g,
  
  // Whitespace after punctuation
  boundary: /[.!?]+\s+/g,
};

/**
 * Tokenization patterns
 */
export const TOKEN_PATTERNS = {
  // Word boundaries (split on whitespace and punctuation, but keep punctuation)
  word: /\s+|([.,!?;:()[\]{}'"]+)/g,
  
  // Whitespace
  whitespace: /\s+/g,
  
  // Punctuation
  punctuation: /[.,!?;:()[\]{}'"]+/g,
};

/**
 * Negation words that must be preserved
 */
export const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'none', 'nothing', 'nowhere', 'neither',
  'cannot', "can't", 'cant', "won't", 'wont', "wouldn't", 'wouldnt',
  "shouldn't", 'shouldnt', "couldn't", 'couldnt',
  "don't", 'dont', "doesn't", 'doesnt', "didn't", 'didnt',
  "isn't", 'isnt', "aren't", 'arent', "wasn't", 'wasnt', "weren't", 'werent',
  "hasn't", 'hasnt', "haven't", 'havent', "hadn't", 'hadnt',
  "mustn't", 'mustnt', "needn't", 'neednt',
  'without', 'hardly', 'scarcely', 'barely',
  'no one', 'nobody',
]);

/**
 * Passive voice indicators
 */
export const PASSIVE_VOICE_INDICATORS = {
  beVerbs: new Set([
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'am',
  ]),
  
  // Simple past participle pattern (very basic)
  pastParticiple: /\b\w+ed\b/g,
};

/**
 * Technical terms that should be preserved
 */
export const TECHNICAL_INDICATORS = {
  // Programming keywords
  keywords: new Set([
    'function', 'class', 'interface', 'type', 'const', 'let', 'var',
    'async', 'await', 'promise', 'callback', 'api', 'sdk',
    'database', 'query', 'schema', 'table', 'index',
    'http', 'https', 'ssl', 'tls', 'tcp', 'udp', 'ip',
    'json', 'xml', 'yaml', 'csv', 'html', 'css',
    'git', 'branch', 'commit', 'merge', 'pull', 'push',
  ]),
  
  // File extensions
  extensions: /\.\w{2,4}$/,
};
