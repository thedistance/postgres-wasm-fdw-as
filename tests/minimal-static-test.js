// Test for the minimal static version
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

class MockContext {
  constructor() {
    this.serverOptions = {
      api_url: 'https://api.github.com'
    };
    this.tableOptions = {
      object: 'events',
      rowid_column: 'id'
    };
    this.columns = [
      { name: 'id', type_oid: 3 }, // String
      { name: 'type', type_oid: 3 }, // String
      { name: 'actor', type_oid: 5 }, // Json
      { name: 'repo', type_oid: 5 }, // Json
      { name: 'payload', type_oid: 5 }, // Json
      { name: 'public', type_oid: 0 }, // Bool
      { name: 'created_at', type_oid: 4 } // Timestamp
    ];
  }

  get_options(type) {
    if (type === 0) { // Server options
      return {
        get: (key) => this.serverOptions[key] || null,
        has: (key) => key in this.serverOptions,
        require: (key) => {
          if (key in this.serverOptions) return this.serverOptions[key];
          throw new Error(`Required option '${key}' not found`);
        },
        requireOr: (key, defaultValue) => {
          return key in this.serverOptions ? this.serverOptions[key] : defaultValue;
        }
      };
    } else { // Table options
      return {
        get: (key) => this.tableOptions[key] || null,
        has: (key) => key in this.tableOptions,
        require: (key) => {
          if (key in this.tableOptions) return this.tableOptions[key];
          throw new Error(`Required option '${key}' not found`);
        },
        requireOr: (key, defaultValue) => {
          return key in this.tableOptions ? this.tableOptions[key] : defaultValue;
        }
      };
    }
  }

  get_columns() {
    return this.columns.map(col => ({
      name: () => col.name,
      type_oid: () => col.type_oid
    }));
  }
}

class MockRow {
  constructor() {
    this.cells = [];
  }

  push(cell) {
    console.log('Pushing cell:', cell);
    this.cells.push(cell);
    return true;
  }

  getData() {
    console.log('Getting data from cells:', this.cells);
    return this.cells.map(cell => {
      if (!cell) return 'NULL';

      console.log('Cell kind:', cell.kind, 'Cell value:', cell.value);

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
    const versionReq = exports.host_version_requirement();
    console.log('Host version requirement:', versionReq);

    // Create context
    const ctx = new MockContext();

    // Test init
    try {
      console.log('\nTesting init...');
      const initResult = exports.init(ctx);
      console.log('Init result:', initResult);
    } catch (error) {
      console.error('Error in init:', error);
    }

    // Collect rows
    const collectedRows = [];

    try {
      // Test begin_scan
      console.log('\nTesting begin_scan...');
      const beginScanResult = exports.begin_scan(ctx);
      console.log('Begin scan result:', beginScanResult);

      // Test iter_scan (multiple rows)
      console.log('\nTesting iter_scan...');

      let rowCount = 0;
      let hasMoreRows = true;

      while (hasMoreRows && rowCount < 10) { // Limit to 10 rows for testing
        const row = new MockRow();
        const iterScanResult = exports.iter_scan(ctx, row);

        console.log(`Iter scan result for row ${rowCount}:`, iterScanResult);

        if (iterScanResult === 0) {
          // Success, got a row
          collectedRows.push(row.getData());
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
    } catch (error) {
      console.error('Error in scan operations:', error);
    }

    // Export results as CSV
    if (collectedRows.length > 0) {
      console.log('\nExporting results as CSV:');
      const csv = rowsToCSV(collectedRows);
      console.log(csv);

      // Also print the raw data for debugging
      console.log('\nRaw data:');
      collectedRows.forEach((row, index) => {
        console.log(`Row ${index}:`, row);
      });
    } else {
      console.log('\nNo rows collected to export as CSV');
    }

    console.log('\nMinimal static test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 