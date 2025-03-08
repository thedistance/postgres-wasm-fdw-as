// Test for displaying mock data from the AssemblyScript WebAssembly FDW implementation
import { readFileSync } from 'fs';

// Path to the WebAssembly module
const WASM_PATH = './build/release.wasm';

// Read the package.json file to get project information
function getProjectInfo() {
  try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    console.log('Project information from package.json:');
    console.log(`Package name: ${packageJson.name}`);
    console.log(`Version: ${packageJson.version}`);
    console.log(`Description: ${packageJson.description}`);

    // Extract build scripts
    console.log('Build scripts:');
    if (packageJson.scripts) {
      if (packageJson.scripts.build) {
        console.log(`  - build: ${packageJson.scripts.build}`);
      }
      if (packageJson.scripts['build:component']) {
        console.log(`  - build:component: ${packageJson.scripts['build:component']}`);
      }
      if (packageJson.scripts.asbuild) {
        console.log(`  - asbuild: ${packageJson.scripts.asbuild}`);
      }
    }

    console.log(''); // Empty line for spacing
    return true;
  } catch (error) {
    console.warn('Could not read package.json:', error.message);
    return false;
  }
}

// Read the WIT files to understand the WebAssembly interface
function getWitInfo() {
  try {
    const worldWit = readFileSync('./wit-component/wit/world.wit', 'utf8');
    console.log('WebAssembly Interface Type (WIT) Information:');

    // Extract package name and version
    const packageMatch = worldWit.match(/package\s+([^;]+);/);
    if (packageMatch) {
      console.log(`WIT Package: ${packageMatch[1]}`);
    }

    // Extract imports
    const imports = worldWit.match(/import\s+([^;]+);/g);
    if (imports && imports.length > 0) {
      console.log('Imports:');
      imports.forEach(importLine => {
        const importMatch = importLine.match(/import\s+([^;]+);/);
        if (importMatch) {
          console.log(`  - ${importMatch[1]}`);
        }
      });
    }

    // Extract exports
    const exports = worldWit.match(/export\s+([^;]+);/g);
    if (exports && exports.length > 0) {
      console.log('Exports:');
      exports.forEach(exportLine => {
        const exportMatch = exportLine.match(/export\s+([^;]+);/);
        if (exportMatch) {
          console.log(`  - ${exportMatch[1]}`);
        }
      });
    }

    console.log(''); // Empty line for spacing
    return true;
  } catch (error) {
    console.warn('Could not read WIT files:', error.message);
    return false;
  }
}

// Read the AssemblyScript implementation file to understand the code
function getAssemblyScriptImplementation() {
  try {
    const indexTs = readFileSync('./assembly/index.ts', 'utf8');
    console.log('AssemblyScript Implementation Information:');

    // Extract the class definition
    const classMatch = indexTs.match(/class\s+GitHubEventsFdw\s*\{([^}]+)\}/s);
    if (classMatch) {
      console.log('GitHubEventsFdw class properties:');
      const propertyMatches = classMatch[1].match(/private\s+([a-zA-Z0-9_]+)\s*:\s*([^;]+);/g);
      if (propertyMatches) {
        propertyMatches.forEach(propMatch => {
          const parts = propMatch.match(/private\s+([a-zA-Z0-9_]+)\s*:\s*([^;]+);/);
          if (parts) {
            console.log(`  ${parts[1]}: ${parts[2]}`);
          }
        });
      }
    }

    // Extract the implemented functions
    console.log('\nImplemented functions:');
    const functionMatches = indexTs.match(/export\s+function\s+([a-zA-Z0-9_]+)\s*\([^\)]*\)/g);
    if (functionMatches) {
      functionMatches.forEach(funcMatch => {
        const funcNameMatch = funcMatch.match(/export\s+function\s+([a-zA-Z0-9_]+)/);
        if (funcNameMatch) {
          console.log(`  - ${funcNameMatch[1]}`);
        }
      });
    }

    // Check if WebAssembly file exists
    try {
      const stats = readFileSync(WASM_PATH);
      console.log(`\nWebAssembly file found: ${WASM_PATH} (${stats.length} bytes)`);
    } catch (error) {
      console.warn(`WebAssembly file not found: ${WASM_PATH}`);
    }

    console.log(''); // Empty line for spacing
    return true;
  } catch (error) {
    console.warn('Could not read AssemblyScript implementation file:', error.message);
    return false;
  }
}

// Function to format data as a table
function formatAsTable(headers, rows) {
  // Calculate column widths
  const columnWidths = headers.map((header, index) => {
    const maxDataWidth = rows.reduce((max, row) => {
      const cellValue = String(row[index] || '').substring(0, 30); // Limit cell width for display
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

// Mock data for GitHub events
const MOCK_EVENTS = [
  {
    id: "29285330200",
    type: "PushEvent",
    actor: {
      id: 12345,
      login: "user1",
      display_login: "user1",
      gravatar_id: "",
      url: "https://api.github.com/users/user1",
      avatar_url: "https://avatars.githubusercontent.com/u/12345"
    },
    repo: {
      id: 54321,
      name: "user1/repo1",
      url: "https://api.github.com/repos/user1/repo1"
    },
    payload: {
      push_id: 12345678,
      size: 1,
      distinct_size: 1,
      ref: "refs/heads/main",
      head: "abcdef1234567890",
      before: "0987654321fedcba",
      commits: [
        {
          sha: "abcdef1234567890",
          author: {
            email: "user1@example.com",
            name: "User 1"
          },
          message: "Update README.md",
          distinct: true,
          url: "https://api.github.com/repos/user1/repo1/commits/abcdef1234567890"
        }
      ]
    },
    public: true,
    created_at: "2023-01-01T00:00:00Z"
  },
  {
    id: "29285330201",
    type: "PullRequestEvent",
    actor: {
      id: 12346,
      login: "user2",
      display_login: "user2",
      gravatar_id: "",
      url: "https://api.github.com/users/user2",
      avatar_url: "https://avatars.githubusercontent.com/u/12346"
    },
    repo: {
      id: 54322,
      name: "user2/repo2",
      url: "https://api.github.com/repos/user2/repo2"
    },
    payload: {
      action: "opened",
      number: 123,
      pull_request: {
        url: "https://api.github.com/repos/user2/repo2/pulls/123",
        id: 987654321,
        state: "open",
        title: "Add new feature",
        user: {
          login: "user2"
        },
        body: "This PR adds a new feature",
        created_at: "2023-01-02T00:00:00Z",
        updated_at: "2023-01-02T00:00:00Z"
      }
    },
    public: true,
    created_at: "2023-01-02T00:00:00Z"
  },
  {
    id: "29285330202",
    type: "IssueCommentEvent",
    actor: {
      id: 12347,
      login: "user3",
      display_login: "user3",
      gravatar_id: "",
      url: "https://api.github.com/users/user3",
      avatar_url: "https://avatars.githubusercontent.com/u/12347"
    },
    repo: {
      id: 54323,
      name: "user3/repo3",
      url: "https://api.github.com/repos/user3/repo3"
    },
    payload: {
      action: "created",
      issue: {
        url: "https://api.github.com/repos/user3/repo3/issues/456",
        id: 123456789,
        number: 456,
        title: "Bug report",
        user: {
          login: "user3"
        },
        state: "open",
        body: "There is a bug in the code",
        created_at: "2023-01-03T00:00:00Z",
        updated_at: "2023-01-03T00:00:00Z"
      },
      comment: {
        url: "https://api.github.com/repos/user3/repo3/issues/comments/123456",
        id: 123456,
        user: {
          login: "user3"
        },
        body: "I found the issue",
        created_at: "2023-01-03T00:00:00Z",
        updated_at: "2023-01-03T00:00:00Z"
      }
    },
    public: true,
    created_at: "2023-01-03T00:00:00Z"
  },
  {
    id: "29285330203",
    type: "WatchEvent",
    actor: {
      id: 12348,
      login: "user4",
      display_login: "user4",
      gravatar_id: "",
      url: "https://api.github.com/users/user4",
      avatar_url: "https://avatars.githubusercontent.com/u/12348"
    },
    repo: {
      id: 54324,
      name: "user4/repo4",
      url: "https://api.github.com/repos/user4/repo4"
    },
    payload: {
      action: "started"
    },
    public: true,
    created_at: "2023-01-04T00:00:00Z"
  },
  {
    id: "29285330204",
    type: "ForkEvent",
    actor: {
      id: 12349,
      login: "user5",
      display_login: "user5",
      gravatar_id: "",
      url: "https://api.github.com/users/user5",
      avatar_url: "https://avatars.githubusercontent.com/u/12349"
    },
    repo: {
      id: 54325,
      name: "user5/repo5",
      url: "https://api.github.com/repos/user5/repo5"
    },
    payload: {
      forkee: {
        id: 98765432,
        name: "repo5-fork",
        full_name: "user5/repo5-fork",
        owner: {
          login: "user5",
          id: 12349
        },
        html_url: "https://github.com/user5/repo5-fork",
        description: "A fork of repo5",
        fork: true,
        created_at: "2023-01-05T00:00:00Z",
        updated_at: "2023-01-05T00:00:00Z",
        pushed_at: "2023-01-05T00:00:00Z"
      }
    },
    public: true,
    created_at: "2023-01-05T00:00:00Z"
  }
];

// Function to display mock data
function displayMockData() {
  try {
    console.log('Displaying mock data from the AssemblyScript WebAssembly FDW implementation');

    // Get project information from package.json
    getProjectInfo();

    // Get WIT information
    getWitInfo();

    // Get AssemblyScript implementation information
    getAssemblyScriptImplementation();

    // Prepare data for display
    const headers = ['id', 'type', 'actor', 'repo', 'payload', 'public', 'created_at'];
    const rows = MOCK_EVENTS.map(event => [
      event.id,
      event.type,
      JSON.stringify(event.actor).substring(0, 30) + '...',
      JSON.stringify(event.repo).substring(0, 30) + '...',
      JSON.stringify(event.payload).substring(0, 30) + '...',
      event.public.toString(),
      event.created_at
    ]);

    // Display the data as a table
    console.log('\nMock Data:');
    console.log(formatAsTable(headers, rows));
    console.log(`\nTotal rows: ${rows.length}`);

    // Display detailed JSON for the first event
    console.log('\nDetailed view of first event:');
    const firstEvent = MOCK_EVENTS[0];

    console.log(`id: ${firstEvent.id}`);
    console.log(`type: ${firstEvent.type}`);

    console.log('\nactor:');
    console.log(JSON.stringify(firstEvent.actor, null, 2));

    console.log('\nrepo:');
    console.log(JSON.stringify(firstEvent.repo, null, 2));

    console.log('\npayload:');
    console.log(JSON.stringify(firstEvent.payload, null, 2));

    console.log(`public: ${firstEvent.public}`);
    console.log(`created_at: ${firstEvent.created_at}`);

    // Note about WebAssembly Component Model
    console.log('\nNote: This test displays mock data for the AssemblyScript implementation.');
    console.log('The AssemblyScript implementation uses the WebAssembly Component Model for compatibility with Supabase Wrappers.');

    console.log('\nMock data display completed successfully.');
    return true;
  } catch (error) {
    console.error('Error displaying mock data:', error);
    return false;
  }
}

// Run the display function
displayMockData(); 