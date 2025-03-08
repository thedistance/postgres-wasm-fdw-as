# AssemblyScript WebAssembly FDW for Postgres

This project is an AssemblyScript implementation of a WebAssembly Foreign Data Wrapper (FDW) for PostgreSQL, compatible with the [Supabase Wrappers framework](https://github.com/supabase/wrappers). It provides a mock implementation of the GitHub Events API as a foreign table in PostgreSQL.

## Project Structure

```
├── assembly/            # AssemblyScript source code
│   └── index.ts         # Main implementation of the WebAssembly FDW
├── build/               # Build output directory
├── build-component/     # Component model build output directory
├── scripts/             # Utility scripts
│   └── convert-to-component.js  # Script to convert the WebAssembly module to the component model format
├── tests/               # Test files
│   ├── index.js         # Main test file
│   └── verify-component.js  # Script to verify the component model compatibility
├── package.json         # Project configuration
└── README.md            # This file
```

## Features

- Implements the WebAssembly FDW interface compatible with the Supabase Wrappers framework
- Provides mock data for GitHub events
- Supports all required FDW functions:
  - `host_version_requirement`
  - `init`
  - `begin_scan`
  - `iter_scan`
  - `re_scan`
  - `end_scan`
  - `begin_modify`
  - `insert`
  - `update`
  - `delete_`
  - `end_modify`

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/as-wasm-fdw.git
   cd as-wasm-fdw
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Building

To build the project:

```
npm run build
```

This will compile the AssemblyScript code to WebAssembly and output the result to the `build` directory.

### Testing

To run the tests:

```
npm test
```

This will build the project and run the test script, which verifies that the WebAssembly module implements all the required functions and behaves correctly.

### Building for Component Model

To build the project for the component model format:

```
npm run build:component
```

This will compile the AssemblyScript code to WebAssembly and copy the result to the `build-component` directory with the correct naming convention.

### Verifying Component Model Compatibility

To verify that the WebAssembly module is compatible with the Supabase Wrappers framework:

```
npm run verify
```

This will build the project for the component model format and run the verification script, which checks that all required functions are present and correctly implemented.

## Usage with PostgreSQL

To use this WebAssembly FDW with PostgreSQL, you need to:

1. Install the [Supabase Wrappers extension](https://github.com/supabase/wrappers) for PostgreSQL.

2. Copy the WebAssembly module from the `build-component` directory to the appropriate location for the Supabase Wrappers extension.

3. Create a foreign server and foreign table in PostgreSQL:

```sql
CREATE FOREIGN DATA WRAPPER wasm_fdw
  HANDLER wasm_fdw_handler
  VALIDATOR wasm_fdw_validator;

CREATE SERVER github_events_server
  FOREIGN DATA WRAPPER wasm_fdw
  OPTIONS (
    wasm_module 'as_wasm_fdw',
    api_url 'https://api.github.com'
  );

CREATE FOREIGN TABLE github_events (
  id TEXT,
  type TEXT,
  actor JSONB,
  repo JSONB,
  payload JSONB,
  public BOOLEAN,
  created_at TIMESTAMP
)
  SERVER github_events_server
  OPTIONS (
    object 'events'
  );
```

4. Query the foreign table:

```sql
SELECT * FROM github_events LIMIT 10;
```

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 