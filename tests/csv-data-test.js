// Test using CSV data
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';
import { parse } from 'csv-parse/sync';

// Read and parse the CSV file
function readCsvData(filePath) {
  try {
    const csvContent = readFileSync(filePath, 'utf8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: true
    });
    console.log(`Read ${records.length} records from CSV file`);
    return records;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return [];
  }
}

// Create a mock implementation of the FDW
class MockFdw {
  constructor(csvData) {
    this.data = csvData;
    this.currentIndex = 0;
  }

  host_version_requirement() {
    return "^0.1.0";
  }

  init() {
    return null; // Success
  }

  begin_scan() {
    this.currentIndex = 0;
    return null; // Success
  }

  iter_scan(ctx, row) {
    if (this.currentIndex >= this.data.length) {
      return -1; // No more rows
    }

    const record = this.data[this.currentIndex];

    // Add cells to the row
    for (const column of ctx.columns) {
      const columnName = column.name;
      const value = record[columnName];

      if (value === undefined) {
        row.cells.push({ kind: 'Null' });
      } else if (typeof value === 'boolean') {
        row.cells.push({ kind: 'Bool', value });
      } else if (typeof value === 'number') {
        row.cells.push({ kind: 'Int', value });
      } else if (columnName === 'actor' || columnName === 'repo' || columnName === 'payload') {
        row.cells.push({ kind: 'Json', value });
      } else if (columnName === 'created_at') {
        row.cells.push({ kind: 'Timestamp', value: new Date(value).getTime() });
      } else {
        row.cells.push({ kind: 'String', value: String(value) });
      }
    }

    this.currentIndex++;
    return 0; // Success
  }

  re_scan() {
    this.currentIndex = 0;
    return null; // Success
  }

  end_scan() {
    return null; // Success
  }

  begin_modify() {
    return "modify on foreign table is not supported";
  }

  insert() {
    return "insert on foreign table is not supported";
  }

  update() {
    return "update on foreign table is not supported";
  }

  delete() {
    return "delete on foreign table is not supported";
  }

  end_modify() {
    return null; // Success
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
    console.log('Reading CSV data...');
    const csvData = readCsvData('./events_rows.csv');

    if (csvData.length === 0) {
      console.error('No CSV data found. Please make sure events_rows.csv exists and contains data.');
      return;
    }

    // Create a mock FDW
    const mockFdw = new MockFdw(csvData);

    // Create a mock context
    const ctx = {
      columns: [
        { name: 'id', type: 'String' },
        { name: 'type', type: 'String' },
        { name: 'actor', type: 'Json' },
        { name: 'repo', type: 'Json' },
        { name: 'payload', type: 'Json' },
        { name: 'public', type: 'Bool' },
        { name: 'created_at', type: 'Timestamp' }
      ]
    };

    // Test the FDW functions
    console.log('\nTesting FDW functions with CSV data...');

    // Test init
    console.log('Testing init...');
    const initResult = mockFdw.init();
    console.log('Init result:', initResult);

    // Test begin_scan
    console.log('\nTesting begin_scan...');
    const beginScanResult = mockFdw.begin_scan();
    console.log('Begin scan result:', beginScanResult);

    // Test iter_scan (multiple rows)
    console.log('\nTesting iter_scan...');

    const collectedRows = [];
    let rowCount = 0;
    let hasMoreRows = true;

    while (hasMoreRows) {
      const row = { cells: [] };
      const iterScanResult = mockFdw.iter_scan(ctx, row);

      console.log(`Iter scan result for row ${rowCount}:`, iterScanResult);

      if (iterScanResult === 0) {
        // Success, got a row
        const rowData = row.cells.map(cell => {
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
    const endScanResult = mockFdw.end_scan();
    console.log('End scan result:', endScanResult);

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

    console.log('\nCSV data test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 