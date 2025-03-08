// Test for the WebAssembly FDW implementation
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

// Path to the WebAssembly module
const WASM_PATH = './build/release.wasm';

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

// Mock classes for testing
class MockColumn {
  constructor(name, typeOid) {
    this.name_ = name;
    this.typeOid_ = typeOid;
  }

  name() {
    return this.name_;
  }

  type_oid() {
    return this.typeOid_;
  }
}

class MockContext {
  constructor(columns = []) {
    this.columns = columns;
    this.options = new Map();
    this.options.set(0, new MockOptions());
  }

  get_columns() {
    return this.columns;
  }

  get_options(type) {
    return this.options.get(type) || new MockOptions();
  }
}

class MockOptions {
  constructor() {
    this.options = new Map();
    this.options.set('api_url', 'https://api.github.com');
  }

  get(key) {
    return this.options.get(key) || null;
  }

  require(key) {
    const value = this.get(key);
    if (value === null) {
      throw new Error(`Option '${key}' is required but not provided`);
    }
    return value;
  }

  requireOr(key, defaultValue) {
    const value = this.get(key);
    return value !== null ? value : defaultValue;
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

  getData() {
    return this.cells.map(cell => {
      if (!cell) return 'NULL';

      switch (cell.kind) {
        case 'Bool':
          return cell.value ? 'true' : 'false';
        case 'Int':
          return cell.value.toString();
        case 'String':
          return cell.value;
        case 'Timestamp':
          return new Date(Number(cell.value)).toISOString();
        case 'Json':
          return cell.value;
        case 'Null':
          return 'NULL';
        default:
          return `Unknown(${cell.kind})`;
      }
    });
  }
}

// Simple test that just calls the exported functions
async function testWasmFdw() {
  try {
    console.log(`Loading WebAssembly module from ${WASM_PATH}...`);
    const wasmModule = readFileSync(WASM_PATH);

    console.log('Instantiating WebAssembly module...');
    const { exports } = await instantiate(wasmModule, {
      env: {
        abort: (message, fileName, lineNumber, columnNumber) => {
          console.error(`Abort: ${message} at ${fileName}:${lineNumber}:${columnNumber}`);
        }
      }
    });

    console.log('WebAssembly module instantiated successfully.');

    // List all exported functions
    console.log('\nExported functions:');
    Object.keys(exports).forEach(key => {
      const type = typeof exports[key];
      if (type === 'function' && !key.startsWith('__')) {
        console.log(`- ${key}: ${type}`);
      }
    });

    // Test host_version_requirement
    const versionPtr = exports.host_version_requirement();
    const version = decodeString(exports, versionPtr);
    console.log('\nHost version requirement:', version);

    // Create minimal objects for testing
    console.log('\nCreating minimal test objects...');
    const contextPtr = exports.__new(8, 0);
    const rowPtr = exports.__new(4, 0);

    // Test exported functions with minimal objects
    console.log('\nTesting exported functions:');

    // Test functions that return strings
    const stringFunctions = [
      'host_version_requirement',
      'init',
      'begin_scan',
      'end_scan',
      'begin_modify',
      'insert',
      'end_modify'
    ];

    for (const funcName of stringFunctions) {
      if (typeof exports[funcName] === 'function') {
        try {
          let result;
          if (funcName === 'host_version_requirement') {
            result = decodeString(exports, exports[funcName]());
          } else if (funcName === 'insert') {
            result = decodeString(exports, exports[funcName](contextPtr, rowPtr));
          } else {
            result = decodeString(exports, exports[funcName](contextPtr));
          }
          console.log(`- ${funcName}: ${result || 'Success (empty string)'}`);
        } catch (error) {
          console.error(`- ${funcName}: Error - ${error.message}`);
        }
      }
    }

    // Test iter_scan separately (returns an integer)
    try {
      const iterScanResult = exports.iter_scan(contextPtr, rowPtr);
      console.log(`- iter_scan: Result code ${iterScanResult}`);
    } catch (error) {
      console.error(`- iter_scan: Error - ${error.message}`);
    }

    console.log('\nTest completed successfully.');
    return true;
  } catch (error) {
    console.error('Error testing WebAssembly FDW:', error);
    return false;
  }
}

// Run the test
testWasmFdw().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 