/**
 * Local Tone Analyzer
 * 
 * Extracts measurable linguistic signals across multiple stylistic dimensions:
 * formal, casual, professional, confident, uncertain, academic, technical.
 */

export interface ToneSignals {
  formal: number; // 0-1
  casual: number; // 0-1
  professional: number; // 0-1
  confident: number; // 0-1
  uncertain: number; // 0-1
  academic: number; // 0-1
  technical: number; // 0-1
  dominantTone: string;
}

export class ToneAnalyzer {
  private static readonly CONFIDENT_MARKERS = new Set([
    'definitely', 'certainly', 'undoubtedly', 'clearly', 'conclusive',
    'demonstrates', 'proves', 'always', 'guaranteed', 'essential', 'vital',
  ]);

  private static readonly UNCERTAIN_MARKERS = new Set([
    'maybe', 'perhaps', 'possibly', 'might', 'could', 'suggests',
    'seems', 'appears', 'unlikely', 'uncertain', 'tentative', 'hypothetically',
  ]);

  private static readonly CASUAL_MARKERS = new Set([
    'gonna', 'wanna', 'yeah', 'cool', 'awesome', 'guy', 'guys',
    'ok', 'okay', 'stuff', 'things', 'pretty', 'huge', 'super', 'yep', 'nope',
  ]);

  private static readonly ACADEMIC_MARKERS = new Set([
    'consequently', 'furthermore', 'methodology', 'empirical', 'hypothesis',
    'correlation', 'quantitative', 'qualitative', 'literature', 'exhibit',
    'parameter', 'paradigm', 'synthesize', 'subsequently', 'thus',
  ]);

  private static readonly TECHNICAL_MARKERS = new Set([
    'api', 'algorithm', 'database', 'asynchronous', 'memory', 'cpu',
    'throughput', 'latency', 'interface', 'compiler', 'protocol', 'schema',
    'parameter', 'runtime', 'architecture', 'function', 'class',
  ]);

  /**
   * Analyze measurable tone signals
   */
  analyze(text: string): ToneSignals {
    const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const totalWords = Math.max(1, words.length);

    let confidentCount = 0;
    let uncertainCount = 0;
    let casualCount = 0;
    let academicCount = 0;
    let technicalCount = 0;
    let contractions = 0;

    for (const w of words) {
      if (ToneAnalyzer.CONFIDENT_MARKERS.has(w)) confidentCount++;
      if (ToneAnalyzer.UNCERTAIN_MARKERS.has(w)) uncertainCount++;
      if (ToneAnalyzer.CASUAL_MARKERS.has(w)) casualCount++;
      if (ToneAnalyzer.ACADEMIC_MARKERS.has(w)) academicCount++;
      if (ToneAnalyzer.TECHNICAL_MARKERS.has(w)) technicalCount++;
      if (w.includes("'")) contractions++;
    }

    // Scale scores relative to expected densities (normalized to 0-1)
    const confident = Math.min(1.0, (confidentCount / totalWords) * 15);
    const uncertain = Math.min(1.0, (uncertainCount / totalWords) * 15);
    const casual = Math.min(1.0, (casualCount / totalWords) * 20 + (contractions / totalWords) * 5);
    const academic = Math.min(1.0, (academicCount / totalWords) * 15);
    const technical = Math.min(1.0, (technicalCount / totalWords) * 15);

    // Formal is inverse of casual, boosted by academic
    const formal = Math.max(0.0, Math.min(1.0, 0.5 + academic * 0.3 - casual * 0.4));
    // Professional is balanced between formal and direct
    const professional = Math.max(0.0, Math.min(1.0, 0.4 + (1 - casual) * 0.3 + (1 - uncertain) * 0.2));

    const dimensions: Record<string, number> = {
      formal,
      casual,
      professional,
      confident,
      uncertain,
      academic,
      technical,
    };

    let dominantTone = 'professional';
    let maxVal = -1;
    for (const [tone, val] of Object.entries(dimensions)) {
      if (val > maxVal) {
        maxVal = val;
        dominantTone = tone;
      }
    }

    return {
      formal: Math.round(formal * 100) / 100,
      casual: Math.round(casual * 100) / 100,
      professional: Math.round(professional * 100) / 100,
      confident: Math.round(confident * 100) / 100,
      uncertain: Math.round(uncertain * 100) / 100,
      academic: Math.round(academic * 100) / 100,
      technical: Math.round(technical * 100) / 100,
      dominantTone,
    };
  }
}

export function createToneAnalyzer(): ToneAnalyzer {
  return new ToneAnalyzer();
}
