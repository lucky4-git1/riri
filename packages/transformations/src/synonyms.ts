/**
 * Conservative Synonym Database & Morphological Inflection Engine
 * 
 * High-confidence, context-appropriate synonyms for academic, professional,
 * and general writing with automatic morphological inflection handling
 * (-s, -ed, -ing, -ly).
 */

export interface SynonymEntry {
  word: string;
  synonyms: string[];
  pos?: string;
  register?: 'formal' | 'neutral' | 'informal';
}

export const SYNONYM_DATABASE: SynonymEntry[] = [
  // Core Verbs
  { word: 'show', synonyms: ['demonstrate', 'indicate', 'reveal', 'display', 'illustrate'], pos: 'VERB' },
  { word: 'use', synonyms: ['utilize', 'employ', 'apply'], pos: 'VERB' },
  { word: 'make', synonyms: ['create', 'produce', 'generate', 'form'], pos: 'VERB' },
  { word: 'give', synonyms: ['provide', 'offer', 'supply', 'furnish'], pos: 'VERB' },
  { word: 'get', synonyms: ['obtain', 'acquire', 'receive'], pos: 'VERB' },
  { word: 'find', synonyms: ['discover', 'identify', 'locate', 'ascertain'], pos: 'VERB' },
  { word: 'help', synonyms: ['assist', 'aid', 'support', 'facilitate'], pos: 'VERB' },
  { word: 'need', synonyms: ['require', 'necessitate', 'demand'], pos: 'VERB' },
  { word: 'keep', synonyms: ['maintain', 'preserve', 'retain', 'sustain'], pos: 'VERB' },
  { word: 'start', synonyms: ['begin', 'initiate', 'commence'], pos: 'VERB' },
  { word: 'end', synonyms: ['conclude', 'finish', 'terminate'], pos: 'VERB' },
  { word: 'change', synonyms: ['modify', 'alter', 'adjust'], pos: 'VERB' },
  { word: 'improve', synonyms: ['enhance', 'optimize', 'refine', 'boost'], pos: 'VERB' },
  { word: 'increase', synonyms: ['enhance', 'expand', 'augment', 'elevate'], pos: 'VERB' },
  { word: 'decrease', synonyms: ['reduce', 'diminish', 'lower', 'curtail'], pos: 'VERB' },
  { word: 'allow', synonyms: ['permit', 'enable', 'facilitate'], pos: 'VERB' },
  { word: 'ensure', synonyms: ['guarantee', 'verify', 'confirm'], pos: 'VERB' },
  { word: 'handle', synonyms: ['manage', 'process', 'address', 'oversee'], pos: 'VERB' },
  { word: 'explain', synonyms: ['describe', 'outline', 'clarify', 'elucidate', 'detail'], pos: 'VERB' },
  { word: 'guard', synonyms: ['protect', 'shield', 'defend'], pos: 'VERB' },
  { word: 'prevent', synonyms: ['inhibit', 'block', 'avert', 'thwart', 'deter'], pos: 'VERB' },
  { word: 'eradicate', synonyms: ['eliminate', 'clear', 'destroy', 'purge'], pos: 'VERB' },
  { word: 'treat', synonyms: ['manage', 'address', 'alleviate', 'remedy'], pos: 'VERB' },
  { word: 'inhibit', synonyms: ['suppress', 'block', 'constrain', 'halt', 'impair'], pos: 'VERB' },
  { word: 'inject', synonyms: ['administer', 'introduce', 'deliver', 'instill'], pos: 'VERB' },
  { word: 'isolate', synonyms: ['harvest', 'extract', 'recover', 'separate'], pos: 'VERB' },
  { word: 'exhibit', synonyms: ['demonstrate', 'display', 'show', 'manifest'], pos: 'VERB' },
  { word: 'deliver', synonyms: ['administer', 'provide', 'supply', 'disperse'], pos: 'VERB' },
  { word: 'suppress', synonyms: ['inhibit', 'curb', 'dampen', 'contain'], pos: 'VERB' },
  { word: 'enter', synonyms: ['penetrate', 'infiltrate', 'access'], pos: 'VERB' },
  { word: 'call', synonyms: ['term', 'designate', 'name', 'label'], pos: 'VERB' },
  { word: 'develop', synonyms: ['progress', 'evolve', 'advance', 'form'], pos: 'VERB' },
  { word: 'return', synonyms: ['restore', 'revert', 'bring back'], pos: 'VERB' },

  { word: 'establish', synonyms: ['create', 'found', 'institute', 'build'], pos: 'VERB' },
  { word: 'examine', synonyms: ['investigate', 'analyze', 'inspect', 'scrutinize'], pos: 'VERB' },
  { word: 'evaluate', synonyms: ['assess', 'appraise', 'gauge'], pos: 'VERB' },
  { word: 'perform', synonyms: ['conduct', 'execute', 'carry out'], pos: 'VERB' },
  { word: 'achieve', synonyms: ['attain', 'accomplish', 'reach'], pos: 'VERB' },
  { word: 'produce', synonyms: ['generate', 'yield', 'create'], pos: 'VERB' },
  { word: 'eliminate', synonyms: ['remove', 'eradicate', 'clear'], pos: 'VERB' },
  { word: 'protect', synonyms: ['shield', 'guard', 'defend'], pos: 'VERB' },
  { word: 'manage', synonyms: ['control', 'regulate', 'administer'], pos: 'VERB' },
  { word: 'support', synonyms: ['substantiate', 'corroborate', 'back'], pos: 'VERB' },
  { word: 'affect', synonyms: ['influence', 'impact', 'alter'], pos: 'VERB' },
  { word: 'cause', synonyms: ['induce', 'trigger', 'prompt', 'provoke'], pos: 'VERB' },
  { word: 'contain', synonyms: ['comprise', 'include', 'encompass'], pos: 'VERB' },
  { word: 'occur', synonyms: ['arise', 'transpire', 'manifest'], pos: 'VERB' },
  { word: 'verify', synonyms: ['confirm', 'validate', 'authenticate'], pos: 'VERB' },
  { word: 'detect', synonyms: ['identify', 'discern', 'discover'], pos: 'VERB' },
  { word: 'indicate', synonyms: ['suggest', 'signify', 'denote', 'evince'], pos: 'VERB' },
  { word: 'analyze', synonyms: ['examine', 'evaluate', 'scrutinize', 'assess'], pos: 'VERB' },
  { word: 'determine', synonyms: ['ascertain', 'identify', 'establish', 'calculate'], pos: 'VERB' },
  { word: 'explore', synonyms: ['investigate', 'probe', 'delve into', 'examine'], pos: 'VERB' },
  { word: 'demonstrate', synonyms: ['show', 'illustrate', 'exhibit', 'manifest'], pos: 'VERB' },
  { word: 'substantiate', synonyms: ['corroborate', 'verify', 'validate', 'confirm'], pos: 'VERB' },
  { word: 'clarify', synonyms: ['elucidate', 'illuminate', 'simplify', 'explain'], pos: 'VERB' },
  { word: 'highlight', synonyms: ['emphasize', 'underscore', 'accentuate', 'spotlight'], pos: 'VERB' },
  { word: 'illustrate', synonyms: ['exemplify', 'demonstrate', 'depict', 'show'], pos: 'VERB' },
  { word: 'construct', synonyms: ['build', 'assemble', 'devise', 'formulate'], pos: 'VERB' },
  { word: 'formulate', synonyms: ['develop', 'devise', 'prepare', 'design'], pos: 'VERB' },
  { word: 'foster', synonyms: ['promote', 'cultivate', 'encourage', 'nurture'], pos: 'VERB' },

  { word: 'promote', synonyms: ['advance', 'further', 'foster', 'advocate'], pos: 'VERB' },
  { word: 'facilitate', synonyms: ['enable', 'expedite', 'assist', 'smooth'], pos: 'VERB' },
  { word: 'accelerate', synonyms: ['expedite', 'quicken', 'speed up', 'hasten'], pos: 'VERB' },
  { word: 'strengthen', synonyms: ['reinforce', 'fortify', 'bolster', 'solidify'], pos: 'VERB' },
  { word: 'sustain', synonyms: ['maintain', 'uphold', 'preserve', 'support'], pos: 'VERB' },
  { word: 'mitigate', synonyms: ['alleviate', 'diminish', 'lessen', 'temper'], pos: 'VERB' },
  { word: 'alleviate', synonyms: ['relieve', 'mitigate', 'ease', 'soothe'], pos: 'VERB' },
  { word: 'resolve', synonyms: ['settle', 'rectify', 'remedy', 'solve'], pos: 'VERB' },
  { word: 'transform', synonyms: ['convert', 'transmute', 'alter', 'reshape'], pos: 'VERB' },
  { word: 'implement', synonyms: ['execute', 'enact', 'apply', 'deploy'], pos: 'VERB' },
  { word: 'utilize', synonyms: ['employ', 'use', 'harness', 'apply'], pos: 'VERB' },
  { word: 'leverage', synonyms: ['capitalize on', 'utilize', 'exploit', 'harness'], pos: 'VERB' },
  { word: 'optimize', synonyms: ['maximize', 'refine', 'perfect', 'streamline'], pos: 'VERB' },
  { word: 'integrate', synonyms: ['incorporate', 'assimilate', 'synthesize', 'unify'], pos: 'VERB' },
  { word: 'distinguish', synonyms: ['differentiate', 'discern', 'separate', 'discriminate'], pos: 'VERB' },
  { word: 'extract', synonyms: ['isolate', 'preparation', 'distillate'], pos: 'NOUN' },

  { word: 'convey', synonyms: ['communicate', 'transmit', 'express', 'impart'], pos: 'VERB' },
  { word: 'perceive', synonyms: ['discern', 'recognize', 'detect', 'observe'], pos: 'VERB' },
  { word: 'comprehend', synonyms: ['understand', 'grasp', 'fathom', 'apprehend'], pos: 'VERB' },
  { word: 'infer', synonyms: ['deduce', 'conclude', 'surmise', 'gather'], pos: 'VERB' },
  { word: 'assert', synonyms: ['contend', 'maintain', 'affirm', 'claim'], pos: 'VERB' },
  { word: 'propose', synonyms: ['suggest', 'put forward', 'advance', 'recommend'], pos: 'VERB' },
  { word: 'advocate', synonyms: ['champion', 'endorse', 'support', 'promote'], pos: 'VERB' },
  { word: 'surpass', synonyms: ['exceed', 'outperform', 'transcend', 'eclipse'], pos: 'VERB' },
  { word: 'retain', synonyms: ['keep', 'preserve', 'hold', 'maintain'], pos: 'VERB' },
  { word: 'diminish', synonyms: ['decrease', 'lessen', 'dwindle', 'decline'], pos: 'VERB' },
  { word: 'curb', synonyms: ['restrain', 'check', 'constrain', 'limit'], pos: 'VERB' },

  // Core Adjectives
  { word: 'successful', synonyms: ['effective', 'efficacious', 'potent', 'productive'], pos: 'ADJ' },
  { word: 'remarkable', synonyms: ['exceptional', 'notable', 'extraordinary', 'striking'], pos: 'ADJ' },
  { word: 'brief', synonyms: ['concise', 'succinct', 'short', 'pithy'], pos: 'ADJ' },
  { word: 'normal', synonyms: ['standard', 'baseline', 'typical', 'healthy'], pos: 'ADJ' },
  { word: 'healthy', synonyms: ['normal', 'sound', 'robust', 'viable'], pos: 'ADJ' },
  { word: 'recurrent', synonyms: ['recurring', 'repeated', 'frequent', 'chronic'], pos: 'ADJ' },
  { word: 'important', synonyms: ['significant', 'crucial', 'essential', 'vital', 'pivotal'], pos: 'ADJ' },
  { word: 'crucial', synonyms: ['pivotal', 'vital', 'essential', 'critical'], pos: 'ADJ' },
  { word: 'vital', synonyms: ['essential', 'paramount', 'indispensable', 'crucial'], pos: 'ADJ' },
  { word: 'essential', synonyms: ['indispensable', 'fundamental', 'vital', 'requisite'], pos: 'ADJ' },
  { word: 'fundamental', synonyms: ['basic', 'foundational', 'underlying', 'core'], pos: 'ADJ' },
  { word: 'pivotal', synonyms: ['central', 'decisive', 'crucial', 'momentous'], pos: 'ADJ' },
  { word: 'salient', synonyms: ['prominent', 'noteworthy', 'conspicuous', 'marked'], pos: 'ADJ' },
  { word: 'comprehensive', synonyms: ['thorough', 'detailed', 'extensive', 'in-depth'], pos: 'ADJ' },

  { word: 'thorough', synonyms: ['meticulous', 'rigorous', 'detailed', 'exhaustive'], pos: 'ADJ' },
  { word: 'rigorous', synonyms: ['stringent', 'exacting', 'meticulous', 'demanding'], pos: 'ADJ' },
  { word: 'reliable', synonyms: ['dependable', 'trustworthy', 'consistent', 'sound'], pos: 'ADJ' },
  { word: 'robust', synonyms: ['resilient', 'sturdy', 'solid', 'durable'], pos: 'ADJ' },
  { word: 'potent', synonyms: ['powerful', 'effective', 'forceful', 'influential'], pos: 'ADJ' },
  { word: 'plausible', synonyms: ['credible', 'feasible', 'tenable', 'convincing'], pos: 'ADJ' },
  { word: 'feasible', synonyms: ['viable', 'practicable', 'attainable', 'workable'], pos: 'ADJ' },
  { word: 'lucid', synonyms: ['clear', 'coherent', 'transparent', 'intelligible'], pos: 'ADJ' },
  { word: 'coherent', synonyms: ['consistent', 'logical', 'orderly', 'articulate'], pos: 'ADJ' },
  { word: 'concise', synonyms: ['succinct', 'compact', 'terse', 'pithy'], pos: 'ADJ' },
  { word: 'diverse', synonyms: ['varied', 'multifaceted', 'heterogeneous', 'assorted'], pos: 'ADJ' },
  { word: 'uniform', synonyms: ['homogeneous', 'consistent', 'even', 'standardized'], pos: 'ADJ' },
  { word: 'novel', synonyms: ['innovative', 'groundbreaking', 'original', 'fresh'], pos: 'ADJ' },
  { word: 'innovative', synonyms: ['pioneering', 'novel', 'inventive', 'progressive'], pos: 'ADJ' },
  { word: 'prevalent', synonyms: ['widespread', 'pervasive', 'common', 'rampant'], pos: 'ADJ' },
  { word: 'transient', synonyms: ['fleeting', 'ephemeral', 'temporary', 'short-lived'], pos: 'ADJ' },
  { word: 'enduring', synonyms: ['perpetual', 'lasting', 'abiding', 'persistent'], pos: 'ADJ' },
  { word: 'substantial', synonyms: ['considerable', 'sizable', 'significant', 'ample'], pos: 'ADJ' },
  { word: 'negligible', synonyms: ['insignificant', 'minor', 'nominal', 'trivial'], pos: 'ADJ' },
  { word: 'apparent', synonyms: ['evident', 'obvious', 'manifest', 'palpable'], pos: 'ADJ' },
  { word: 'distinct', synonyms: ['discrete', 'differentiated', 'separate', 'clear-cut'], pos: 'ADJ' },
  { word: 'adequate', synonyms: ['sufficient', 'acceptable', 'satisfactory', 'competent'], pos: 'ADJ' },
  { word: 'inadequate', synonyms: ['insufficient', 'deficient', 'lacking', 'substandard'], pos: 'ADJ' },
  { word: 'resistant', synonyms: ['unresponsive', 'refractory', 'immune'], pos: 'ADJ' },
  { word: 'strong', synonyms: ['robust', 'potent', 'marked', 'significant'], pos: 'ADJ' },
  { word: 'pure', synonyms: ['purified', 'refined', 'concentrated', 'high-grade'], pos: 'ADJ' },
  { word: 'simple', synonyms: ['easy', 'straightforward', 'uncomplicated', 'convenient'], pos: 'ADJ' },
  { word: 'numerous', synonyms: ['multiple', 'diverse', 'several', 'extensive'], pos: 'ADJ' },

  // Core Nouns
  { word: 'pathogen', synonyms: ['infectious agent', 'microorganism'], pos: 'NOUN' },
  { word: 'strain', synonyms: ['variant', 'isolate', 'lineage', 'subtype'], pos: 'NOUN' },
  { word: 'medicine', synonyms: ['medication', 'therapeutic agent', 'pharmaceutical'], pos: 'NOUN' },
  { word: 'medication', synonyms: ['medicine', 'therapeutic agent', 'treatment'], pos: 'NOUN' },
  { word: 'capsule', synonyms: ['capsule'], pos: 'NOUN' },
  { word: 'infection', synonyms: ['infectious disease', 'pathology', 'condition'], pos: 'NOUN' },
  { word: 'agent', synonyms: ['compound', 'substance', 'factor'], pos: 'NOUN' },

  { word: 'characteristic', synonyms: ['property', 'feature', 'attribute', 'trait'], pos: 'NOUN' },
  { word: 'combination', synonyms: ['formulation', 'blend', 'mixture', 'compound'], pos: 'NOUN' },
  { word: 'route', synonyms: ['path', 'trajectory', 'course', 'avenue'], pos: 'NOUN' },
  { word: 'episode', synonyms: ['occurrence', 'incident', 'event', 'bout'], pos: 'NOUN' },

  { word: 'framework', synonyms: ['structure', 'paradigm', 'architecture', 'schema'], pos: 'NOUN' },
  { word: 'concept', synonyms: ['notion', 'idea', 'construct', 'theory'], pos: 'NOUN' },
  { word: 'perspective', synonyms: ['viewpoint', 'standpoint', 'angle', 'outlook'], pos: 'NOUN' },
  { word: 'dimension', synonyms: ['aspect', 'facet', 'element', 'factor'], pos: 'NOUN' },
  { word: 'parameter', synonyms: ['criterion', 'variable', 'metric', 'benchmark'], pos: 'NOUN' },
  { word: 'objective', synonyms: ['goal', 'target', 'aim', 'purpose'], pos: 'NOUN' },
  { word: 'strategy', synonyms: ['approach', 'tactic', 'scheme', 'methodology'], pos: 'NOUN' },
  { word: 'outcome', synonyms: ['result', 'consequence', 'finding', 'yield'], pos: 'NOUN' },
  { word: 'insight', synonyms: ['understanding', 'revelation', 'perception', 'intuition'], pos: 'NOUN' },
  { word: 'breakthrough', synonyms: ['advancement', 'innovation', 'leap', 'discovery'], pos: 'NOUN' },
  { word: 'obstacle', synonyms: ['impediment', 'barrier', 'hurdle', 'hindrance'], pos: 'NOUN' },
  { word: 'solution', synonyms: ['remedy', 'resolution', 'answer', 'countermeasure'], pos: 'NOUN' },
  { word: 'evidence', synonyms: ['evidence', 'data', 'findings', 'documentation'], pos: 'NOUN' },

  { word: 'context', synonyms: ['milieu', 'environment', 'setting', 'backdrop'], pos: 'NOUN' },
  { word: 'capacity', synonyms: ['capability', 'competence', 'proficiency', 'aptitude'], pos: 'NOUN' },
  { word: 'advantage', synonyms: ['benefit', 'asset', 'merit', 'virtue'], pos: 'NOUN' },
  { word: 'disadvantage', synonyms: ['drawback', 'shortcoming', 'liability', 'defect'], pos: 'NOUN' },
  { word: 'anomaly', synonyms: ['irregularity', 'deviation', 'aberration', 'discrepancy'], pos: 'NOUN' },
  { word: 'phenomenon', synonyms: ['occurrence', 'manifestation', 'event', 'marvel'], pos: 'NOUN' },

  // Core Adverbs
  { word: 'remarkably', synonyms: ['exceptionally', 'notably', 'extraordinarily', 'strikingly'], pos: 'ADV' },
  { word: 'briefly', synonyms: ['concisely', 'succinctly', 'shortly', 'in short'], pos: 'ADV' },
  { word: 'quite', synonyms: ['highly', 'very', 'notably', 'substantially'], pos: 'ADV' },
  { word: 'substantially', synonyms: ['significantly', 'considerably', 'appreciably', 'markedly'], pos: 'ADV' },
  { word: 'predominantly', synonyms: ['primarily', 'principally', 'largely', 'mainly'], pos: 'ADV' },
  { word: 'consistently', synonyms: ['invariably', 'reliably', 'regularly', 'uniformly'], pos: 'ADV' },
  { word: 'effectively', synonyms: ['successfully', 'efficiently', 'productively', 'capably'], pos: 'ADV' },
  { word: 'evidently', synonyms: ['apparently', 'obviously', 'manifestly', 'plainly'], pos: 'ADV' },
  { word: 'subsequently', synonyms: ['thereafter', 'afterward', 'consequently', 'later'], pos: 'ADV' },
  { word: 'fundamentally', synonyms: ['essentially', 'primarily', 'basically', 'intrinsically'], pos: 'ADV' },

  { word: 'very', synonyms: ['highly', 'extremely', 'considerably', 'substantially'], pos: 'ADV' },
  { word: 'also', synonyms: ['additionally', 'furthermore', 'moreover'], pos: 'ADV' },
  { word: 'often', synonyms: ['frequently', 'commonly', 'regularly'], pos: 'ADV' },
  { word: 'usually', synonyms: ['typically', 'generally', 'normally'], pos: 'ADV' },
  { word: 'sometimes', synonyms: ['occasionally', 'periodically'], pos: 'ADV' },
  { word: 'always', synonyms: ['consistently', 'invariably'], pos: 'ADV' },
  { word: 'now', synonyms: ['currently', 'presently'], pos: 'ADV' },
  { word: 'then', synonyms: ['subsequently', 'afterward'], pos: 'ADV' },
  { word: 'quickly', synonyms: ['rapidly', 'swiftly', 'promptly'], pos: 'ADV' },
  { word: 'slowly', synonyms: ['gradually', 'steadily'], pos: 'ADV' },
  { word: 'clearly', synonyms: ['evidently', 'obviously', 'plainly'], pos: 'ADV' },
  { word: 'however', synonyms: ['nevertheless', 'nonetheless'], pos: 'ADV' },
  { word: 'therefore', synonyms: ['consequently', 'thus', 'hence'], pos: 'ADV' },
  { word: 'because', synonyms: ['since', 'as'], pos: 'CONJ' },
  { word: 'but', synonyms: ['however', 'yet'], pos: 'CONJ' },
  { word: 'about', synonyms: ['regarding', 'concerning'], pos: 'PREP' },
];

let _cachedSynonymMap: Map<string, SynonymEntry> | null = null;

export function buildSynonymMap(): Map<string, SynonymEntry> {
  if (_cachedSynonymMap) {
    return _cachedSynonymMap;
  }
  const map = new Map<string, SynonymEntry>();
  for (const entry of SYNONYM_DATABASE) {
    map.set(entry.word.toLowerCase(), entry);
  }
  _cachedSynonymMap = map;
  return map;
}

/**
 * Apply English inflection rules to transform a base lemma
 */
export function inflect(lemma: string, form: 's' | 'ed' | 'ing' | 'ly'): string {
  if (form === 'ing') {
    if (lemma.endsWith('ie')) return lemma.slice(0, -2) + 'ying';
    if (lemma.endsWith('e') && !lemma.endsWith('ee')) return lemma.slice(0, -1) + 'ing';
    return lemma + 'ing';
  }

  if (form === 'ed') {
    if (lemma.endsWith('e')) return lemma + 'd';
    if (lemma.endsWith('y') && !/[aeiou]y$/.test(lemma)) return lemma.slice(0, -1) + 'ied';
    return lemma + 'ed';
  }

  if (form === 's') {
    if (lemma.endsWith('s') || lemma.endsWith('sh') || lemma.endsWith('ch') || lemma.endsWith('x') || lemma.endsWith('z')) {
      return lemma + 'es';
    }
    if (lemma.endsWith('y') && !/[aeiou]y$/.test(lemma)) return lemma.slice(0, -1) + 'ies';
    return lemma + 's';
  }

  if (form === 'ly') {
    if (lemma.endsWith('le')) return lemma.slice(0, -1) + 'y';
    if (lemma.endsWith('y')) return lemma.slice(0, -1) + 'ily';
    if (lemma.endsWith('ic')) return lemma + 'ally';
    return lemma + 'ly';
  }

  return lemma;
}

/**
 * Identify potential lemma stems and morphological forms
 */
function getStemCandidates(word: string): Array<{ stem: string; form: 's' | 'ed' | 'ing' | 'ly' }> {
  const candidates: Array<{ stem: string; form: 's' | 'ed' | 'ing' | 'ly' }> = [];
  const lower = word.toLowerCase();

  if (lower.endsWith('ing') && lower.length > 5) {
    const raw = lower.slice(0, -3);
    candidates.push({ stem: raw, form: 'ing' });
    candidates.push({ stem: raw + 'e', form: 'ing' });
  }

  if (lower.endsWith('ed') && lower.length > 4) {
    if (lower.endsWith('ied')) {
      candidates.push({ stem: lower.slice(0, -3) + 'y', form: 'ed' });
    }
    candidates.push({ stem: lower.slice(0, -1), form: 'ed' }); // -d
    candidates.push({ stem: lower.slice(0, -2), form: 'ed' }); // -ed
  }

  if (lower.endsWith('s') && lower.length > 3) {
    if (lower.endsWith('ies')) {
      candidates.push({ stem: lower.slice(0, -3) + 'y', form: 's' });
    } else if (lower.endsWith('es')) {
      candidates.push({ stem: lower.slice(0, -2), form: 's' });
    }
    candidates.push({ stem: lower.slice(0, -1), form: 's' });
  }

  if (lower.endsWith('ly') && lower.length > 4) {
    if (lower.endsWith('ily')) {
      candidates.push({ stem: lower.slice(0, -3) + 'y', form: 'ly' });
    }
    candidates.push({ stem: lower.slice(0, -2), form: 'ly' });
    candidates.push({ stem: lower.slice(0, -2) + 'e', form: 'ly' }); // remarkable -> remarkably
  }

  return candidates;
}

/**
 * Get synonyms for a word, with automatic morphological derivation
 */
export function getSynonyms(word: string): string[] {
  const entry = getSynonymEntry(word);
  return entry ? entry.synonyms : [];
}

export function hasSynonyms(word: string): boolean {
  return getSynonymEntry(word) !== null;
}

/**
 * Retrieve synonym entry with automatic inflection synthesis
 */
export function getSynonymEntry(word: string): SynonymEntry | null {
  const map = buildSynonymMap();
  const lower = word.toLowerCase();

  // 1. Direct match
  const direct = map.get(lower);
  if (direct) {
    return direct;
  }

  // 2. Morphological stem matching
  const candidates = getStemCandidates(lower);
  for (const { stem, form } of candidates) {
    const entry = map.get(stem);
    if (entry && entry.synonyms.length > 0) {
      // Inflect all synonyms to match source word's form
      const inflectedSynonyms = entry.synonyms.map(syn => inflect(syn, form));
      return {
        word: lower,
        synonyms: inflectedSynonyms,
        pos: entry.pos,
        register: entry.register,
      };
    }
  }

  return null;
}
