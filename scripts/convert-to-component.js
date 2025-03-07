#!/usr/bin/env node

// Script to copy the AssemblyScript WebAssembly module to the component directory
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Paths
const inputWasmPath = join(rootDir, 'build', 'component-model.wasm');
const outputDir = join(rootDir, 'build-component');
const outputWasmPath = join(outputDir, 'postgres_wasm_fdw_as.wasm');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

function copyWasmFile() {
  try {
    console.log('Reading input WebAssembly module...');
    const wasmBytes = readFileSync(inputWasmPath);

    console.log('Copying WebAssembly file...');
    writeFileSync(outputWasmPath, wasmBytes);

    console.log(`Successfully copied WebAssembly file to: ${outputWasmPath}`);
    return true;
  } catch (error) {
    console.error('Error copying WebAssembly file:', error);
    return false;
  }
}

// Run the copy
const success = copyWasmFile();
if (success) {
  console.log('Copy completed successfully.');
} else {
  console.error('Copy failed.');
  process.exit(1);
} 