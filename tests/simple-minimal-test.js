// Simple test for the minimal static version
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

async function test() {
  try {
    console.log('Loading minimal static WebAssembly module...');
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

    // Test host_version_requirement
    try {
      const versionReq = exports.host_version_requirement();
      console.log('Host version requirement:', versionReq);
      console.log('Type of host_version_requirement result:', typeof versionReq);

      // If it's a pointer, try to read the string
      if (typeof versionReq === 'number' && exports.__getString) {
        console.log('String value:', exports.__getString(versionReq));
      }
    } catch (error) {
      console.error('Error in host_version_requirement:', error);
    }

    // List all exported functions
    console.log('\nExported functions:');
    Object.keys(exports).forEach(key => {
      if (typeof exports[key] === 'function') {
        console.log(`- ${key}: ${typeof exports[key]}`);
      }
    });

    // Create a simple context and row
    const ctx = {};
    const row = {};

    // Test the functions
    try {
      console.log('\nTesting init...');
      const initResult = exports.init(ctx);
      console.log('Init result:', initResult);

      console.log('\nTesting begin_scan...');
      const beginScanResult = exports.begin_scan(ctx);
      console.log('Begin scan result:', beginScanResult);

      console.log('\nTesting iter_scan...');
      const iterScanResult = exports.iter_scan(ctx, row);
      console.log('Iter scan result:', iterScanResult);

      console.log('\nTesting end_scan...');
      const endScanResult = exports.end_scan(ctx);
      console.log('End scan result:', endScanResult);
    } catch (error) {
      console.error('Error in function calls:', error);
    }

    console.log('\nSimple minimal test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 