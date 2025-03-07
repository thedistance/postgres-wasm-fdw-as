// Script to compare Rust and AssemblyScript implementations
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';
import fetch from 'node-fetch';

// Paths to the WebAssembly modules
const AS_WASM_PATH = './build/component-model.wasm';
const RUST_WASM_PATH = process.env.RUST_WASM_PATH || '../postgres-wasm-fdw/build/wasm_fdw_dizions.wasm';

// Function to test the AssemblyScript implementation
async function testAssemblyScript() {
  console.log('Testing AssemblyScript implementation...');
  try {
    const wasmModule = readFileSync(AS_WASM_PATH);
    console.log(`AssemblyScript Wasm module size: ${wasmModule.length} bytes`);

    const { exports } = await instantiate(wasmModule, {
      env: {
        abort: (message, fileName, lineNumber, columnNumber) => {
          console.error(`Abort: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
        }
      }
    });

    // Get the host version requirement
    const versionPtr = exports.host_version_requirement();
    console.log('Host version requirement pointer:', versionPtr);
    console.log('This should be "^0.1.0" when properly decoded');

    // List all exported functions
    console.log('\nAssemblyScript exported functions:');
    Object.keys(exports).forEach(key => {
      const type = typeof exports[key];
      console.log(`- ${key}: ${type}`);
    });

    return {
      success: true,
      exports: exports
    };
  } catch (error) {
    console.error('Error testing AssemblyScript implementation:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Function to test the Rust implementation
async function testRust() {
  console.log('\nTesting Rust implementation...');
  try {
    // Check if the Rust Wasm file exists
    try {
      const wasmModule = readFileSync(RUST_WASM_PATH);
      console.log(`Found Rust Wasm file at ${RUST_WASM_PATH}, size: ${wasmModule.length} bytes`);

      // Try to analyze the Wasm module structure
      console.log('\nAnalyzing Rust Wasm module structure:');

      // Create a WebAssembly module to inspect its exports
      try {
        const module = new WebAssembly.Module(wasmModule);
        const exports = WebAssembly.Module.exports(module);
        const imports = WebAssembly.Module.imports(module);

        console.log('Rust Wasm exports:');
        exports.forEach(exp => {
          console.log(`- ${exp.name}: ${exp.kind}`);
        });

        console.log('\nRust Wasm imports:');
        imports.forEach(imp => {
          console.log(`- ${imp.module}.${imp.name}: ${imp.kind}`);
        });

        return {
          success: true,
          exports: exports,
          imports: imports
        };
      } catch (wasmError) {
        console.error('Error analyzing Rust Wasm module:', wasmError);

        // Try to analyze the binary format
        console.log('\nAnalyzing binary format:');
        const header = wasmModule.slice(0, 8);
        console.log('Header bytes:', Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' '));

        return {
          success: true,
          error: wasmError
        };
      }
    } catch (error) {
      console.error(`Rust Wasm file not found at ${RUST_WASM_PATH}: ${error.message}`);
      console.error('Please set the RUST_WASM_PATH environment variable to point to the Rust Wasm file');
      return {
        success: false,
        error: error
      };
    }
  } catch (error) {
    console.error('Error testing Rust implementation:', error);
    return {
      success: false,
      error: error
    };
  }
}

// Function to compare the implementations
async function compareImplementations() {
  console.log('Comparing implementations...');

  // Test both implementations
  const asResult = await testAssemblyScript();
  const rustResult = await testRust();

  if (!asResult.success || !rustResult.success) {
    console.error('One or both implementations failed testing');
    return;
  }

  // Compare the results of both implementations
  console.log('\nComparing exports between implementations:');

  if (asResult.exports && rustResult.exports) {
    // Compare exported functions
    console.log('Common exported functions:');
    const asExports = Object.keys(asResult.exports);
    const rustExports = rustResult.exports.map(exp => exp.name);

    const commonExports = asExports.filter(exp => rustExports.includes(exp));
    commonExports.forEach(exp => {
      console.log(`- ${exp}`);
    });

    console.log('\nAssemblyScript-only exports:');
    const asOnlyExports = asExports.filter(exp => !rustExports.includes(exp));
    asOnlyExports.forEach(exp => {
      console.log(`- ${exp}`);
    });

    console.log('\nRust-only exports:');
    const rustOnlyExports = rustExports.filter(exp => !asExports.includes(exp));
    rustOnlyExports.forEach(exp => {
      console.log(`- ${exp}`);
    });
  } else {
    console.log('Cannot compare exports - missing data');
  }
}

// Main function
async function main() {
  console.log('Starting comparison...');
  await compareImplementations();
  console.log('Comparison complete');
}

main().catch(console.error); 