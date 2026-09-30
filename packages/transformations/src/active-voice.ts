/**
 * Active Voice Transformation
 * 
 * Inverts passive voice clauses into direct, active voice constructions:
 * e.g. "Numerous pathogens are inhibited by BASANT [1]." -> "BASANT [1] inhibits numerous pathogens."
 * e.g. "The proposal was rejected by the committee." -> "The committee rejected the proposal."
 */

import type {
  TransformationContext,
  TransformationResult,
  TransformationPlan,
  Modification,
} from '@riri/types';
import { BaseTransformation } from './base-transformation.js';

interface VerbEntry {
  presSg: string;
  presPl: string;
  past: string;
}

const VERB_CONJUGATIONS: Record<string, VerbEntry> = {
  'inhibited': { presSg: 'inhibits', presPl: 'inhibit', past: 'inhibited' },
  'suppressed': { presSg: 'suppresses', presPl: 'suppress', past: 'suppressed' },
  'blocked': { presSg: 'blocks', presPl: 'block', past: 'blocked' },
  'reduced': { presSg: 'reduces', presPl: 'reduce', past: 'reduced' },
  'increased': { presSg: 'increases', presPl: 'increase', past: 'increased' },
  'observed': { presSg: 'observes', presPl: 'observe', past: 'observed' },
  'analyzed': { presSg: 'analyzes', presPl: 'analyze', past: 'analyzed' },
  'tested': { presSg: 'tests', presPl: 'test', past: 'tested' },
  'rejected': { presSg: 'rejects', presPl: 'reject', past: 'rejected' },
  'approved': { presSg: 'approves', presPl: 'approve', past: 'approved' },
  'demonstrated': { presSg: 'demonstrates', presPl: 'demonstrate', past: 'demonstrated' },
  'verified': { presSg: 'verifies', presPl: 'verify', past: 'verified' },
  'confirmed': { presSg: 'confirms', presPl: 'confirm', past: 'confirmed' },
  'produced': { presSg: 'produces', presPl: 'produce', past: 'produced' },
  'regulated': { presSg: 'regulates', presPl: 'regulate', past: 'regulated' },
  'caused': { presSg: 'causes', presPl: 'cause', past: 'caused' },
  'influenced': { presSg: 'influences', presPl: 'influence', past: 'influenced' },
  'affected': { presSg: 'affects', presPl: 'affect', past: 'affected' },
  'supported': { presSg: 'supports', presPl: 'support', past: 'supported' },
  'evaluated': { presSg: 'evaluates', presPl: 'evaluate', past: 'evaluated' },
  'identified': { presSg: 'identifies', presPl: 'identify', past: 'identified' },
  'characterized': { presSg: 'characterizes', presPl: 'characterize', past: 'characterized' },
  'established': { presSg: 'establishes', presPl: 'establish', past: 'established' },
  'eliminated': { presSg: 'eliminates', presPl: 'eliminate', past: 'eliminated' },
  'conducted': { presSg: 'conducts', presPl: 'conduct', past: 'conducted' },
  'discovered': { presSg: 'discovers', presPl: 'discover', past: 'discovered' },
  'investigated': { presSg: 'investigates', presPl: 'investigate', past: 'investigated' },
};

export class ActiveVoiceTransformation extends BaseTransformation {
  readonly id = 'active-voice';
  readonly name = 'Active Voice Conversion';
  readonly description = 'Inverts passive voice constructions into direct, active subject-verb-object syntax';

  // Match: [Patient] (is|are|was|were) [Adverb]? [PastParticiple] by [Agent] [Citation]?
  private readonly pattern = /(?:^|(?<=[.!?]\s+)|\n+)([A-Z][^.!?\n]*?)\s+(is|are|was|were)\s+([a-z]+ed)\s+by\s+([^,;.!?\n]+?)(\s*\[\d+\])?(?=[,;.!?]|$)/g;


  async applicability(text: string, context: TransformationContext): Promise<number> {
    this.pattern.lastIndex = 0;
    const matches = [...text.matchAll(this.pattern)];
    const validMatches = matches.filter(m => {
      const verb = m[3].toLowerCase();
      return verb in VERB_CONJUGATIONS && !this.isProtected(m.index ?? 0, context.protectedSpans);
    });
    return validMatches.length > 0 ? 0.85 : 0;
  }

  async plan(text: string, context: TransformationContext): Promise<TransformationPlan> {
    return {
      complexity: context.features.complexity,
      recommendedTransformations: [
        {
          id: this.id,
          priority: 0.95,
          strength: context.strength,
        },
      ],
      preserve: ['protected-content', 'negation', 'citations'],
      skipTransformations: [],
    };
  }

  async execute(text: string, context: TransformationContext): Promise<TransformationResult> {
    this.pattern.lastIndex = 0;
    const matches = [...text.matchAll(this.pattern)];
    const rawMatches: Array<{
      origMatch: string;
      origStart: number;
      origEnd: number;
      replacement: string;
      reason: string;
    }> = [];

    const commonStarters = new Set([
      'the', 'a', 'an', 'this', 'that', 'these', 'those', 'numerous', 'multiple',
      'several', 'all', 'many', 'some', 'few', 'both', 'each', 'every', 'various',
      'significant', 'substantial', 'preliminary', 'initial'
    ]);

    for (const match of matches) {
      if (match.index === undefined) continue;

      const [fullMatch, patient, aux, pastParticiple, agent, citation] = match;
      const verbKey = pastParticiple.toLowerCase();
      const verbEntry = VERB_CONJUGATIONS[verbKey];
      if (!verbEntry) continue;

      const origStart = match.index;
      const origEnd = origStart + fullMatch.length;

      if (this.isProtected(origStart, context.protectedSpans)) continue;

      const isPast = aux.toLowerCase() === 'was' || aux.toLowerCase() === 'were';
      const cleanAgent = agent.trim();
      const isAgentPlural = cleanAgent.endsWith('s') && !cleanAgent.endsWith('ss') && !/^[A-Z0-9_-]+$/.test(cleanAgent);

      const activeVerb = isPast ? verbEntry.past : (isAgentPlural ? verbEntry.presPl : verbEntry.presSg);

      // Capitalization & formatting
      const agentCap = cleanAgent[0].toUpperCase() + cleanAgent.slice(1);
      // Strip trailing commas from patient
      const cleanPatient = patient.trim().replace(/,\s*$/, '');
      const firstWord = cleanPatient.split(/\s+/)[0] || '';
      const shouldLowercase = commonStarters.has(firstWord.toLowerCase());
      const patientFormatted = shouldLowercase
        ? (firstWord.toLowerCase() + cleanPatient.slice(firstWord.length))
        : cleanPatient;

      const cit = citation ? citation : '';
      const replacement = `${agentCap}${cit} ${activeVerb} ${patientFormatted}`;

      rawMatches.push({
        origMatch: fullMatch,
        origStart,
        origEnd,
        replacement,
        reason: `Inverted passive voice ("${cleanPatient} ${aux} ${pastParticiple} by ${cleanAgent}") into active voice ("${agentCap} ${activeVerb} ${patientFormatted}")`,
      });
    }


    if (rawMatches.length === 0) {
      return this.createFailedResult(text, 'No eligible passive voice constructions found');
    }

    // Sort descending by position so back-to-front replacement preserves offsets
    rawMatches.sort((a, b) => b.origStart - a.origStart);

    let modifiedText = text;
    const modifications: Modification[] = [];

    for (const item of rawMatches) {
      modifiedText =
        modifiedText.substring(0, item.origStart) +
        item.replacement +
        modifiedText.substring(item.origEnd);

      modifications.push({
        type: 'structural-change',
        original: { text: item.origMatch, start: item.origStart, end: item.origEnd },
        replacement: item.replacement,
        reason: item.reason,
      });
    }

    return this.createResult(modifiedText, modifications, text);
  }
}

export function createActiveVoiceTransformation(): ActiveVoiceTransformation {
  return new ActiveVoiceTransformation();
}
