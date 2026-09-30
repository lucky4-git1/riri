/**
 * Text Analyzer
 * 
 * Analyzes parsed text and extracts detailed linguistic features
 */

import type { AnalyzedText, LinguisticFeatures, Token } from '@riri/types';
import { Parser, createParser, NEGATION_WORDS } from '@riri/parser';

export interface AnalyzerOptions {
  calculateReadability?: boolean;
  calculateFormality?: boolean;
  detectPassiveVoice?: boolean;
}

export class Analyzer {
  private parser: Parser;
  
  constructor() {
    this.parser = createParser();
  }
  
  /**
   * Analyze text and extract linguistic features
   */
  analyze(text: string, options: AnalyzerOptions = {}): AnalyzedText {
    const {
      calculateReadability = true,
      calculateFormality = true,
      detectPassiveVoice = true,
    } = options;
    
    // Parse text first
    const parsed = this.parser.parse(text);
    
    // Enhance features with additional analysis
    const enhancedFeatures = this.enhanceFeatures(parsed, {
      calculateReadability,
      calculateFormality,
      detectPassiveVoice,
    });
    
    return {
      ...parsed,
      features: enhancedFeatures,
    };
  }
  
  /**
   * Enhance basic features with additional analysis
   */
  private enhanceFeatures(
    parsed: AnalyzedText,
    options: {
      calculateReadability: boolean;
      calculateFormality: boolean;
      detectPassiveVoice: boolean;
    }
  ): LinguisticFeatures {
    const { features } = parsed;
    
    return {
      ...features,
      readabilityScore: options.calculateReadability
        ? this.calculateReadability(parsed)
        : undefined,
      formalityScore: options.calculateFormality
        ? this.calculateFormality(parsed)
        : undefined,
      passiveVoiceRatio: options.detectPassiveVoice
        ? this.detectPassiveVoiceRatio(parsed)
        : features.passiveVoiceRatio,
    };
  }
  
  /**
   * Calculate readability score (simplified Flesch Reading Ease)
   * Score: 0-100, higher = easier to read
   */
  calculateReadability(analyzed: AnalyzedText): number {
    const { sentences, tokens } = analyzed;
    
    if (sentences.length === 0) return 100;
    
    // Count syllables (approximation)
    const totalSyllables = this.countTotalSyllables(tokens);
    const totalWords = tokens.filter(t => t.pos !== 'PUNCT').length;
    const totalSentences = sentences.length;
    
    if (totalWords === 0 || totalSentences === 0) return 100;
    
    // Simplified Flesch Reading Ease formula
    // FRE = 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const avgWordsPerSentence = totalWords / totalSentences;
    const avgSyllablesPerWord = totalSyllables / totalWords;
    
    const score = 206.835 
      - (1.015 * avgWordsPerSentence)
      - (84.6 * avgSyllablesPerWord);
    
    // Normalize to 0-100
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Count total syllables (approximation)
   */
  private countTotalSyllables(tokens: Token[]): number {
    let total = 0;
    
    for (const token of tokens) {
      if (token.pos === 'PUNCT' || token.pos === 'NUM') continue;
      total += this.countSyllables(token.value);
    }
    
    return total;
  }
  
  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length === 0) return 0;
    
    // Count vowel groups
    const vowels = word.match(/[aeiouy]+/g);
    if (!vowels) return 1;
    
    let count = vowels.length;
    
    // Subtract silent 'e' at end
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    // Minimum 1 syllable
    return Math.max(1, count);
  }
  
  /**
   * Calculate formality score (0-1, higher = more formal)
   */
  calculateFormality(analyzed: AnalyzedText): number {
    const { tokens, features } = analyzed;
    const words = tokens.filter(t => t.pos !== 'PUNCT');
    
    if (words.length === 0) return 0.5;
    
    let formalityScore = 0.5; // Start at neutral
    
    // Longer sentences → more formal
    if (features.averageSentenceLength > 20) {
      formalityScore += 0.1;
    } else if (features.averageSentenceLength < 10) {
      formalityScore -= 0.1;
    }
    
    // Technical terms → more formal
    formalityScore += features.technicalTermRatio * 0.2;
    
    // Contractions → less formal
    const contractions = words.filter(t => 
      this.isContraction(t.value)
    ).length;
    formalityScore -= (contractions / words.length) * 0.3;
    
    // First person pronouns → less formal
    const firstPersonPronouns = words.filter(t =>
      ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'].includes(t.value.toLowerCase())
    ).length;
    formalityScore -= (firstPersonPronouns / words.length) * 0.2;
    
    // Passive voice → more formal
    formalityScore += features.passiveVoiceRatio * 0.2;
    
    // Normalize to 0-1
    return Math.max(0, Math.min(1, formalityScore));
  }
  
  private static readonly IRREGULAR_PAST_PARTICIPLES = new Set([
    'done', 'gone', 'been', 'seen', 'given', 'taken', 'made',
    'written', 'spoken', 'broken', 'chosen', 'frozen',
    'driven', 'ridden', 'risen', 'fallen', 'eaten', 'known',
  ]);

  /**
   * Check if word is a contraction (excluding possessives)
   */
  private isContraction(word: string): boolean {
    if (!word.includes("'") && !word.includes("\u2019")) return false;
    const lower = word.toLowerCase();
    if (/(?:n't|n\u2019t|'re|\u2019re|'ve|\u2019ve|'ll|\u2019ll|'d|\u2019d|'m|\u2019m)$/i.test(lower)) {
      return true;
    }
    if (/(?:'s|\u2019s)$/i.test(lower)) {
      const base = lower.replace(/(?:'s|\u2019s)$/i, '');
      const contractionBases = new Set(['it', 'that', 'what', 'who', 'where', 'when', 'how', 'there', 'here', 'he', 'she']);
      return contractionBases.has(base);
    }
    return false;
  }
  
  /**
   * Detect passive voice ratio
   */
  detectPassiveVoiceRatio(analyzed: AnalyzedText): number {
    const { sentences } = analyzed;
    let passiveCount = 0;
    
    for (const sentence of sentences) {
      if (this.isPassiveSentence(sentence.text)) {
        passiveCount++;
      }
    }
    
    return sentences.length > 0 ? passiveCount / sentences.length : 0;
  }
  
  /**
   * Check if a sentence is in passive voice
   */
  private isPassiveSentence(sentence: string): boolean {
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Look for "be verb + past participle" pattern
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i];
      const nextWord = words[i + 1];
      
      // Check for be verb
      if (['am', 'is', 'are', 'was', 'were', 'been', 'being', 'be'].includes(word)) {
        // Check if followed by past participle
        if (nextWord.endsWith('ed') || this.isIrregularPastParticiple(nextWord)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check for irregular past participles
   */
  private isIrregularPastParticiple(word: string): boolean {
    return Analyzer.IRREGULAR_PAST_PARTICIPLES.has(word);
  }
  
  /**
   * Calculate text complexity (enhanced version)
   */
  calculateComplexity(analyzed: AnalyzedText): number {
    const { features, tokens } = analyzed;
    
    // Multiple factors contribute to complexity
    const factors = [];
    
    // Sentence length
    const lengthScore = Math.min(features.averageSentenceLength / 30, 1.0);
    factors.push({ score: lengthScore, weight: 0.3 });
    
    // Vocabulary diversity
    const vocabScore = this.calculateVocabularyDiversity(tokens);
    factors.push({ score: vocabScore, weight: 0.2 });
    
    // Technical terms
    factors.push({ score: features.technicalTermRatio, weight: 0.2 });
    
    // Subordinate clauses
    const subordinateScore = this.detectSubordinateClauses(analyzed);
    factors.push({ score: subordinateScore, weight: 0.15 });
    
    // Passive voice
    factors.push({ score: features.passiveVoiceRatio, weight: 0.15 });
    
    // Weighted average
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const complexity = factors.reduce((sum, f) => sum + (f.score * f.weight), 0) / totalWeight;
    
    return Math.max(0, Math.min(1, complexity));
  }
  
  /**
   * Calculate vocabulary diversity
   */
  private calculateVocabularyDiversity(tokens: Token[]): number {
    const words = tokens
      .filter(t => t.pos !== 'PUNCT')
      .map(t => t.value.toLowerCase());
    
    if (words.length === 0) return 0;
    
    const uniqueWords = new Set(words).size;
    return uniqueWords / words.length;
  }
  
  /**
   * Detect subordinate clauses (approximation, bounded 0-1)
   */
  private detectSubordinateClauses(analyzed: AnalyzedText): number {
    const { sentences } = analyzed;
    
    const subordinatingConjunctions = [
      'because', 'since', 'although', 'though', 'while', 'if',
      'unless', 'until', 'when', 'where', 'after', 'before',
    ];
    
    let clauseCount = 0;
    
    for (const sentence of sentences) {
      const words = sentence.text.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (subordinatingConjunctions.includes(word)) {
          clauseCount++;
        }
      }
    }
    
    return Math.min(1.0, sentences.length > 0 ? clauseCount / sentences.length : 0);
  }
  
  /**
   * Count negations in text
   */
  countNegations(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => NEGATION_WORDS.has(word)).length;
  }
  
  /**
   * Extract keywords (simple frequency-based)
   */
  extractKeywords(analyzed: AnalyzedText, topN: number = 10): string[] {
    const { tokens } = analyzed;
    
    // Filter out punctuation and common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'this', 'that', 'these', 'those', 'it', 'its',
    ]);
    
    const words = tokens
      .filter(t => t.pos !== 'PUNCT' && t.value.length > 2)
      .map(t => t.value.toLowerCase())
      .filter(w => !stopWords.has(w));
    
    // Count frequencies
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
    
    // Sort by frequency
    const sorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    
    return sorted.map(([word]) => word);
  }
}

/**
 * Create a new analyzer instance
 */
export function createAnalyzer(): Analyzer {
  return new Analyzer();
}
