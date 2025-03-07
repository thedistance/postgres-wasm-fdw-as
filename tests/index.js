// Enhanced test for the AssemblyScript implementation
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

// Mock Context and Row classes to simulate Postgres environment
class MockContext {
  constructor() {
    this.columns = [];
    this.options = new Map();
    this.serverOptions = new Map();
    this.tableOptions = new Map();

    // Add server options
    this.serverOptions.set("api_url", "https://api.github.com");

    // Add table options
    this.tableOptions.set("object", "events");
    this.tableOptions.set("rowid_column", "id");
  }
}

class MockRow {
  constructor() {
    this.cells = [];
  }

  push(cell) {
    this.cells.push(cell);
    return true;
  }
}

async function test() {
  try {
    // Load the WebAssembly module
    const wasmModule = readFileSync('./build/release.wasm');

    // Create a memory object
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

    const { exports } = await instantiate(wasmModule, {
      env: {
        // Provide the memory object
        memory: memory,
        // Provide console.log
        'console.log': function (...args) {
          console.log(...args);
        },
        // Provide Date.now
        'Date.now': function () {
          return Date.now();
        },
        // Mock any imported functions that the Wasm module expects
        abort: function (message, fileName, lineNumber, columnNumber) {
          console.error(
            `Abort called at ${fileName}:${lineNumber}:${columnNumber}: ${message}`
          );
        }
      }
    });

    console.log('WebAssembly module loaded successfully');

    // Test host_version_requirement
    const versionReq = exports.host_version_requirement();
    console.log('Host version requirement:', versionReq);

    console.log('\nBasic test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 