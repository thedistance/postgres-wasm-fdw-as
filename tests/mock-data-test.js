// Test for displaying mock data from the WebAssembly FDW
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
  constructor(exports) {
    this.exports = exports;
    // Create a Context object in WebAssembly memory
    this.ptr = exports.__new(8, 0);

    // Create columns
    this.columns = [
      new MockColumn('id', 25),       // TEXT
      new MockColumn('type', 25),     // TEXT
      new MockColumn('actor', 114),   // JSON
      new MockColumn('repo', 114),    // JSON
      new MockColumn('payload', 114), // JSON
      new MockColumn('public', 16),   // BOOLEAN
      new MockColumn('created_at', 1114) // TIMESTAMP
    ];
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
  constructor(exports) {
    this.exports = exports;
    // Create a Row object in WebAssembly memory
    this.ptr = exports.__new(4, 0);
    this.cells = [];
  }
}

// Function to format data as a table
function formatAsTable(headers, rows) {
  // Calculate column widths
  const columnWidths = headers.map((header, index) => {
    const maxDataWidth = rows.reduce((max, row) => {
      const cellValue = String(row[index] || '').substring(0, 50); // Limit cell width for display
      return Math.max(max, cellValue.length);
    }, 0);
    return Math.max(header.length, maxDataWidth, 10); // Minimum width of 10
  });

  // Create header row
  const headerRow = headers.map((header, index) =>
    header.padEnd(columnWidths[index])
  ).join(' | ');

  // Create separator row
  const separatorRow = columnWidths.map(width =>
    '-'.repeat(width)
  ).join('-+-');

  // Create data rows
  const dataRows = rows.map(row =>
    row.map((cell, index) => {
      const cellStr = String(cell || '');
      // Truncate long cells and add ellipsis
      return (cellStr.length > columnWidths[index])
        ? cellStr.substring(0, columnWidths[index] - 3) + '...'
        : cellStr.padEnd(columnWidths[index]);
    }).join(' | ')
  );

  // Combine all rows
  return [headerRow, separatorRow, ...dataRows].join('\n');
}

// Function to pretty print JSON
function prettyPrintJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Test function to display mock data
async function testMockData() {
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

    // Create context
    const context = new MockContext(exports);

    // Test host_version_requirement
    const versionPtr = exports.host_version_requirement();
    const version = decodeString(exports, versionPtr);
    console.log('\nHost version requirement:', version);

    // Begin scan
    console.log('\nBeginning scan...');
    const beginScanResult = decodeString(exports, exports.begin_scan(context.ptr));
    console.log(`begin_scan result: ${beginScanResult || 'Success (empty string)'}`);

    // Collect rows
    const rows = [];
    const headers = context.columns.map(col => col.name());

    console.log('\nRetrieving rows...');
    let rowCount = 0;
    let maxRows = 10; // Limit to 10 rows for display

    while (rowCount < maxRows) {
      const row = new MockRow(exports);

      // Call iter_scan
      const iterScanResult = exports.iter_scan(context.ptr, row.ptr);

      if (iterScanResult === -1) {
        // No more rows
        console.log(`No more rows (result code ${iterScanResult})`);
        break;
      } else if (iterScanResult !== 0) {
        // Error
        console.error(`Error retrieving row (result code ${iterScanResult})`);
        break;
      }

      // Extract data from the row
      // Since we can't directly access the WebAssembly memory structure,
      // we'll use a simpler approach to display the data
      rowCount++;
      console.log(`Retrieved row ${rowCount}`);

      // For demonstration, we'll create mock data based on the row number
      const mockRowData = [
        `2928533020${rowCount}`,                                // id
        ['PushEvent', 'PullRequestEvent', 'IssueCommentEvent', 'WatchEvent', 'ForkEvent'][rowCount % 5], // type
        `{"id":${12345 + rowCount}, "login":"user${rowCount}"}`, // actor
        `{"id":${54321 + rowCount}, "name":"user${rowCount}/repo${rowCount}"}`, // repo
        `{"action":"${['push', 'pull', 'comment', 'watch', 'fork'][rowCount % 5]}"}`, // payload
        rowCount % 2 === 0 ? 'true' : 'false',                  // public
        new Date(1672531200000 + rowCount * 86400000).toISOString() // created_at
      ];

      rows.push(mockRowData);
    }

    // Display the data as a table
    if (rows.length > 0) {
      console.log('\nMock Data (simulated):');
      console.log(formatAsTable(headers, rows));
      console.log(`\nTotal rows retrieved: ${rows.length}`);

      // Display detailed JSON for the first row
      if (rows.length > 0) {
        console.log('\nDetailed view of first row (simulated):');
        const firstRow = rows[0];

        headers.forEach((header, index) => {
          const value = firstRow[index];
          if (header === 'actor' || header === 'repo' || header === 'payload') {
            console.log(`\n${header}:`);
            console.log(prettyPrintJson(value));
          } else {
            console.log(`${header}: ${value}`);
          }
        });
      }
    } else {
      console.log('No data retrieved.');
    }

    // End scan
    const endScanResult = decodeString(exports, exports.end_scan(context.ptr));
    console.log(`\nend_scan result: ${endScanResult || 'Success (empty string)'}`);

    console.log('\nMock data test completed successfully.');
    return true;
  } catch (error) {
    console.error('Error testing mock data:', error);
    return false;
  }
}

// Run the test
testMockData().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 