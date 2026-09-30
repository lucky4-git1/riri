/**
 * Text Parser
 * 
 * Main parser that orchestrates sentence segmentation, tokenization,
 * and protected span detection
 */

import type { AnalyzedText, Sentence, LinguisticFeatures } from '@riri/types';
import { SentenceSegmenter, createSentenceSegmenter } from './sentence-segmenter.js';
import { Tokenizer, createTokenizer } from './tokenizer.js';
import { ProtectedSpanDetector, createProtectedSpanDetector } from './protected-span-detector.js';
import { NEGATION_WORDS } from './patterns.js';

export interface ParserOptions {
  detectProtectedSpans?: boolean;
  tokenize?: boolean;
  mergeShortSentences?: boolean;
  minSentenceLength?: number;
}

export class Parser {
  private sentenceSegmenter: SentenceSegmenter;
  private tokenizer: Tokenizer;
  private protectedSpanDetector: ProtectedSpanDetector;
  
  constructor() {
    this.sentenceSegmenter = createSentenceSegmenter();
    this.tokenizer = createTokenizer();
    this.protectedSpanDetector = createProtectedSpanDetector();
  }
  
  /**
   * Parse text into analyzed structure
   */
  parse(text: string, options: ParserOptions = {}): AnalyzedText {
    const {
      detectProtectedSpans = true,
      tokenize = true,
      mergeShortSentences = false,
      minSentenceLength = 5,
    } = options;
    
    // Detect protected spans first (before splitting)
    const protectedSpans = detectProtectedSpans
      ? this.protectedSpanDetector.detect(text)
      : [];
    
    // Segment into sentences
    let sentences = this.sentenceSegmenter.segment(text);
    
    // Optionally merge very short sentences
    if (mergeShortSentences) {
      sentences = this.sentenceSegmenter.mergeShortSentences(sentences, minSentenceLength);
    }
    
    // Tokenize each sentence
    if (tokenize) {
      sentences = sentences.map(sentence => ({
        ...sentence,
        tokens: this.tokenizer.tokenize(sentence.text, protectedSpans, sentence.start),
      }));
    }
    
    // Get all tokens
    const allTokens = sentences.flatMap(s => s.tokens);
    
    // Extract basic features
    const features = this.extractBasicFeatures(text, sentences, allTokens, protectedSpans);
    
    return {
      original: text,
      sentences,
      tokens: allTokens,
      protectedSpans,
      features,
      metadata: {
        parsedAt: new Date().toISOString(),
      },
    };
  }
  
  /**
   * Extract basic linguistic features
   */
  private extractBasicFeatures(
    _text: string,
    sentences: Sentence[],
    tokens: any[],
    protectedSpans: any[]
  ): LinguisticFeatures {
    const sentenceCount = sentences.length;
    const wordCount = this.tokenizer.getWordCount(tokens);
    const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Calculate vocabulary diversity
    const vocabularyDiversity = this.tokenizer.getVocabularyDiversity(tokens);
    
    // Count technical terms (approximation)
    const technicalTerms = tokens.filter(t => 
      this.isTechnicalTerm(t.value) || 
      this.isCamelCase(t.value) ||
      this.isSnakeCase(t.value)
    ).length;
    const technicalTermRatio = wordCount > 0 ? technicalTerms / wordCount : 0;
    
    // Calculate repetition score (simple bigram repetition)
    const repetitionScore = this.calculateRepetition(tokens);
    
    // Estimate passive voice ratio
    const passiveVoiceRatio = this.estimatePassiveVoice(sentences);
    
    // Calculate complexity based on multiple factors
    const complexity = this.calculateComplexity(
      averageSentenceLength,
      vocabularyDiversity,
      technicalTermRatio
    );
    
    return {
      language: 'en', // Assume English for now
      sentenceCount,
      averageSentenceLength,
      complexity,
      technicalTermRatio,
      repetitionScore,
      passiveVoiceRatio,
      hasNumbers: protectedSpans.some(s => s.type === 'number' || s.type === 'percentage'),
      hasUrls: protectedSpans.some(s => s.type === 'url'),
      hasCode: protectedSpans.some(s => s.type === 'code'),
      protectedEntityCount: protectedSpans.length,
    };
  }
  
  /**
   * Calculate text complexity (0-1 scale)
   */
  private calculateComplexity(
    avgSentenceLength: number,
    vocabularyDiversity: number,
    technicalTermRatio: number
  ): number {
    // Normalize sentence length (20 words = moderate, 40+ = complex)
    const lengthScore = Math.min(avgSentenceLength / 40, 1.0);
    
    // Vocabulary diversity (higher = more complex)
    const vocabScore = vocabularyDiversity;
    
    // Technical terms increase complexity
    const technicalScore = Math.min(technicalTermRatio * 2, 1.0);
    
    // Weighted combination
    const complexity = 
      0.4 * lengthScore +
      0.3 * vocabScore +
      0.3 * technicalScore;
    
    return Math.min(Math.max(complexity, 0), 1);
  }
  
  /**
   * Calculate repetition score (0-1, higher = more repetitive)
   */
  private calculateRepetition(tokens: any[]): number {
    if (tokens.length < 2) return 0;
    
    const words = tokens
      .filter(t => t.pos !== 'PUNCT')
      .map(t => t.value.toLowerCase());
    
    // Count repeated consecutive words
    let repetitions = 0;
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1]) {
        repetitions++;
      }
    }
    
    // Count repeated bigrams
    const bigrams = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    
    const repeatedBigrams = Array.from(bigrams.values()).filter(count => count > 1).length;
    
    const totalBigrams = words.length - 1;
    if (totalBigrams === 0) return 0;
    
    return Math.min((repetitions + repeatedBigrams) / totalBigrams, 1);
  }
  
  /**
   * Estimate passive voice ratio
   */
  private estimatePassiveVoice(sentences: Sentence[]): number {
    let passiveSentences = 0;
    
    for (const sentence of sentences) {
      const words = sentence.tokens
        .filter(t => t.pos !== 'PUNCT')
        .map(t => t.value.toLowerCase());
      
      // Look for "be + past participle" pattern
      for (let i = 0; i < words.length - 1; i++) {
        const word = words[i];
        const nextWord = words[i + 1];
        
        // Check for be verb
        if (['is', 'are', 'was', 'were', 'been', 'being', 'be'].includes(word)) {
          // Check if next word looks like past participle
          if (nextWord.endsWith('ed') || this.isIrregularPastParticiple(nextWord)) {
            passiveSentences++;
            break;
          }
        }
      }
    }
    
    return sentences.length > 0 ? passiveSentences / sentences.length : 0;
  }
  
  /**
   * Check if word is a technical term
   */
  private isTechnicalTerm(word: string): boolean {
    const normalized = word.toLowerCase();
    
    // Check common technical keywords
    const technicalKeywords = [
      'api', 'sdk', 'http', 'https', 'ssl', 'tls', 'tcp', 'ip',
      'json', 'xml', 'yaml', 'html', 'css', 'sql',
      'database', 'query', 'schema', 'function', 'class', 'interface',
      'async', 'await', 'callback', 'promise', 'algorithm',
    ];
    
    return technicalKeywords.includes(normalized);
  }
  
  /**
   * Check if word is in camelCase
   */
  private isCamelCase(word: string): boolean {
    return /^[a-z]+[A-Z][a-zA-Z]*$/.test(word);
  }
  
  /**
   * Check if word is in snake_case
   */
  private isSnakeCase(word: string): boolean {
    return /^[a-z]+_[a-z_]+$/.test(word);
  }
  
  /**
   * Check for irregular past participles
   */
  private isIrregularPastParticiple(word: string): boolean {
    const irregulars = [
      'done', 'gone', 'been', 'seen', 'given', 'taken', 'made',
      'written', 'spoken', 'broken', 'chosen', 'frozen',
      'driven', 'ridden', 'risen', 'fallen', 'eaten',
    ];
    return irregulars.includes(word);
  }
  
  /**
   * Count negation words in text
   */
  countNegations(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => NEGATION_WORDS.has(word)).length;
  }
  
  /**
   * Validate that protected content is preserved
   */
  validateProtectedContent(
    original: string,
    transformed: string
  ): { valid: boolean; missing: string[] } {
    const originalSpans = this.protectedSpanDetector.detect(original);
    const validation = this.protectedSpanDetector.validatePreservation(
      originalSpans,
      transformed
    );
    
    return {
      valid: validation.valid,
      missing: validation.missing.map(s => s.value),
    };
  }
}

/**
 * Create a new parser instance
 */
export function createParser(): Parser {
  return new Parser();
}
