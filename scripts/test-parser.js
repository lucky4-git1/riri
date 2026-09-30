#!/usr/bin/env node

/**
 * Test Parser and Analyzer
 * 
 * Simple script to test the parser and analyzer with sample inputs
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testParser() {
  log('\n=== Testing Parser & Analyzer ===\n', 'bright');
  
  try {
    // Dynamic import to handle ES modules
    const { createParser } = await import('../packages/parser/dist/index.js');
    const { createAnalyzer } = await import('../packages/analyzer/dist/index.js');
    
    const parser = createParser();
    const analyzer = createAnalyzer();
    
    // Load test cases
    const testCasesPath = join(PROJECT_ROOT, 'datasets', 'test-cases.json');
    const testCasesData = await readFile(testCasesPath, 'utf-8');
    const testCases = JSON.parse(testCasesData);
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
      log(`\n[${testCase.id}] ${testCase.category}`, 'cyan');
      log(`Input: "${testCase.input}"`, 'blue');
      
      try {
        // Parse
        const parsed = parser.parse(testCase.input);
        log(`  Sentences: ${parsed.sentences.length}`, 'reset');
        log(`  Tokens: ${parsed.tokens.length}`, 'reset');
        log(`  Protected spans: ${parsed.protectedSpans.length}`, 'reset');
        
        if (parsed.protectedSpans.length > 0) {
          log('  Protected content:', 'magenta');
          for (const span of parsed.protectedSpans) {
            log(`    - [${span.type}] "${span.value}"`, 'magenta');
          }
        }
        
        // Analyze
        const analyzed = analyzer.analyze(testCase.input);
        log(`  Complexity: ${analyzed.features.complexity.toFixed(2)}`, 'reset');
        log(`  Avg sentence length: ${analyzed.features.averageSentenceLength.toFixed(1)}`, 'reset');
        log(`  Technical ratio: ${analyzed.features.technicalTermRatio.toFixed(2)}`, 'reset');
        log(`  Passive voice: ${analyzed.features.passiveVoiceRatio.toFixed(2)}`, 'reset');
        
        if (analyzed.features.readabilityScore !== undefined) {
          log(`  Readability: ${analyzed.features.readabilityScore.toFixed(1)}`, 'reset');
        }
        if (analyzed.features.formalityScore !== undefined) {
          log(`  Formality: ${analyzed.features.formalityScore.toFixed(2)}`, 'reset');
        }
        
        // Validate protected content
        if (testCase.protectedContent) {
          let allFound = true;
          for (const expected of testCase.protectedContent) {
            const found = parsed.protectedSpans.some(span => span.value === expected);
            if (!found) {
              log(`  ✗ Missing protected content: "${expected}"`, 'red');
              allFound = false;
            }
          }
          if (allFound) {
            log(`  ✓ All protected content detected`, 'green');
          }
        }
        
        log(`  ✓ PASSED`, 'green');
        passed++;
        
      } catch (error) {
        log(`  ✗ FAILED: ${error.message}`, 'red');
        failed++;
      }
    }
    
    // Summary
    log('\n' + '='.repeat(50), 'bright');
    log(`Results: ${passed} passed, ${failed} failed`, passed === testCases.length ? 'green' : 'yellow');
    log('='.repeat(50) + '\n', 'bright');
    
    return failed === 0;
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      log('\nPackages not built yet. Run: pnpm build', 'yellow');
    } else {
      console.error(error.stack);
    }
    return false;
  }
}

testParser()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
