const IRREGULAR_PAST_TO_ACTIVE = {
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
};

function invertPassiveClause(clause) {
  // Regex to match: [Patient] (is|are|was|were) [Adverb]? [PastParticiple] by [Agent] [Citation]?
  const pattern = /([A-Z][^,;.!?\n]*?)\s+(is|are|was|were)\s+([a-z]+ed)\s+by\s+([^,;.!?\n]+?)(\s*\[\d+\])?([,;.!?]|$)/i;
  const match = pattern.exec(clause);
  if (!match) return clause;

  const [fullMatch, patient, aux, pastParticiple, agent, citation, trailingPunct] = match;
  const entry = IRREGULAR_PAST_TO_ACTIVE[pastParticiple.toLowerCase()];
  if (!entry) return clause;

  const isPast = aux.toLowerCase() === 'was' || aux.toLowerCase() === 'were';
  const isAgentPlural = agent.trim().endsWith('s') && !agent.trim().endsWith('ss') && !/^[A-Z0-9_-]+$/.test(agent.trim());

  let activeVerb = isPast ? entry.past : (isAgentPlural ? entry.presPl : entry.presSg);

  // Capitalization
  const cleanAgent = agent.trim();
  const agentCap = cleanAgent[0].toUpperCase() + cleanAgent.slice(1);
  const cleanPatient = patient.trim();
  // Only lowercase first letter of patient if it's not a proper noun / acronym
  const isPatientProper = /^[A-Z]{2,}/.test(cleanPatient);
  const patientFormatted = isPatientProper ? cleanPatient : (cleanPatient[0].toLowerCase() + cleanPatient.slice(1));
  const cit = citation ? citation : '';
  const punct = trailingPunct ? trailingPunct : '';

  const activeReplacement = `${agentCap}${cit} ${activeVerb} ${patientFormatted}${punct}`;
  return clause.slice(0, match.index) + activeReplacement + clause.slice(match.index + fullMatch.length);
}

console.log('1:', invertPassiveClause('The proposal was rejected by the committee.'));
console.log('2:', invertPassiveClause('Numerous genital pathogens are inhibited by BASANT [1].'));
console.log('3:', invertPassiveClause('Chlamydia trachomatis is inhibited by BASANT [2].'));
console.log('4:', invertPassiveClause('Significant progress was demonstrated by the team.'));
console.log('5:', invertPassiveClause('The molecular mechanisms were analyzed by researchers.'));
