/**
 * Unified Local Proofreading & Grammar Engine
 * 
 * Inspects text for grammar errors, article misuses, duplicated tokens,
 * punctuation flaws, and capitalization anomalies.
 */

export interface GrammarIssue {
  type: 'grammar' | 'style' | 'spelling' | 'punctuation';
  message: string;
  explanation: string;
  suggestion: string;
  confidence: number;
  offset: number;
  length: number;
}

export interface ProofreadResult {
  text: string;
  issues: GrammarIssue[];
  errorCount: number;
  suggestionCount: number;
}

export class GrammarEngine {
  /**
   * Analyze text and return detected grammar, style, and punctuation issues
   */
  check(text: string): ProofreadResult {
    const issues: GrammarIssue[] = [];

    // 1. Article errors (a vs an)
    this.checkArticles(text, issues);

    // 2. Duplicated words ("the the", "is is")
    this.checkDuplicatedWords(text, issues);

    // 3. Spacing before punctuation ("word , next")
    this.checkPunctuationSpacing(text, issues);

    // 4. Repeated punctuation (",,", "..")
    this.checkRepeatedPunctuation(text, issues);

    // 5. Unmatched brackets/quotes
    this.checkMatchedEnclosures(text, issues);

    // 6. Sentence capitalization
    this.checkSentenceCapitalization(text, issues);

    // 7. Common word misuse ("could of" -> "could have")
    this.checkCommonUsageErrors(text, issues);

    const errorCount = issues.filter(i => i.type === 'grammar' || i.type === 'punctuation').length;
    const suggestionCount = issues.filter(i => i.type === 'style').length;

    return {
      text,
      issues,
      errorCount,
      suggestionCount,
    };
  }

  private checkArticles(text: string, issues: GrammarIssue[]): void {
    // "a" before vowel sounds
    const aVowelPattern = /\b(a)\s+([aeio][a-z]+)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = aVowelPattern.exec(text)) !== null) {
      const nextWord = match[2].toLowerCase();
      // Exceptions: words like "one", "user", "unicorn", "university"
      if (!['one', 'user', 'unique', 'unicorn', 'university', 'uniform'].includes(nextWord)) {
        issues.push({
          type: 'grammar',
          message: `Use 'an' instead of 'a' before words starting with a vowel sound`,
          explanation: `'${match[2]}' begins with a vowel sound, so it should be preceded by 'an'.`,
          suggestion: `an ${match[2]}`,
          confidence: 0.95,
          offset: match.index,
          length: match[0].length,
        });
      }
    }

    // "an" before consonant sounds
    const anConsonantPattern = /\b(an)\s+([b-df-hj-np-tv-z][a-z]+)\b/gi;
    while ((match = anConsonantPattern.exec(text)) !== null) {
      const nextWord = match[2].toLowerCase();
      // Exceptions: "hour", "honest", "honor"
      if (!['hour', 'hours', 'honest', 'honor', 'honorable', 'heir'].includes(nextWord)) {
        issues.push({
          type: 'grammar',
          message: `Use 'a' instead of 'an' before words starting with a consonant sound`,
          explanation: `'${match[2]}' begins with a consonant sound, so it should be preceded by 'a'.`,
          suggestion: `a ${match[2]}`,
          confidence: 0.95,
          offset: match.index,
          length: match[0].length,
        });
      }
    }
  }

  private checkDuplicatedWords(text: string, issues: GrammarIssue[]): void {
    const pattern = /\b([a-z]+)\s+\1\b/gi;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: 'grammar',
        message: `Repeated word '${match[1]}'`,
        explanation: `The word '${match[1]}' is repeated consecutively.`,
        suggestion: match[1],
        confidence: 0.98,
        offset: match.index,
        length: match[0].length,
      });
    }
  }

  private checkPunctuationSpacing(text: string, issues: GrammarIssue[]): void {
    const pattern = /\w+(\s+)([,.!?;:])/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: 'punctuation',
        message: 'Unexpected space before punctuation mark',
        explanation: 'Punctuation marks should directly follow the preceding word without whitespace.',
        suggestion: match[2],
        confidence: 0.95,
        offset: match.index + match[0].length - match[1].length - 1,
        length: match[1].length + 1,
      });
    }
  }

  private checkRepeatedPunctuation(text: string, issues: GrammarIssue[]): void {
    const pattern = /([,;:]{2,}|\.{4,})/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        type: 'punctuation',
        message: `Repeated punctuation '${match[0]}'`,
        explanation: 'Multiple consecutive punctuation marks should be simplified.',
        suggestion: match[0][0],
        confidence: 0.9,
        offset: match.index,
        length: match[0].length,
      });
    }
  }

  private checkMatchedEnclosures(text: string, issues: GrammarIssue[]): void {
    const parens = (text.match(/\(/g) || []).length - (text.match(/\)/g) || []).length;
    if (parens !== 0) {
      issues.push({
        type: 'punctuation',
        message: 'Unbalanced parentheses',
        explanation: 'There is an unequal number of opening and closing parentheses.',
        suggestion: parens > 0 ? 'Add closing parenthesis' : 'Add opening parenthesis',
        confidence: 0.85,
        offset: text.length - 1,
        length: 1,
      });
    }
  }

  private checkSentenceCapitalization(text: string, issues: GrammarIssue[]): void {
    const pattern = /(?:^|[.!?]\s+)([a-z])/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const lowerChar = match[1];
      const offset = match.index + match[0].length - 1;
      issues.push({
        type: 'grammar',
        message: 'Sentence does not start with a capitalized letter',
        explanation: 'The first letter of a sentence must be capitalized.',
        suggestion: lowerChar.toUpperCase(),
        confidence: 0.92,
        offset,
        length: 1,
      });
    }
  }

  private checkCommonUsageErrors(text: string, issues: GrammarIssue[]): void {
    const commonErrors = [
      { pattern: /\bcould of\b/gi, fix: 'could have', exp: "'could of' is an incorrect transcription of 'could've' / 'could have'" },
      { pattern: /\bshould of\b/gi, fix: 'should have', exp: "'should of' is an incorrect transcription of 'should have'" },
      { pattern: /\bwould of\b/gi, fix: 'would have', exp: "'would of' is an incorrect transcription of 'would have'" },
      { pattern: /\birregardless\b/gi, fix: 'regardless', exp: "'irregardless' is nonstandard; use 'regardless'" },
      { pattern: /\btheir is\b/gi, fix: 'there is', exp: "'their' is possessive; use 'there is' for existence" },
      { pattern: /\byour welcome\b/gi, fix: "you're welcome", exp: "use \"you're welcome\" (contraction of 'you are')" },
    ];

    for (const item of commonErrors) {
      let match: RegExpExecArray | null;
      while ((match = item.pattern.exec(text)) !== null) {
        issues.push({
          type: 'grammar',
          message: `Usage error: '${match[0]}'`,
          explanation: item.exp,
          suggestion: item.fix,
          confidence: 0.98,
          offset: match.index,
          length: match[0].length,
        });
      }
    }
  }
}

export function createGrammarEngine(): GrammarEngine {
  return new GrammarEngine();
}
