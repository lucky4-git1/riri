import type { AnalyzedText, EntityMention, PhraseInfo, SemanticAnalysis, SemanticAnchor, SentenceSemantics, TenseName, TextSpan } from '@riri/types';
import { NEGATION_WORDS } from '@riri/parser';

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'it', 'its', 'this', 'that']);
const CONNECTORS = new Set(['because', 'although', 'however', 'therefore', 'moreover', 'furthermore', 'while', 'since', 'if', 'when', 'after', 'before']);

/** A bounded linguistic approximation used for planning and safety alignment. */
export class SemanticAnalyzer {
  analyze(analyzed: AnalyzedText): SemanticAnalysis {
    return { sentences: analyzed.sentences.map(sentence => this.analyzeSentence(sentence.index, sentence.text, sentence.start, sentence.end, analyzed.protectedSpans)) };
  }

  extractAnchors(analysis: SemanticAnalysis): SemanticAnchor[] {
    return analysis.sentences.flatMap(sentence => {
      const entityAnchors = sentence.entities.map(entity => ({ text: entity.text, kind: this.entityKind(entity), sentenceIndex: sentence.index, start: entity.start, end: entity.end }));
      const action = sentence.predicate ? [{ text: sentence.predicate.text, kind: 'action' as const, sentenceIndex: sentence.index, start: sentence.predicate.start, end: sentence.predicate.end }] : [];
      const negation = sentence.negationSpans.map(span => ({ text: span.text, kind: 'negation' as const, sentenceIndex: sentence.index, start: span.start, end: span.end }));
      return [...entityAnchors, ...action, ...negation];
    });
  }

  private analyzeSentence(index: number, text: string, start: number, end: number, protectedSpans: AnalyzedText['protectedSpans']): SentenceSemantics {
    const tokens = [...text.matchAll(/[A-Za-z][A-Za-z'-]*|\d+(?:\.\d+)?%?/g)].map(match => ({ value: match[0], start: start + (match.index ?? 0), end: start + (match.index ?? 0) + match[0].length }));
    const lower = tokens.map(token => token.value.toLowerCase());
    const verbIndex = lower.findIndex(word => /(?:ed|ing)$/.test(word) || ['is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'does', 'did', 'decided', 'approve', 'rejected', 'supports', 'support'].includes(word));
    const subject = verbIndex > 0 ? this.phrase(text, start, tokens[0].start, tokens[verbIndex].start) : null;
    const predicate = verbIndex >= 0 ? this.phrase(text, start, tokens[verbIndex].start, tokens[Math.min(tokens.length - 1, verbIndex + 2)].end) : null;
    const connectorIndex = lower.findIndex(word => CONNECTORS.has(word));
    const objectStart = verbIndex >= 0 ? verbIndex + 1 : -1;
    const objectEnd = connectorIndex > objectStart ? connectorIndex : tokens.length;
    const objects = objectStart >= 0 && objectStart < objectEnd ? [this.phrase(text, start, tokens[objectStart].start, tokens[objectEnd - 1].end)].filter((item): item is PhraseInfo => item !== null) : [];
    const negationSpans: TextSpan[] = tokens.filter(token => NEGATION_WORDS.has(token.value.toLowerCase())).map(token => ({ ...token, text: token.value }));
    const entities = this.entities(tokens, protectedSpans);
    const clauses = connectorIndex > 0 ? [
      { text: text.slice(0, tokens[connectorIndex].start - start).trim(), start, end: tokens[connectorIndex].start, role: 'main' as const },
      { text: text.slice(tokens[connectorIndex].start - start).trim(), start: tokens[connectorIndex].start, end, role: 'subordinate' as const, conjunction: tokens[connectorIndex].value.toLowerCase() },
    ] : [{ text, start, end, role: 'main' as const }];
    return {
      index, text, start, end, clauses, subject, predicate, objects, verbPhrase: predicate,
      negationCount: negationSpans.length, negationSpans, tense: this.tense(lower),
      voice: /\b(?:is|are|was|were|been|being)\s+\w+(?:ed|en)\b/i.test(text) ? 'passive' : 'active',
      modals: tokens.filter(token => ['can', 'could', 'may', 'might', 'must', 'should', 'would', 'will'].includes(token.value.toLowerCase())).map(token => token.value),
      entities, contentWords: lower.filter(word => word.length > 2 && !STOP_WORDS.has(word)),
      discourseConnector: connectorIndex >= 0 ? lower[connectorIndex] : null, wordCount: tokens.length,
    };
  }

  private phrase(text: string, base: number, absoluteStart: number, absoluteEnd: number): PhraseInfo | null {
    const value = text.slice(absoluteStart - base, absoluteEnd - base).trim();
    return value ? { text: value, start: absoluteStart, end: absoluteEnd, head: value.split(/\s+/).at(-1) } : null;
  }

  private entities(tokens: Array<{ value: string; start: number; end: number }>, protectedSpans: AnalyzedText['protectedSpans']): EntityMention[] {
    const direct = protectedSpans.map(span => ({ text: span.value, kind: span.type === 'number' || span.type === 'percentage' || span.type === 'currency' ? 'number' as const : span.type === 'date' ? 'date' as const : 'technical' as const, start: span.start, end: span.end }));
    const names = tokens.filter((token, index) => index > 0 && /^[A-Z]/.test(token.value)).map(token => ({ text: token.value, kind: 'proper-noun' as const, start: token.start, end: token.end }));
    return [...direct, ...names];
  }

  private tense(words: string[]): TenseName {
    if (words.some(word => ['will', 'shall'].includes(word))) return 'future';
    if (words.some(word => ['has', 'have'].includes(word)) && words.some(word => /ed$/.test(word))) return 'present-perfect';
    if (words.some(word => ['was', 'were', 'did'].includes(word)) || words.some(word => /ed$/.test(word))) return 'past';
    if (words.some(word => ['can', 'could', 'may', 'might', 'must', 'should', 'would'].includes(word))) return 'modal';
    return words.length ? 'present' : 'unknown';
  }

  private entityKind(entity: EntityMention): SemanticAnchor['kind'] {
    if (entity.kind === 'number' || entity.kind === 'quantity') return 'number';
    if (entity.kind === 'date') return 'date';
    if (entity.kind === 'technical') return 'technical';
    return 'entity';
  }
}

export function createSemanticAnalyzer(): SemanticAnalyzer {
  return new SemanticAnalyzer();
}
