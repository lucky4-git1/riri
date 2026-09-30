import { createRiri } from './packages/core/dist/index.js';

const riri = createRiri();
const text = 'The committee has decided to not approve the proposal due to the fact that it was absolutely inadequate and furthermore completely unnecessary in all respects.';

console.log('=== PARSE ===');
const parsed = riri.parse(text);
console.log('Sentences:', parsed.sentences.length);
console.log('Protected spans:', parsed.protectedSpans.length);

console.log('\n=== ANALYZE ===');
const analyzed = await riri.analyze(text);
console.log('Features:', JSON.stringify(analyzed.features, null, 2));

console.log('\n=== GRAMMAR ===');
const grammar = await riri.grammar(text);
console.log('Issues:', grammar.issues.length, grammar.issues);

console.log('\n=== READABILITY ===');
const readability = await riri.readability(text);
console.log(JSON.stringify(readability, null, 2));

console.log('\n=== TONE ===');
const tone = await riri.tone(text);
console.log(JSON.stringify(tone, null, 2));

console.log('\n=== SUMMARIZE ===');
const longText = text + ' ' + text + ' The results were mixed. Some improvements were observed. Others were not. In conclusion, more research is needed.';
const summary = await riri.summarize(longText, { maxSentences: 2 });
console.log('Summary:', summary.summary);

console.log('\n=== REWRITE MODES ===');
for (const mode of ['standard', 'formal', 'simple', 'concise', 'academic', 'creative']) {
  const result = await riri.rewrite(text, { mode, aggressiveness: 0.7 });
  console.log(`[${mode}] ${result.text}`);
  console.log(`  -> applied: ${result.transformations.length}, candidates: ${result.metadata.candidatesGenerated}`);
}
