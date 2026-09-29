#!/usr/bin/env node

/**
 * Laya Model Verification Script
 * 
 * Verifies the integrity and validity of downloaded Laya model files.
 */

import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function calculateSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function verifyFile(filePath, expectedHash = null) {
  if (!existsSync(filePath)) {
    return { exists: false, error: 'File not found' };
  }

  try {
    const stats = await stat(filePath);
    const actualHash = await calculateSHA256(filePath);
    
    const result = {
      exists: true,
      size: stats.size,
      sha256: actualHash,
      verified: true
    };

    if (expectedHash && expectedHash !== actualHash) {
      result.verified = false;
      result.error = 'SHA256 mismatch';
    }

    return result;
  } catch (error) {
    return {
      exists: true,
      verified: false,
      error: error.message
    };
  }
}

async function verifyONNXStructure(onnxPath) {
  try {
    // Basic ONNX file structure check (magic bytes)
    const buffer = await readFile(onnxPath);
    
    // ONNX files start with protobuf format indicator
    // Simple heuristic: check for "onnx" string in first 100 bytes
    const header = buffer.slice(0, 100).toString('utf-8', 0, 100);
    
    if (header.includes('onnx') || buffer[0] === 0x08) {
      return { valid: true };
    }
    
    return { valid: false, error: 'Invalid ONNX format' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function verifyJSON(jsonPath, requiredFields = []) {
  try {
    const content = await readFile(jsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing fields: ${missingFields.join(', ')}`
      };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function verifyModel() {
  log('\n=== Laya Model Verification ===\n', 'bright');

  // Check manifest
  const manifestPath = join(MODELS_DIR, 'manifest.json');
  
  if (!existsSync(manifestPath)) {
    log('❌ manifest.json not found', 'red');
    log('\nRun: pnpm model:download', 'yellow');
    return false;
  }

  let manifest;
  try {
    const content = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
    log('✓ Manifest loaded', 'green');
  } catch (error) {
    log(`❌ Invalid manifest: ${error.message}`, 'red');
    return false;
  }

  log(`\nModel: ${manifest.name}`, 'cyan');
  log(`Source: ${manifest.source}`, 'cyan');
  log(`Version: ${manifest.version}`, 'cyan');
  log(`Format: ${manifest.format}`, 'cyan');
  log(`Precision: ${manifest.precision}`, 'cyan');
  log(`Quantized: ${manifest.quantized ? 'Yes' : 'No'}`, 'cyan');
  log('');

  // Verify each file
  let totalSize = 0;
  let allValid = true;

  const filesToVerify = [
    { name: 'laya.onnx', type: 'onnx' },
    { name: 'laya.onnx.data', type: 'data' },
    { name: 'laya_config.json', type: 'json', requiredFields: ['max_len', 'head_max_len'] },
    { name: 'tokenizer/tokenizer.json', type: 'json' },
    { name: 'tokenizer/tokenizer_config.json', type: 'json' }
  ];

  for (const fileInfo of filesToVerify) {
    const filePath = join(MODELS_DIR, fileInfo.name);
    const expectedHash = manifest.files?.[fileInfo.name]?.sha256;
    
    log(`Verifying ${fileInfo.name}...`, 'cyan');
    
    const result = await verifyFile(filePath, expectedHash);
    
    if (!result.exists) {
      log(`  ❌ ${result.error}`, 'red');
      allValid = false;
      continue;
    }

    log(`  Size: ${formatBytes(result.size)}`, 'blue');
    log(`  SHA256: ${result.sha256.substring(0, 32)}...`, 'blue');
    
    if (expectedHash) {
      if (result.verified) {
        log(`  ✓ Checksum verified`, 'green');
      } else {
        log(`  ❌ Checksum mismatch!`, 'red');
        allValid = false;
      }
    }

    // Additional validation based on file type
    if (fileInfo.type === 'onnx') {
      const onnxCheck = await verifyONNXStructure(filePath);
      if (onnxCheck.valid) {
        log(`  ✓ ONNX format valid`, 'green');
      } else {
        log(`  ❌ ${onnxCheck.error}`, 'red');
        allValid = false;
      }
    } else if (fileInfo.type === 'json') {
      const jsonCheck = await verifyJSON(filePath, fileInfo.requiredFields || []);
      if (jsonCheck.valid) {
        log(`  ✓ JSON format valid`, 'green');
      } else {
        log(`  ❌ ${jsonCheck.error}`, 'red');
        allValid = false;
      }
    }

    totalSize += result.size;
    log('');
  }

  // Summary
  log('=== Verification Summary ===\n', 'bright');
  log(`Total size: ${formatBytes(totalSize)}`, 'cyan');
  
  if (allValid) {
    log('\n✅ All checks passed!', 'green');
    log('\nThe Laya model is ready to use.', 'green');
    log('\nNext steps:', 'yellow');
    log('  1. Run: pnpm model:quantize (to create INT8 version)', 'yellow');
    log('  2. Run: pnpm model:benchmark (to test performance)', 'yellow');
    return true;
  } else {
    log('\n❌ Verification failed!', 'red');
    log('\nSome files are missing or corrupted.', 'red');
    log('Run: pnpm model:download', 'yellow');
    return false;
  }
}

// Main execution
verifyModel()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log(`\n❌ Verification error: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    process.exit(1);
  });
