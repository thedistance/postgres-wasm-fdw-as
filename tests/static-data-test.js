// Test using static data directly
import { readFileSync } from 'fs';

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

function test() {
  try {
    console.log('Using static data directly...');
    console.log(`Data contains ${STATIC_DATA.length} records`);

    // Export results as CSV
    console.log('\nExporting results as CSV:');
    const csv = rowsToCSV(STATIC_DATA);
    console.log(csv);

    // Also print the raw data for debugging
    console.log('\nRaw data:');
    STATIC_DATA.forEach((row, index) => {
      console.log(`Row ${index}:`, row);
    });

    console.log('\nStatic data test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 