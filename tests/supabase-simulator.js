// Supabase Simulator for testing WebAssembly FDW
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';
import fetch from 'node-fetch';

// Path to the WebAssembly module
const WASM_PATH = './build/component-model.wasm';

class SupabaseSimulator {
  constructor(wasmPath = WASM_PATH) {
    this.wasmPath = wasmPath;
    this.exports = null;
    this.memory = null;
    this.textDecoder = new TextDecoder();
    this.textEncoder = new TextEncoder();
    this.collectedRows = [];
    this.githubData = null;
  }

  async initialize() {
    try {
      const wasmModule = readFileSync(this.wasmPath);
      const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

      const instance = await instantiate(wasmModule, {
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
        },
        http: {
          get: (requestPtr) => {
            console.log('HTTP GET called');
            // In a real implementation, this would make an actual HTTP request
            // For now, we'll return a mock response with real GitHub data
            return this.createMockResponse(200, JSON.stringify(this.githubData || []));
          }
        },
        time: {
          parse_from_rfc3339: (timestampPtr) => {
            console.log('parse_from_rfc3339 called');
            return BigInt(Date.now());
          }
        },
        utils: {
          report_info: (messagePtr) => {
            console.log('report_info called');
          }
        }
      });

      this.exports = instance.exports;
      this.memory = memory;
      console.log('WebAssembly module initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize WebAssembly module:', error);
      return false;
    }
  }

  createMockResponse(status, body) {
    return {
      status,
      body,
      headers: new Map()
    };
  }

  // Helper to create a string in WebAssembly memory
  writeString(str) {
    const bytes = this.textEncoder.encode(str);
    const ptr = this.exports.__new(bytes.length, 1); // String id = 1
    const memory = new Uint8Array(this.memory.buffer);
    memory.set(bytes, ptr);
    return ptr;
  }

  // Helper to read a string from WebAssembly memory
  readString(ptr) {
    const memory = new Uint8Array(this.memory.buffer);
    let end = ptr;
    while (memory[end]) end++;
    return this.textDecoder.decode(memory.subarray(ptr, end));
  }

  // Create a mock Context object
  createContext() {
    return {
      get_options: (type) => {
        if (type === 0) { // Server options
          return {
            get: (key) => {
              if (key === 'api_url') return 'https://api.github.com';
              return null;
            },
            has: (key) => {
              return key === 'api_url';
            },
            require: (key) => {
              if (key === 'api_url') return 'https://api.github.com';
              throw new Error(`Required option '${key}' not found`);
            },
            requireOr: (key, defaultValue) => {
              if (key === 'api_url') return 'https://api.github.com';
              return defaultValue;
            }
          };
        } else { // Table options
          return {
            get: (key) => {
              if (key === 'object') return 'events';
              if (key === 'rowid_column') return 'id';
              return null;
            },
            has: (key) => {
              return key === 'object' || key === 'rowid_column';
            },
            require: (key) => {
              if (key === 'object') return 'events';
              if (key === 'rowid_column') return 'id';
              throw new Error(`Required option '${key}' not found`);
            },
            requireOr: (key, defaultValue) => {
              if (key === 'object') return 'events';
              if (key === 'rowid_column') return 'id';
              return defaultValue;
            }
          };
        }
      },
      get_columns: () => {
        return [
          { name: () => 'id', type_oid: () => 3 }, // String
          { name: () => 'type', type_oid: () => 3 }, // String
          { name: () => 'actor', type_oid: () => 5 }, // Json
          { name: () => 'repo', type_oid: () => 5 }, // Json
          { name: () => 'payload', type_oid: () => 5 }, // Json
          { name: () => 'public', type_oid: () => 0 }, // Bool
          { name: () => 'created_at', type_oid: () => 4 } // Timestamp
        ];
      }
    };
  }

  // Create a mock Row object that captures the data
  createRow() {
    const self = this;
    const row = {
      cells: [],
      push: function (cell) {
        this.cells.push(cell);
        return true;
      },
      getData: function () {
        return this.cells.map(cell => {
          if (!cell) return 'NULL';

          switch (cell.kind) {
            case 'Bool':
              return cell.value ? 'true' : 'false';
            case 'Int':
              return cell.value.toString();
            case 'Float':
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
    };
    return row;
  }

  // Convert rows to CSV
  rowsToCSV(rows) {
    if (rows.length === 0) return '';

    // Create header row based on column names
    const headers = [
      'id', 'type', 'actor', 'repo', 'payload', 'public', 'created_at'
    ];

    let csv = headers.join(',') + '\n';

    // Add data rows
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  async runTest() {
    if (!this.exports) {
      console.error('WebAssembly module not initialized');
      return false;
    }

    try {
      // Test host_version_requirement
      const versionReq = this.exports.host_version_requirement();
      console.log('Host version requirement:', versionReq);

      // Fetch real GitHub data for testing
      await this.fetchGitHubData();

      // Create context
      const ctx = this.createContext();

      // Test init
      console.log('\nTesting init...');
      const initResult = this.exports.init(ctx);
      console.log('Init result:', initResult === null ? 'Success (null)' : initResult);

      // Test begin_scan
      console.log('\nTesting begin_scan...');
      const beginScanResult = this.exports.begin_scan(ctx);
      console.log('Begin scan result:', beginScanResult === null ? 'Success (null)' : beginScanResult);

      // Test iter_scan (multiple rows)
      console.log('\nTesting iter_scan...');
      this.collectedRows = [];

      let rowCount = 0;
      let hasMoreRows = true;

      while (hasMoreRows && rowCount < 10) { // Limit to 10 rows for testing
        const row = this.createRow();
        const iterScanResult = this.exports.iter_scan(ctx, row);

        if (iterScanResult === 0) {
          // Success, got a row
          this.collectedRows.push(row.getData());
          rowCount++;
        } else {
          // No more rows or error
          hasMoreRows = false;
        }
      }

      console.log(`Retrieved ${this.collectedRows.length} rows`);

      // Test end_scan
      console.log('\nTesting end_scan...');
      const endScanResult = this.exports.end_scan(ctx);
      console.log('End scan result:', endScanResult === null ? 'Success (null)' : endScanResult);

      // Export results as CSV
      console.log('\nExporting results as CSV:');
      const csv = this.rowsToCSV(this.collectedRows);
      console.log(csv);

      return true;
    } catch (error) {
      console.error('Error during test:', error);
      return false;
    }
  }

  async fetchGitHubData() {
    try {
      console.log('\nFetching data from GitHub API...');
      const response = await fetch('https://api.github.com/events');
      this.githubData = await response.json();
      console.log(`Fetched ${this.githubData.length} events from GitHub API`);
      return true;
    } catch (error) {
      console.error('Error fetching from GitHub API:', error);
      this.githubData = [];
      return false;
    }
  }

  async compareWithRealApi() {
    try {
      if (this.collectedRows.length === 0) {
        console.log('\nNo rows collected to compare with API');
        return false;
      }

      console.log('\nComparing collected rows with GitHub API data:');
      console.log(`- Collected rows: ${this.collectedRows.length}`);
      console.log(`- GitHub API events: ${this.githubData ? this.githubData.length : 0}`);

      // Here you would implement a more detailed comparison

      return true;
    } catch (error) {
      console.error('Error comparing with real API:', error);
      return false;
    }
  }
}

// Run the tests
async function main() {
  const simulator = new SupabaseSimulator('./build/component-model.wasm');

  if (await simulator.initialize()) {
    await simulator.runTest();
    await simulator.compareWithRealApi();

    console.log('\nNext steps to diagnose Supabase errors:');
    console.log('1. Check if the host_version_requirement matches what Supabase expects');
    console.log('2. Verify that the WebAssembly module exports all required functions');
    console.log('3. Ensure that the function signatures match what Supabase expects');
    console.log('4. Compare the behavior with the working Rust implementation');
    console.log('5. Look for any AssemblyScript-specific issues that might not occur in Rust');
    console.log('6. Compare the CSV output with what the Rust implementation produces');
  }
}

main().catch(console.error); 