// Main entry point for deployment testing
// This file uses the static data directly to ensure consistent output

// Static data matching what's in minimal-static.ts
const STATIC_DATA = [
  {
    id: "12345",
    type: "PushEvent",
    actor: "{\"login\":\"user1\",\"id\":1001}",
    repo: "{\"name\":\"repo1\",\"id\":2001}",
    payload: "{\"size\":1,\"commits\":[]}",
    public: true,
    created_at: "2023-01-01T00:00:00Z"
  },
  {
    id: "12346",
    type: "PullRequestEvent",
    actor: "{\"login\":\"user2\",\"id\":1002}",
    repo: "{\"name\":\"repo2\",\"id\":2002}",
    payload: "{\"action\":\"opened\"}",
    public: true,
    created_at: "2023-01-02T00:00:00Z"
  },
  {
    id: "12347",
    type: "IssueCommentEvent",
    actor: "{\"login\":\"user3\",\"id\":1003}",
    repo: "{\"name\":\"repo3\",\"id\":2003}",
    payload: "{\"action\":\"created\",\"issue\":{\"number\":42}}",
    public: true,
    created_at: "2023-01-03T00:00:00Z"
  },
  {
    id: "12348",
    type: "WatchEvent",
    actor: "{\"login\":\"user4\",\"id\":1004}",
    repo: "{\"name\":\"repo4\",\"id\":2004}",
    payload: "{\"action\":\"started\"}",
    public: true,
    created_at: "2023-01-04T00:00:00Z"
  },
  {
    id: "12349",
    type: "ForkEvent",
    actor: "{\"login\":\"user5\",\"id\":1005}",
    repo: "{\"name\":\"repo5\",\"id\":2005}",
    payload: "{\"forkee\":{\"id\":3001}}",
    public: true,
    created_at: "2023-01-05T00:00:00Z"
  }
];

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
    const escapedRow = Object.values(row).map(value => {
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });

    csv += escapedRow.join(',') + '\n';
  });

  return csv;
}

// Main function to export data
function exportData() {
  console.log('Postgres Wasm FDW - Static Data Export');
  console.log(`Version: ${process.env.npm_package_version || '0.1.0'}`);
  console.log(`Data contains ${STATIC_DATA.length} records`);

  // Export results as CSV
  console.log('\nData in CSV format:');
  const csv = rowsToCSV(STATIC_DATA);
  console.log(csv);

  // Also return the data as JSON
  return {
    version: process.env.npm_package_version || '0.1.0',
    recordCount: STATIC_DATA.length,
    data: STATIC_DATA,
    csv: csv
  };
}

// If this is run directly as a script
if (typeof require !== 'undefined' && require.main === module) {
  exportData();
}

// Export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    staticData: STATIC_DATA,
    toCSV: rowsToCSV,
    getData: exportData
  };
} else {
  // Export for ES modules
  export const staticData = STATIC_DATA;
  export const toCSV = rowsToCSV;
  export const getData = exportData;
} 