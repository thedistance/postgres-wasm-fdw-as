// Script to verify that the component model WebAssembly module is compatible with the Supabase Wrappers framework
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Path to the component model WebAssembly module
const COMPONENT_PATH = join(rootDir, 'build-component', 'postgres_wasm_fdw_as.wasm');

// Required functions for compatibility with Supabase Wrappers
const REQUIRED_FUNCTIONS = [
  'host_version_requirement',
  'init',
  'begin_scan',
  'iter_scan',
  're_scan',
  'end_scan',
  'begin_modify',
  'insert',
  'update',
  'delete_',
  'end_modify'
];

// Helper function to decode a string from WebAssembly memory
function decodeString(exports, ptr) {
  if (ptr === 0) return null;

  // Get the memory view
  const memory = new Uint8Array(exports.memory.buffer);

  // Find the end of the string (null terminator)
  let end = ptr;
  while (memory[end] !== 0) end++;

  // Decode the string
  const bytes = memory.subarray(ptr, end);
  return new TextDecoder().decode(bytes);
}

// Verify the component model WebAssembly module
async function verifyComponentModel() {
  try {
    console.log(`Loading component model WebAssembly module from ${COMPONENT_PATH}...`);
    const wasmModule = readFileSync(COMPONENT_PATH);

    console.log('Instantiating WebAssembly module...');
    const { exports } = await instantiate(wasmModule, {
      env: {
        abort: (message, fileName, lineNumber, columnNumber) => {
          console.error(`Abort: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
        }
      }
    });

    console.log('WebAssembly module instantiated successfully.');

    // Check for required functions
    console.log('\nChecking for required functions:');
    let allFunctionsPresent = true;

    for (const funcName of REQUIRED_FUNCTIONS) {
      if (typeof exports[funcName] === 'function') {
        console.log(`✅ ${funcName}: Available`);
      } else {
        console.log(`❌ ${funcName}: Not available`);
        allFunctionsPresent = false;
      }
    }

    // Check host_version_requirement
    if (typeof exports.host_version_requirement === 'function') {
      const versionPtr = exports.host_version_requirement();
      const version = decodeString(exports, versionPtr);
      console.log('\nHost version requirement:', version);
    }

    // Print summary
    console.log('\nVerification summary:');
    if (allFunctionsPresent) {
      console.log('✅ All required functions are present.');
      console.log('✅ The component model WebAssembly module is compatible with the Supabase Wrappers framework.');
    } else {
      console.log('❌ Some required functions are missing.');
      console.log('❌ The component model WebAssembly module is NOT compatible with the Supabase Wrappers framework.');
    }

    return allFunctionsPresent;
  } catch (error) {
    console.error('Error verifying component model:', error);
    return false;
  }
}

// Run the verification
verifyComponentModel().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 