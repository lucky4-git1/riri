import { createRiri } from './packages/core/dist/index.js';

const riri = createRiri({ decisionEngine: 'heuristic' });

const paragraph1 = `The primary objective of this investigation was to conduct a comprehensive analysis of the effectiveness of BASANT, a novel herbal formulation that combines extracts from barbadensis and Neem leaves along with 95% pure curcumin. The formulation comes in capsules that are simple to inject into the vagina and has been demonstrated to provide substantial protection against numerous genital pathogens. Numerous genital pathogens, including Neisseria gonorrhoeae, all WHO strains, and those resistant to different medicines such penicillin, tetracycline, nalidixic acid, and ciprofloxacin, are inhibited by BASANT [1].`;

const paragraph2 = `It had a strong inhibitory effect on three strains of Candida glabrata, Candida albicans, and Candida tropicalis that were isolated from women with vulvo-vaginal candidiasis and were resistant to amphotericin B and azole medications [1]. Chlamydia trachomatis, whether in the free-state or inside a cell, is inhibited by BASANT [2]. The results of this study demonstrate that BASANT is an effective treatment option for patients who are experiencing recurrent episodes of vaginal infection.`;

const paragraph3 = `Furthermore, it is absolutely necessary to conduct further clinical trials in order to facilitate the utilization of this formulation in mainstream medical practice. The committee has decided to not approve widespread clinical adoption due to the fact that the evidence base is currently inadequate for regulatory submission. The data suggests that the overall safety profile of BASANT is completely acceptable, and furthermore the tolerability data is entirely consistent with what was expected.`;

const paragraph4 = `In terms of therapeutic intervention, researchers made a decision to analyze the molecular mechanisms underlying cellular uptake. Taking into account the pharmacological properties of curcumin, it was observed that the delivery mechanism plays an important role in enhancing bioavailability. At the present moment, additional investigations are underway with respect to evaluating long-term outcomes in diverse patient cohorts.`;

const fullText = [paragraph1, paragraph2, paragraph3, paragraph4].join('\n\n');

console.log(`Testing text rewrite (${fullText.split(/\s+/).length} words)...\n`);

const t0 = performance.now();
const res = await riri.rewrite(fullText, { mode: 'academic', aggressiveness: 0.8 });
const latency = Math.round(performance.now() - t0);

console.log('=== REWRITE RESULTS ===');
console.log(`Latency: ${latency}ms`);
console.log(`Transformations applied: ${res.transformations.length}`);
console.log(`Warnings:`, res.warnings);
const totalMods = res.transformations.reduce((sum, t) => sum + t.modifications.length, 0);

console.log(`Total modifications: ${totalMods}\n`);

console.log('--- REWRITTEN OUTPUT ---');
console.log(res.text);

console.log('\n--- DETAILED MODIFICATIONS BY CATEGORY ---');
for (const t of res.transformations) {
  if (t.modifications.length > 0) {
    console.log(`\n[${t.name}] (${t.modifications.length} changes):`);
    for (const m of t.modifications) {
      console.log(`  • "${m.original.text}" ➔ "${m.replacement}" (${m.reason})`);
    }
  }
}

console.log('\nQuality Metrics:');
console.log(res.metrics);
