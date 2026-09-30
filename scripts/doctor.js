#!/usr/bin/env node

/**
 * Riri Doctor - System Health Check
 * 
 * Verifies that all components are properly installed and configured.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const MODELS_DIR = join(PROJECT_ROOT, 'models', 'laya');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function check(name, passed, details = '') {
  const status = passed ? '✓' : '✗';
  const statusColor = passed ? 'green' : 'red';
  const message = details ? `${name} ... ${details}` : name;
  log(`  ${status} ${message}`, statusColor);
  return passed;
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

async function checkNode() {
  log('\n📦 Node.js Environment', 'bright');
  
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  check('Node.js Version', nodeMajor >= 20, nodeVersion);
  
  const npmVersion = exec('npm --version');
  check('npm', npmVersion !== null, npmVersion || 'not found');
  
  const pnpmVersion = exec('pnpm --version');
  check('pnpm', pnpmVersion !== null, pnpmVersion || 'not found');
  
  return nodeMajor >= 20;
}

async function checkPython() {
  log('\n🐍 Python Environment', 'bright');
  
  const pythonVersion = exec('python --version');
  check('Python', pythonVersion !== null, pythonVersion || 'not found');
  
  const pipVersion = exec('pip --version');
  check('pip', pipVersion !== null, pipVersion ? 'installed' : 'not found');
  
  // Check for ONNX packages
  const onnxInstalled = exec('pip show onnx');
  check('onnx package', onnxInstalled !== null, onnxInstalled ? 'installed' : 'not installed');
  
  const onnxruntimeInstalled = exec('pip show onnxruntime');
  check('onnxruntime package', onnxruntimeInstalled !== null, onnxruntimeInstalled ? 'installed' : 'not installed');
  
  return pythonVersion !== null;
}

async function checkONNXRuntime() {
  log('\n⚙️  ONNX Runtime', 'bright');
  
  try {
    // Check if onnxruntime-node is installed
    const packageJsonPath = join(PROJECT_ROOT, 'node_modules', 'onnxruntime-node', 'package.json');
    if (!existsSync(packageJsonPath)) {
      check('onnxruntime-node', false, 'not installed');
      return false;
    }
    
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    check('onnxruntime-node', true, `v${packageJson.version}`);
    
    // Try to require it
    try {
      await import('onnxruntime-node');
      check('ONNX Runtime loads', true);
      check('CPU Provider', true, 'available');
      return true;
    } catch (error) {
      check('ONNX Runtime loads', false, error.message);
      return false;
    }
  } catch (error) {
    check('onnxruntime-node', false, error.message);
    return false;
  }
}

async function checkLayaModel() {
  log('\n🤖 Laya Model', 'bright');
  
  const manifestPath = join(MODELS_DIR, 'manifest.json');
  if (!existsSync(manifestPath)) {
    check('Model Downloaded', false, 'Run: pnpm model:download');
    return false;
  }
  
  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    check('Manifest', true, manifest.name);
    
    const requiredFiles = [
      'laya.onnx',
      'laya.onnx.data',
      'laya_config.json',
      'tokenizer/tokenizer.json',
      'tokenizer/tokenizer_config.json'
    ];
    
    let allFilesPresent = true;
    for (const file of requiredFiles) {
      const filePath = join(MODELS_DIR, file);
      const exists = existsSync(filePath);
      if (!exists) {
        check(file, false, 'missing');
        allFilesPresent = false;
      }
    }
    
    if (allFilesPresent) {
      check('Model Files', true, 'all present');
    }
    
    // Check quantized model
    const quantizedPath = join(MODELS_DIR, 'laya_int8.onnx');
    const quantizedExists = existsSync(quantizedPath);
    check('Quantized Model (INT8)', quantizedExists, quantizedExists ? 'ready' : 'Run: pnpm model:quantize');
    
    return allFilesPresent;
  } catch (error) {
    check('Manifest', false, error.message);
    return false;
  }
}

async function checkPackages() {
  log('\n📚 Riri Packages', 'bright');
  
  const packages = [
    '@riri/types',
    '@riri/model-runtime',
    '@riri/laya-adapter'
  ];
  
  let allBuilt = true;
  for (const pkg of packages) {
    const distPath = join(PROJECT_ROOT, 'packages', pkg.replace('@riri/', ''), 'dist');
    const built = existsSync(distPath);
    check(pkg, built, built ? 'built' : 'not built');
    if (!built) allBuilt = false;
  }
  
  if (!allBuilt) {
    log('  Run: pnpm build', 'yellow');
  }
  
  return allBuilt;
}

async function checkSystem() {
  log('\n💻 System Information', 'bright');
  
  const platform = process.platform;
  const arch = process.arch;
  check('Operating System', true, `${platform} ${arch}`);
  
  const cpus = os.cpus()?.length || 'unknown';
  check('CPU Cores', true, `${cpus}`);
  
  const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
  const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
  check('Memory', true, `${totalMem} GB total, ${freeMem} GB free`);
  
  return true;
}

async function main() {
  log('\n' + '='.repeat(50), 'bright');
  log('  Riri Doctor - System Health Check', 'bright');
  log('='.repeat(50), 'bright');
  
  const results = {
    node: await checkNode(),
    python: await checkPython(),
    onnx: await checkONNXRuntime(),
    model: await checkLayaModel(),
    packages: await checkPackages(),
    system: await checkSystem()
  };
  
  log('\n' + '='.repeat(50), 'bright');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    log('  ✅ All checks passed!', 'green');
    log('  Riri is ready to use.', 'green');
  } else {
    log('  ⚠️  Some checks failed', 'yellow');
    log('  Review the issues above and follow the suggestions.', 'yellow');
    
    log('\nCommon fixes:', 'cyan');
    if (!results.model) {
      log('  - Download model: pnpm model:download', 'cyan');
      log('  - Quantize model: pnpm model:quantize', 'cyan');
    }
    if (!results.packages) {
      log('  - Build packages: pnpm build', 'cyan');
    }
    if (!results.onnx) {
      log('  - Install deps: pnpm install', 'cyan');
      log('  - Rebuild: pnpm rebuild onnxruntime-node', 'cyan');
    }
    if (!results.python) {
      log('  - Install Python 3.12+', 'cyan');
      log('  - Install packages: pip install onnx onnxruntime', 'cyan');
    }
  }
  
  log('='.repeat(50) + '\n', 'bright');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Doctor check failed: ${error.message}`, 'red');
  process.exit(1);
});
