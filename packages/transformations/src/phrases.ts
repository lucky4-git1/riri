/**
 * Phrase Substitution Database
 * 
 * Common verbose phrases that can be replaced with more concise alternatives.
 */

export interface PhraseSubstitution {
  pattern: RegExp;
  replacement: string;
  description: string;
  register?: 'formal' | 'neutral' | 'informal';
}

/**
 * Phrase substitution patterns
 * Ordered by priority (more specific patterns first)
 */
export const PHRASE_SUBSTITUTIONS: PhraseSubstitution[] = [
  // Academic transitions and predicates
  {
    pattern: /\bin addition to\b/gi,
    replacement: 'along with',
    description: 'Additive transition simplification',
    register: 'neutral',
  },
  {
    pattern: /\bis remarkably successful in\b/gi,
    replacement: 'is exceptionally effective at',
    description: 'Predicate simplification',
    register: 'neutral',
  },
  {
    pattern: /\bis quite successful in\b/gi,
    replacement: 'is highly effective at',
    description: 'Predicate simplification',
    register: 'neutral',
  },
  {
    pattern: /\bis successful in\b/gi,
    replacement: 'is effective at',
    description: 'Predicate simplification',
    register: 'neutral',
  },
  {
    pattern: /\bon the route to\b/gi,
    replacement: 'progressing toward',
    description: 'Idiomatic simplification',
    register: 'neutral',
  },
  {
    pattern: /\bon the path to\b/gi,
    replacement: 'leading to',
    description: 'Idiomatic simplification',
    register: 'neutral',
  },
  {
    pattern: /\bare briefly explained\b/gi,
    replacement: 'are outlined',
    description: 'Expository simplification',
    register: 'neutral',
  },
  {
    pattern: /\bre-establishing\b/gi,
    replacement: 'restoring',
    description: 'Prefix simplification',
    register: 'neutral',
  },
  // Verbose temporal expressions
  {
    pattern: /\bat this point in time\b/gi,
    replacement: 'now',
    description: 'Temporal redundancy',
    register: 'formal',
  },
  {
    pattern: /\bin the event that\b/gi,
    replacement: 'if',
    description: 'Conditional simplification',
    register: 'formal',
  },
  {
    pattern: /\bprior to\b/gi,
    replacement: 'before',
    description: 'Temporal simplification',
    register: 'neutral',
  },
  {
    pattern: /\bsubsequent to\b/gi,
    replacement: 'after',
    description: 'Temporal simplification',
    register: 'neutral',
  },
  {
    pattern: /\bat the present time\b/gi,
    replacement: 'currently',
    description: 'Temporal redundancy',
    register: 'formal',
  },
  
  // Causality and reasoning
  {
    pattern: /\bdue to the fact that\b/gi,
    replacement: 'because',
    description: 'Causal simplification',
    register: 'formal',
  },
  {
    pattern: /\bin light of the fact that\b/gi,
    replacement: 'because',
    description: 'Causal simplification',
    register: 'formal',
  },
  {
    pattern: /\bfor the reason that\b/gi,
    replacement: 'because',
    description: 'Causal simplification',
    register: 'formal',
  },
  {
    pattern: /\bowing to the fact that\b/gi,
    replacement: 'because',
    description: 'Causal simplification',
    register: 'formal',
  },
  {
    pattern: /\bin order to\b/gi,
    replacement: 'to',
    description: 'Purpose simplification',
    register: 'neutral',
  },
  {
    pattern: /\bfor the purpose of\b/gi,
    replacement: 'to',
    description: 'Purpose simplification',
    register: 'formal',
  },
  {
    pattern: /\bwith the aim of\b/gi,
    replacement: 'to',
    description: 'Purpose simplification',
    register: 'formal',
  },
  
  // Conditional and possibility
  {
    pattern: /\bin the case that\b/gi,
    replacement: 'if',
    description: 'Conditional simplification',
    register: 'formal',
  },
  {
    pattern: /\bin the situation where\b/gi,
    replacement: 'when',
    description: 'Conditional simplification',
    register: 'formal',
  },
  {
    pattern: /\bhas the ability to\b/gi,
    replacement: 'can',
    description: 'Ability simplification',
    register: 'neutral',
  },
  {
    pattern: /\bis able to\b/gi,
    replacement: 'can',
    description: 'Ability simplification',
    register: 'neutral',
  },
  {
    pattern: /\bhas the capacity to\b/gi,
    replacement: 'can',
    description: 'Ability simplification',
    register: 'neutral',
  },
  
  // Comparison and contrast
  {
    pattern: /\bis similar to\b/gi,
    replacement: 'resembles',
    description: 'Comparison simplification',
    register: 'neutral',
  },
  {
    pattern: /\bin a similar manner\b/gi,
    replacement: 'similarly',
    description: 'Comparison simplification',
    register: 'neutral',
  },
  {
    pattern: /\bin the same way\b/gi,
    replacement: 'similarly',
    description: 'Comparison simplification',
    register: 'neutral',
  },
  {
    pattern: /\bin contrast to\b/gi,
    replacement: 'unlike',
    description: 'Contrast simplification',
    register: 'neutral',
  },
  
  // Modality and degree
  {
    pattern: /\ba large number of\b/gi,
    replacement: 'many',
    description: 'Quantity simplification',
    register: 'neutral',
  },
  {
    pattern: /\ba great deal of\b/gi,
    replacement: 'much',
    description: 'Quantity simplification',
    register: 'neutral',
  },
  {
    pattern: /\ba small number of\b/gi,
    replacement: 'few',
    description: 'Quantity simplification',
    register: 'neutral',
  },
  {
    pattern: /\bon a regular basis\b/gi,
    replacement: 'regularly',
    description: 'Frequency simplification',
    register: 'neutral',
  },
  {
    pattern: /\bon a daily basis\b/gi,
    replacement: 'daily',
    description: 'Frequency simplification',
    register: 'neutral',
  },
  
  // Location and position
  {
    pattern: /\bin close proximity to\b/gi,
    replacement: 'near',
    description: 'Location simplification',
    register: 'formal',
  },
  {
    pattern: /\bin the vicinity of\b/gi,
    replacement: 'near',
    description: 'Location simplification',
    register: 'formal',
  },
  
  // Reference and relation
  {
    pattern: /\bwith regard to\b/gi,
    replacement: 'regarding',
    description: 'Reference simplification',
    register: 'formal',
  },
  {
    pattern: /\bwith reference to\b/gi,
    replacement: 'regarding',
    description: 'Reference simplification',
    register: 'formal',
  },
  {
    pattern: /\bin regard to\b/gi,
    replacement: 'regarding',
    description: 'Reference simplification',
    register: 'formal',
  },
  {
    pattern: /\bwith respect to\b/gi,
    replacement: 'regarding',
    description: 'Reference simplification',
    register: 'formal',
  },
  {
    pattern: /\bconcerning the matter of\b/gi,
    replacement: 'about',
    description: 'Reference simplification',
    register: 'formal',
  },
  
  // Action and process
  {
    pattern: /\bmake use of\b/gi,
    replacement: 'use',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bput into effect\b/gi,
    replacement: 'implement',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bcome to an end\b/gi,
    replacement: 'end',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\btake into consideration\b/gi,
    replacement: 'consider',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bgive consideration to\b/gi,
    replacement: 'consider',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bmake a decision\b/gi,
    replacement: 'decide',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bcome to a conclusion\b/gi,
    replacement: 'conclude',
    description: 'Action simplification',
    register: 'neutral',
  },
  {
    pattern: /\bcarry out\b/gi,
    replacement: 'perform',
    description: 'Action simplification',
    register: 'neutral',
  },
  
  // Existence and state
  {
    pattern: /\bthere is a need for\b/gi,
    replacement: 'need',
    description: 'Existential simplification',
    register: 'neutral',
  },
  {
    pattern: /\bit is important to note that\b/gi,
    replacement: 'notably',
    description: 'Attention marker simplification',
    register: 'formal',
  },
  {
    pattern: /\bit should be noted that\b/gi,
    replacement: 'note that',
    description: 'Attention marker simplification',
    register: 'formal',
  },
  {
    pattern: /\bit is clear that\b/gi,
    replacement: 'clearly',
    description: 'Clarity marker simplification',
    register: 'neutral',
  },
];

/**
 * Apply phrase substitutions to text
 * Returns modified text and list of applied substitutions
 */
export function applyPhraseSubstitutions(
  text: string,
  maxSubstitutions: number = 3
): {
  text: string;
  substitutions: Array<{ original: string; replacement: string; position: number }>;
} {
  let modifiedText = text;
  const substitutions: Array<{ original: string; replacement: string; position: number }> = [];
  let appliedCount = 0;
  
  for (const sub of PHRASE_SUBSTITUTIONS) {
    if (appliedCount >= maxSubstitutions) break;
    
    const matches = [...modifiedText.matchAll(sub.pattern)];
    
    for (const match of matches) {
      if (appliedCount >= maxSubstitutions) break;
      if (match.index === undefined) continue;
      
      substitutions.push({
        original: match[0],
        replacement: sub.replacement,
        position: match.index,
      });
      
      modifiedText = 
        modifiedText.substring(0, match.index) + 
        sub.replacement + 
        modifiedText.substring(match.index + match[0].length);
      appliedCount++;
    }
  }
  
  return { text: modifiedText, substitutions };
}

/**
 * Find verbose phrases in text without applying substitutions
 */
export function findVerbosePhrases(text: string): Array<{
  phrase: string;
  position: number;
  suggestion: string;
}> {
  const findings: Array<{ phrase: string; position: number; suggestion: string }> = [];
  
  for (const sub of PHRASE_SUBSTITUTIONS) {
    const matches = [...text.matchAll(sub.pattern)];
    
    for (const match of matches) {
      if (match.index !== undefined) {
        findings.push({
          phrase: match[0],
          position: match.index,
          suggestion: sub.replacement,
        });
      }
    }
  }
  
  return findings.sort((a, b) => a.position - b.position);
}
