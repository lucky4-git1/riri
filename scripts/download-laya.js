#!/usr/bin/env node

/**
 * Laya Model Download Script
 * 
 * Downloads the official Laya ONNX model from Hugging Face
 * and verifies its integrity.
 * 
 * Source: receptron/laya-onnx on Hugging Face
 * License: Apache 2.0 (Convai Innovations)
 */

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const MODELS_DIR = join(PROJECT_ROOT, 'models', 'laya');

// Hugging Face configuration
const HF_REPO = 'receptron/laya-onnx';
const HF_REVISION = 'main'; // Can be pinned to specific commit
const HF_SUBFOLDER = 'multilingual'; // or 'english' for English-only

// Files to download
const REQUIRED_FILES = [
  'laya.onnx',
  'laya.onnx.data',
  'laya_config.json',
  'tokenizer/tokenizer.json',
  'tokenizer/tokenizer_config.json'
];

const HF_BASE_URL = `https://huggingface.co/${HF_REPO}/resolve/${HF_REVISION}`;

// Color output helpers
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

async function downloadFile(url, destPath, onProgress) {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
  let downloadedSize = 0;

  await mkdir(dirname(destPath), { recursive: true });
  
  const fileStream = createWriteStream(destPath);
  const reader = response.body.getReader();
  
  const hash = createHash('sha256');

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      downloadedSize += value.length;
      hash.update(value);
      fileStream.write(value);
      
      if (onProgress && totalSize > 0) {
        onProgress(downloadedSize, totalSize);
      }
    }
    
    fileStream.end();
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    return {
      sha256: hash.digest('hex'),
      size: downloadedSize
    };
  } catch (error) {
    fileStream.destroy();
    throw error;
  }
}

async function checkExistingFiles() {
  const existing = [];
  
  for (const file of REQUIRED_FILES) {
    const filePath = join(MODELS_DIR, file);
    if (existsSync(filePath)) {
      const stats = await stat(filePath);
      existing.push({ file, size: stats.size });
    }
  }
  
  return existing;
}

async function downloadModel() {
  log('\n=== Laya Model Download ===\n', 'bright');
  
  log(`Repository: ${HF_REPO}`, 'cyan');
  log(`Revision: ${HF_REVISION}`, 'cyan');
  log(`Subfolder: ${HF_SUBFOLDER}`, 'cyan');
  log(`Destination: ${MODELS_DIR}`, 'cyan');
  log('');

  // Check existing files
  const existing = await checkExistingFiles();
  
  if (existing.length === REQUIRED_FILES.length) {
    log('All model files already exist.', 'yellow');
    log('To re-download, delete the models/laya directory.', 'yellow');
    log('\nExisting files:', 'cyan');
    for (const { file, size } of existing) {
      log(`  ✓ ${file} (${formatBytes(size)})`, 'green');
    }
    return;
  }

  if (existing.length > 0) {
    log('Some model files exist:', 'yellow');
    for (const { file, size } of existing) {
      log(`  ✓ ${file} (${formatBytes(size)})`, 'green');
    }
    log('');
  }

  // Create models directory
  await mkdir(MODELS_DIR, { recursive: true });
  await mkdir(join(MODELS_DIR, 'tokenizer'), { recursive: true });

  // Download files
  const manifest = {
    name: 'laya',
    version: HF_REVISION,
    source: HF_REPO,
    subfolder: HF_SUBFOLDER,
    downloadedAt: new Date().toISOString(),
    format: 'onnx',
    precision: 'fp32',
    quantized: false,
    files: {}
  };

  for (const file of REQUIRED_FILES) {
    const filePath = join(MODELS_DIR, file);
    
    // Skip if already exists
    if (existsSync(filePath)) {
      log(`⏭️  Skipping ${file} (already exists)`, 'yellow');
      continue;
    }

    const url = `${HF_BASE_URL}/${HF_SUBFOLDER}/${file}`;
    
    log(`📥 Downloading ${file}...`, 'cyan');
    
    let lastProgress = 0;
    const startTime = Date.now();
    
    try {
      const result = await downloadFile(url, filePath, (downloaded, total) => {
        const progress = Math.floor((downloaded / total) * 100);
        if (progress >= lastProgress + 10 || progress === 100) {
          process.stdout.write(`\r   Progress: ${progress}% (${formatBytes(downloaded)} / ${formatBytes(total)})`);
          lastProgress = progress;
        }
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(''); // New line after progress
      log(`   ✓ Downloaded ${formatBytes(result.size)} in ${duration}s`, 'green');
      log(`   SHA256: ${result.sha256.substring(0, 16)}...`, 'blue');
      
      manifest.files[file] = {
        sha256: result.sha256,
        size: result.size,
        url
      };
    } catch (error) {
      log(`   ✗ Failed: ${error.message}`, 'red');
      throw error;
    }
  }

  // Save manifest
  const manifestPath = join(MODELS_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  log(`\n✓ Manifest saved: manifest.json`, 'green');

  // Calculate total size
  const totalSize = Object.values(manifest.files).reduce((sum, file) => sum + file.size, 0);
  
  log('\n=== Download Complete ===\n', 'bright');
  log(`Total size: ${formatBytes(totalSize)}`, 'cyan');
  log(`Files: ${Object.keys(manifest.files).length}`, 'cyan');
  log(`Location: ${MODELS_DIR}`, 'cyan');
  
  log('\nNext steps:', 'yellow');
  log('  1. Run: pnpm model:verify', 'yellow');
  log('  2. Run: pnpm model:quantize', 'yellow');
  log('  3. Run: pnpm doctor', 'yellow');
}

// Main execution
downloadModel().catch((error) => {
  log(`\n❌ Download failed: ${error.message}`, 'red');
  if (error.stack) {
    log(error.stack, 'red');
  }
  process.exit(1);
});
