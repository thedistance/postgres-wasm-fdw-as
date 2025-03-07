// Test to extract and display rows from the WebAssembly module
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

// Mock Context class
class MockContext {
  constructor() {
    this.columns = [
      { name: 'id', type_oid: 3 },
      { name: 'type', type_oid: 3 },
      { name: 'actor', type_oid: 5 },
      { name: 'repo', type_oid: 5 },
      { name: 'payload', type_oid: 5 },
      { name: 'public', type_oid: 0 },
      { name: 'created_at', type_oid: 4 }
    ];
  }

  get_columns() {
    return this.columns.map(col => ({
      name: () => col.name,
      type_oid: () => col.type_oid
    }));
  }

  get_options(type) {
    return {
      get: (key) => null,
      has: (key) => false,
      require: (key) => { throw new Error(`Option '${key}' is required but not provided`); },
      requireOr: (key, defaultValue) => defaultValue
    };
  }
}

// Mock Row class that captures cells
class MockRow {
  constructor(wasmExports) {
    this.cells = [];
    this.wasmExports = wasmExports;
  }

  push(cellPtr) {
    console.log('Pushing cell pointer:', cellPtr);

    // Store the pointer for later processing
    this.cells.push(cellPtr);

    return true;
  }

  getData() {
    console.log('Getting data from cells:', this.cells);

    // Try to extract data from the cells using AssemblyScript loader helpers
    return this.cells.map(cellPtr => {
      if (cellPtr === 0 || cellPtr === null || cellPtr === undefined) {
        return 'NULL';
      }

      try {
        // Try to determine the cell type
        // This is a simplified approach and may not work for all cell types
        if (this.wasmExports.__getString) {
          try {
            const str = this.wasmExports.__getString(cellPtr);
            return str;
          } catch (e) {
            console.log('Not a string pointer:', e);
          }
        }

        return `Pointer(${cellPtr})`;
      } catch (error) {
        console.error('Error extracting cell data:', error);
        return `Error(${cellPtr})`;
      }
    });
  }
}

// Convert rows to CSV
function rowsToCSV(rows) {
  if (rows.length === 0) return '';

  // Create header row based on column names
  const headers = [
    'id', 'type', 'actor', 'repo', 'payload', 'public', 'created_at'
  ];

  let csv = headers.join(',') + '\n';

  // Add data rows
  rows.forEach(row => {
    // Escape and quote values that contain commas
    const escapedRow = row.map(value => {
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });

    csv += escapedRow.join(',') + '\n';
  });

  return csv;
}

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

    // Test host_version_requirement
    const versionReq = exports.host_version_requirement();
    console.log('Host version requirement:', versionReq);
    if (exports.__getString) {
      console.log('String value:', exports.__getString(versionReq));
    }

    // Create context and test init
    const ctx = new MockContext();

    console.log('\nTesting init...');
    const initResult = exports.init(ctx);
    console.log('Init result:', initResult);

    // Test begin_scan
    console.log('\nTesting begin_scan...');
    const beginScanResult = exports.begin_scan(ctx);
    console.log('Begin scan result:', beginScanResult);

    // Test iter_scan (multiple rows)
    console.log('\nTesting iter_scan...');

    const collectedRows = [];
    let rowCount = 0;
    let hasMoreRows = true;

    while (hasMoreRows && rowCount < 10) { // Limit to 10 rows for testing
      const row = new MockRow(exports);
      const iterScanResult = exports.iter_scan(ctx, row);

      console.log(`Iter scan result for row ${rowCount}:`, iterScanResult);

      if (iterScanResult === 0) {
        // Success, got a row
        const rowData = row.getData();
        console.log(`Row ${rowCount} data:`, rowData);
        collectedRows.push(rowData);
        rowCount++;
      } else {
        // No more rows or error
        hasMoreRows = false;
      }
    }

    console.log(`Retrieved ${collectedRows.length} rows`);

    // Test end_scan
    console.log('\nTesting end_scan...');
    const endScanResult = exports.end_scan(ctx);
    console.log('End scan result:', endScanResult);

    // Export results as CSV
    if (collectedRows.length > 0) {
      console.log('\nExporting results as CSV:');
      const csv = rowsToCSV(collectedRows);
      console.log(csv);
    } else {
      console.log('\nNo rows collected to export as CSV');
    }

    console.log('\nWasm rows test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 