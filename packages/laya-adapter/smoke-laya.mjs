import { Laya } from "@receptron/laya";

const t0 = Date.now();
const laya = await Laya.load({ modelDir: "./models/laya" });
console.log(`load: ${Date.now() - t0}ms`);

const t1 = Date.now();
const result = await laya.systemOne(
  { subject: "Rewrite planning", body: "The committee has decided not to approve the proposal because it was absolutely inadequate and furthermore completely unnecessary in all respects." },
  {
    strategy: {
      type: "choice",
      instructions: "Which rewrite strategy best improves this sentence?",
      criteria: {
        lexical: "replace words with synonyms",
        compression: "compress verbose phrasing",
        structural: "restructure clauses or change voice",
        minimal: "leave nearly unchanged",
      },
    },
    verbosity: {
      type: "score",
      instructions: "How verbose is the sentence?",
      criteria: ["terse", "appropriate", "somewhat verbose", "very verbose"],
    },
    passive: {
      type: "noul",
      instructions: "Is the sentence overly wordy overall?",
    },
  }
);
console.log(`inference: ${Date.now() - t1}ms`);
console.log(JSON.stringify(result, null, 2));
await laya.close();
