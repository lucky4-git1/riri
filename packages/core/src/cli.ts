#!/usr/bin/env node

/**
 * Riri CLI & Interactive Testing Harness
 * 
 * Provides both command-line one-off operations and an interactive REPL
 * for testing writing intelligence capabilities.
 */

import * as readline from 'node:readline';
import { createRiri } from './index.js';
import type { WritingMode } from '@riri/types';

const riri = createRiri();

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function banner() {
  console.log(`
${COLORS.cyan}${COLORS.bold}=======================================================
   🌸 RIRI — Local Writing Intelligence Engine
   CPU-first • Sub-millisecond • Privacy-preserving
=======================================================${COLORS.reset}`);
}

function printHelp() {
  console.log(`
${COLORS.bold}USAGE:${COLORS.reset}
  node packages/core/dist/cli.js [command|text] [options]

${COLORS.bold}COMMANDS:${COLORS.reset}
  (none) / repl        Start interactive testing REPL
  rewrite <text>       Paraphrase & rewrite text (default)
  grammar <text>       Proofread grammar, spelling, and punctuation
  readability <text>   Analyze Flesch-Kincaid & grade level
  tone <text>          Analyze multi-dimensional tone signals
  summarize <text>     Extractive text summarization

${COLORS.bold}OPTIONS:${COLORS.reset}
  -m, --mode <mode>         standard | formal | simple | concise | academic | creative | fluency | professional (default: standard)
  -a, --aggressiveness <num> 0.1 to 1.0 (default: 0.5)
  -f, --freeze <words>      Comma-separated list of words/phrases to lock
  -h, --help                Show this help message

${COLORS.bold}EXAMPLES:${COLORS.reset}
  pnpm cli
  pnpm cli "She wanna grab a lot of stuff from the store." --mode formal
  pnpm cli grammar "She dont have no time for this."
  pnpm cli readability "Quantum electrodynamics presents significant challenges."
`);
}

function parseArgs(args: string[]) {
  const options: {
    command?: string;
    text?: string;
    mode: WritingMode;
    aggressiveness: number;
    freezeWords: string[];
  } = {
    mode: 'standard',
    aggressiveness: 0.5,
    freezeWords: [],
  };

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-m' || arg === '--mode') {
      options.mode = (args[++i] || 'standard') as WritingMode;
    } else if (arg === '-a' || arg === '--aggressiveness') {
      options.aggressiveness = parseFloat(args[++i] || '0.5');
    } else if (arg === '-f' || arg === '--freeze') {
      const words = args[++i] || '';
      options.freezeWords = words.split(',').map(w => w.trim()).filter(Boolean);
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    const first = positional[0].toLowerCase();
    if (['grammar', 'readability', 'tone', 'summarize', 'rewrite', 'repl'].includes(first)) {
      options.command = first;
      options.text = positional.slice(1).join(' ');
    } else {
      options.command = 'rewrite';
      options.text = positional.join(' ');
    }
  }

  return options;
}

async function handleCommand(command: string, text: string, options: any) {
  if (!text || text.trim().length === 0) {
    console.log(`${COLORS.red}Error: Please provide text to process.${COLORS.reset}`);
    return;
  }

  switch (command) {
    case 'grammar': {
      console.log(`\n${COLORS.cyan}${COLORS.bold}🔍 Grammar & Proofread Analysis:${COLORS.reset}`);
      const result = await riri.grammar(text);
      console.log(`Input:   ${text}`);
      const hasIssues = result.issues.length > 0;
      console.log(`Status:  ${!hasIssues ? `${COLORS.green}✓ No issues detected${COLORS.reset}` : `${COLORS.yellow}⚠ ${result.issues.length} issue(s) found (${result.errorCount} error(s))${COLORS.reset}`}`);
      if (result.issues.length > 0) {
        console.log('\nIssues:');
        for (const issue of result.issues) {
          const excerpt = text.substring(issue.offset, issue.offset + issue.length);
          console.log(`  - [${issue.type.toUpperCase()}] "${excerpt}" ➔ "${issue.suggestion}" (${issue.explanation})`);
        }
      }
      break;
    }

    case 'readability': {
      console.log(`\n${COLORS.cyan}${COLORS.bold}📊 Readability Metrics:${COLORS.reset}`);
      const metrics = await riri.readability(text);
      console.log(`Flesch Reading Ease:    ${COLORS.bold}${metrics.fleschReadingEase}/100${COLORS.reset}`);
      console.log(`Flesch-Kincaid Grade:   ${COLORS.bold}Grade ${metrics.fleschKincaidGrade}${COLORS.reset}`);
      console.log(`Reading Level:          ${COLORS.green}${metrics.readingLevel}${COLORS.reset}`);
      console.log(`Word Count:             ${metrics.wordCount}`);
      console.log(`Sentence Count:         ${metrics.sentenceCount}`);
      console.log(`Avg Sentence Length:    ${metrics.averageSentenceLength.toFixed(1)} words`);
      console.log(`Complex Word Ratio:     ${(metrics.complexWordRatio * 100).toFixed(1)}%`);
      break;
    }

    case 'tone': {
      console.log(`\n${COLORS.cyan}${COLORS.bold}🎭 Tone Analysis:${COLORS.reset}`);
      const signals = await riri.tone(text);
      console.log(`Dominant Tone: ${COLORS.green}${COLORS.bold}${signals.dominantTone.toUpperCase()}${COLORS.reset}`);
      console.log('Signals:');
      const entries: Array<[string, number]> = [
        ['Professional', signals.professional],
        ['Formal', signals.formal],
        ['Academic', signals.academic],
        ['Casual', signals.casual],
        ['Confident', signals.confident],
        ['Uncertain', signals.uncertain],
        ['Technical', signals.technical],
      ];
      for (const [name, score] of entries) {
        const bar = '█'.repeat(Math.round(score * 15)) + '░'.repeat(15 - Math.round(score * 15));
        console.log(`  ${name.padEnd(14)} [${bar}] ${(score * 100).toFixed(0)}%`);
      }
      break;
    }

    case 'summarize': {
      console.log(`\n${COLORS.cyan}${COLORS.bold}📝 Extractive Summary:${COLORS.reset}`);
      const summary = await riri.summarize(text, { maxSentences: 2 });
      console.log(`Original: ${text.length} chars, ${text.split(/\s+/).length} words`);
      console.log(`Summary:  ${summary.summary}`);
      console.log(`Ratio:    ${(summary.compressionRatio * 100).toFixed(1)}% compression`);
      break;
    }

    case 'rewrite':
    default: {
      console.log(`\n${COLORS.cyan}${COLORS.bold}🔄 Rewrite Pipeline (${options.mode} mode, aggressiveness: ${options.aggressiveness}):${COLORS.reset}`);
      const startTime = performance.now();
      const result = await riri.rewrite(text, {
        mode: options.mode,
        aggressiveness: options.aggressiveness,
        freezeWords: options.freezeWords,
      });
      const elapsed = (performance.now() - startTime).toFixed(1);

      console.log(`\n${COLORS.bold}Original:${COLORS.reset}  ${result.original}`);
      console.log(`${COLORS.bold}${COLORS.green}Rewritten:${COLORS.reset} ${result.text}`);

      if (result.transformations.length > 0) {
        console.log(`\n${COLORS.dim}Transformations applied (${result.transformations.length}):${COLORS.reset}`);
        for (const t of result.transformations) {
          console.log(`  • ${COLORS.yellow}${t.name}${COLORS.reset}`);
          for (const m of t.modifications) {
            console.log(`    ↳ "${m.original.text}" ➔ "${m.replacement}" ${COLORS.dim}(${m.reason})${COLORS.reset}`);
          }
        }
      } else {
        console.log(`\n${COLORS.yellow}ℹ No transformations met the quality/preservation threshold.${COLORS.reset}`);
      }

      if (result.warnings && result.warnings.length > 0) {
        for (const w of result.warnings) {
          console.log(`${COLORS.yellow}⚠ Warning: ${w}${COLORS.reset}`);
        }
      }

      console.log(`\n${COLORS.dim}Latency: ${elapsed}ms | Quality: ${(result.metrics.overallQuality * 100).toFixed(0)}% | Engine: ${result.metadata.decisionEngine}${COLORS.reset}`);
      break;
    }
  }
}

async function startREPL() {
  banner();
  console.log(`
Interactive Mode initialized. Type any text to rewrite, or use commands:
  ${COLORS.cyan}:mode <name>${COLORS.reset}       Switch mode (standard, formal, simple, concise, academic, creative)
  ${COLORS.cyan}:strength <0.1-1.0>${COLORS.reset} Adjust transformation aggressiveness
  ${COLORS.cyan}:freeze <words>${COLORS.reset}     Lock specific words or phrases (comma-separated)
  ${COLORS.cyan}:grammar <text>${COLORS.reset}     Run proofreader
  ${COLORS.cyan}:tone <text>${COLORS.reset}        Inspect tone signals
  ${COLORS.cyan}:read <text>${COLORS.reset}        Show readability metrics
  ${COLORS.cyan}:summary <text>${COLORS.reset}     Summarize text
  ${COLORS.cyan}:help${COLORS.reset}               Show help
  ${COLORS.cyan}:exit${COLORS.reset}               Quit REPL
`);

  let currentMode: WritingMode = 'standard';
  let currentStrength = 0.6;
  let currentFreeze: string[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${COLORS.bold}${COLORS.cyan}riri (${currentMode})>${COLORS.reset} `,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === ':exit' || input === ':quit' || input === 'exit' || input === 'quit') {
      console.log(`\nGoodbye! 👋\n`);
      process.exit(0);
    }

    if (input === ':help') {
      printHelp();
      rl.prompt();
      return;
    }

    if (input.startsWith(':mode')) {
      const mode = input.slice(5).trim().toLowerCase() as WritingMode;
      const validModes: WritingMode[] = ['standard', 'formal', 'simple', 'concise', 'academic', 'creative', 'fluency', 'professional'];
      if (validModes.includes(mode)) {
        currentMode = mode;
        console.log(`${COLORS.green}Mode switched to: ${currentMode}${COLORS.reset}`);
        rl.setPrompt(`${COLORS.bold}${COLORS.cyan}riri (${currentMode})>${COLORS.reset} `);
      } else {
        console.log(`${COLORS.red}Unknown mode. Valid modes: ${validModes.join(', ')}${COLORS.reset}`);
      }
      rl.prompt();
      return;
    }

    if (input.startsWith(':strength') || input.startsWith(':agg')) {
      const parts = input.split(/\s+/);
      const val = parseFloat(parts[1]);
      if (!isNaN(val) && val >= 0.1 && val <= 1.0) {
        currentStrength = val;
        console.log(`${COLORS.green}Aggressiveness set to: ${currentStrength}${COLORS.reset}`);
      } else {
        console.log(`${COLORS.red}Please specify a number between 0.1 and 1.0${COLORS.reset}`);
      }
      rl.prompt();
      return;
    }

    if (input.startsWith(':freeze')) {
      const rest = input.slice(7).trim();
      currentFreeze = rest ? rest.split(',').map(s => s.trim()).filter(Boolean) : [];
      console.log(`${COLORS.green}Freeze words: [${currentFreeze.join(', ')}]${COLORS.reset}`);
      rl.prompt();
      return;
    }

    if (input.startsWith(':grammar ')) {
      await handleCommand('grammar', input.slice(9), {});
      rl.prompt();
      return;
    }

    if (input.startsWith(':tone ')) {
      await handleCommand('tone', input.slice(6), {});
      rl.prompt();
      return;
    }

    if (input.startsWith(':read ')) {
      await handleCommand('readability', input.slice(6), {});
      rl.prompt();
      return;
    }

    if (input.startsWith(':summary ')) {
      await handleCommand('summarize', input.slice(9), {});
      rl.prompt();
      return;
    }

    // Default: Rewrite the sentence!
    await handleCommand('rewrite', input, {
      mode: currentMode,
      aggressiveness: currentStrength,
      freezeWords: currentFreeze,
    });

    console.log();
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nExiting Riri. Goodbye!\n');
    process.exit(0);
  });
}

// Main execution entry point
const args = process.argv.slice(2);
const parsed = parseArgs(args);

if (!parsed.command || parsed.command === 'repl') {
  startREPL();
} else {
  handleCommand(parsed.command, parsed.text || '', parsed).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(`${COLORS.red}Error:${COLORS.reset}`, err.message);
    process.exit(1);
  });
}
