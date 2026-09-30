import type { ValidationResult } from '@riri/types';

/** Rejects new proper nouns and numeric facts while allowing normal sentence capitalization. */
export class AnchorValidator {
  validate(original: string, transformed: string): ValidationResult {
    const source = new Set(this.anchors(original).map(a => a.toLowerCase()));
    const output = this.anchors(transformed);
    const introduced = output.filter(anchor => !source.has(anchor.toLowerCase()));
    const issues = introduced.length ? [`Candidate introduces unsupported factual anchors: ${introduced.join(', ')}`] : [];

    return { valid: issues.length === 0, confidence: issues.length ? 0 : 1, issues, warnings: [] };
  }

  private anchors(text: string): string[] {
    const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
    
    // Extract mid-sentence proper nouns (capitalized words that do not start a sentence)
    // and acronyms / identifiers (ALL CAPS like WHO, NASA, or mixedCase)
    const properNouns: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    
    // Common words that frequently appear capitalized at sentence start
    const commonSentenceStarters = new Set([
      'the', 'this', 'that', 'these', 'those', 'it', 'they', 'we', 'you', 'he', 'she',
      'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'into', 'through',
      'furthermore', 'moreover', 'however', 'therefore', 'additionally', 'consequently',
      'regarding', 'concerning', 'considering', 'taking', 'having', 'specifically',
      'importantly', 'notably', 'initially', 'ultimately', 'finally', 'subsequently',
      'numerous', 'multiple', 'several', 'various', 'diverse', 'extensive', 'many',
      'although', 'because', 'since', 'while', 'whereas', 'despite', 'after', 'before',
      'overall', 'indeed', 'thus', 'hence', 'meanwhile', 'similarly', 'accordingly',
      'formulated', 'supplied', 'provided', 'designed', 'tested', 'observed', 'results',
    ]);

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const raw = words[i].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        if (!raw) continue;
        
        // Acronyms (ALL CAPS with length >= 2, e.g. WHO, DNA, BASANT)
        if (/^[A-Z]{2,}$/.test(raw)) {
          properNouns.push(raw);
          continue;
        }

        // Mixed case identifier (e.g. CamelCase, iPhone)
        if (/[a-z][A-Z]/.test(raw)) {
          properNouns.push(raw);
          continue;
        }

        // If at sentence start (i === 0), only consider it an anchor if not a common word
        if (i === 0) {
          if (commonSentenceStarters.has(raw.toLowerCase())) {
            continue;
          }
          if (/^[A-Z][a-z]+$/.test(raw)) {
            properNouns.push(raw);
          }
        } else {
          // Mid-sentence capitalized word
          if (/^[A-Z][a-z]+$/.test(raw)) {
            properNouns.push(raw);
          }
        }

      }
    }

    return [...numbers, ...properNouns];
  }

}

export function createAnchorValidator(): AnchorValidator {
  return new AnchorValidator();
}
