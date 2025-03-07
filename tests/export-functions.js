// Export WebAssembly Module Functions
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

async function test() {
  try {
    console.log('Loading WebAssembly module...');
    const wasmModule = readFileSync('./build/release.wasm');

    // Create a memory object
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

    const { exports } = await instantiate(wasmModule, {
      env: {
        memory: memory,
        'console.log': function (...args) {
          console.log(...args);
        },
        'Date.now': function () {
          return Date.now();
        },
        abort: function (message, fileName, lineNumber, columnNumber) {
          console.error(`Abort: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
        }
      }
    });

    console.log('WebAssembly module loaded successfully');

    // Export all functions and their types
    console.log('\nExported functions:');
    const exportedFunctions = [];

    for (const key in exports) {
      if (typeof exports[key] === 'function') {
        exportedFunctions.push({
          name: key,
          type: typeof exports[key],
          toString: exports[key].toString()
        });
      }
    }

    // Sort functions by name
    exportedFunctions.sort((a, b) => a.name.localeCompare(b.name));

    // Print functions in CSV format
    console.log('name,type');
    exportedFunctions.forEach(func => {
      console.log(`${func.name},${func.type}`);
    });

    // Test host_version_requirement
    try {
      const versionReq = exports.host_version_requirement();
      console.log('\nhost_version_requirement result:', versionReq);
      console.log('host_version_requirement type:', typeof versionReq);
    } catch (error) {
      console.error('Error in host_version_requirement:', error);
    }

    // Export memory information
    console.log('\nMemory information:');
    console.log('- Initial size:', memory.buffer.byteLength / (64 * 1024), 'pages');
    console.log('- Maximum size:', 100, 'pages');

    // Export required functions for Supabase Wrappers
    console.log('\nRequired functions for Supabase Wrappers:');
    const requiredFunctions = [
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

    requiredFunctions.forEach(funcName => {
      const exists = typeof exports[funcName] === 'function';
      console.log(`- ${funcName}: ${exists ? 'Present' : 'Missing'}`);
    });

    console.log('\nExport completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 