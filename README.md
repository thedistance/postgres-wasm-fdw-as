# Postgres Wasm FDW [AssemblyScript Implementation]

This project demonstrates how to create a Postgres Foreign Data Wrapper with WebAssembly using AssemblyScript, based on the [Wrappers framework](https://github.com/supabase/wrappers).

This example reads the [realtime GitHub events](https://api.github.com/events) into a Postgres database.

## Project Structure

```bash
├── assembly
│   ├── index.ts            # Main entry point for the AssemblyScript code
│   ├── minimal-static.ts   # Simplified implementation with static data
│   ├── component-model.ts  # Implementation using the WebAssembly Component Model format
│   ├── types.ts            # Type definitions
│   └── bindings.ts         # Bindings for the Wasm Interface Types
├── wit                     # The WIT interface this project will use to build the Wasm package
│   └── world.wit
└── supabase-wrappers-wit   # The Wasm Interface Type provided by Supabase
    ├── http.wit
    ├── jwt.wit
    ├── routines.wit
    ├── stats.wit
    ├── time.wit
    ├── types.wit
    ├── utils.wit
    └── world.wit
```

A [Wasm Interface Type](https://github.com/bytecodealliance/wit-bindgen) (WIT) defines the interfaces between the Wasm FDW (guest) and the Wasm runtime (host). For example, the `http.wit` defines the HTTP related types and functions can be used in the guest, and the `routines.wit` defines the functions the guest needs to implement.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run asbuild
   ```
   This will build both the main WebAssembly module and the minimal static version, and also generate a CSV file with static test data.

3. Follow the [Wasm FDW developing guide](https://fdw.dev/guides/create-wasm-wrapper/) for integration with PostgreSQL.

## Deployment Testing

For deployment testing, this project includes a simplified version that uses static data instead of making HTTP requests. This is useful for testing the FDW in environments where HTTP requests might be restricted or unreliable.

### Using Static Data

The project includes a main index.cjs file that exports static data in both JSON and CSV formats. This can be used to verify that the data is correctly formatted and can be easily imported into a database.

To use the static data:

1. Run the main script:
   ```
   npm start
   ```

2. This will output the static data in CSV format, which can be used for testing.

3. You can also import the functions from the index.cjs file in your own code:
   ```javascript
   const { staticData, toCSV, getData } = require('./index.cjs');
   
   // Use the static data
   console.log(staticData);
   
   // Convert to CSV
   const csv = toCSV(staticData);
   console.log(csv);
   
   // Get all data with metadata
   const allData = getData();
   console.log(allData);
   ```

### Building the Minimal Static Version

To build only the minimal static version of the WebAssembly module:

```
npm run asbuild:minimal
```

This will create a WebAssembly module that uses static data instead of making HTTP requests.

### Building for Deployment

For deployment, you can use the `build` script which builds the minimal static version and generates a CSV file with the static data:

```
npm run build
```

This will:
1. Build the minimal static WebAssembly module
2. Generate a CSV file with the static test data (static-data-output.csv)

The generated CSV file is included in the release artifacts and can be used for testing in deployment environments.

## WebAssembly Component Model

This project also includes an implementation that aligns with the WebAssembly Component Model format, which is compatible with the Rust implementation and Supabase requirements.

### Building the Component Model Version

To build the component model version of the WebAssembly module:

```
npm run build:component
```

This will:
1. Build the component model WebAssembly module
2. Run tests to verify the component model functionality
3. Copy the WebAssembly module to the build-component directory with the correct naming convention

### Testing the Component Model

To test only the component model implementation:

```
npm run test:component
```

This will build the component model WebAssembly module and run a test script that verifies the exported functions are working correctly.

### Component Model Structure

The component model implementation (`assembly/component-model.ts`) follows the same interface as the Rust implementation, with the following key functions:

- `host_version_requirement()`: Returns the required host version
- `init(ctx)`: Initializes the FDW
- `begin_scan(ctx)`: Begins scanning the foreign table
- `iter_scan(ctx, row)`: Iterates through the foreign table
- `end_scan(ctx)`: Ends scanning the foreign table
- `begin_modify(ctx)`: Begins modifying the foreign table
- `insert(ctx, row)`: Inserts a row into the foreign table
- `update(ctx, rowid, row)`: Updates a row in the foreign table
- `delete_(ctx, rowid)`: Deletes a row from the foreign table
- `end_modify(ctx)`: Ends modifying the foreign table

The component model implementation uses static mock data for demonstration purposes.

### Verifying Component Model Compatibility

To verify that the component model WebAssembly module is compatible with the Supabase Wrappers framework:

```
npm run verify:component
```

This will:
1. Build the component model WebAssembly module
2. Run tests to verify the component model functionality
3. Copy the WebAssembly module to the build-component directory
4. Verify that all required functions are present in the WebAssembly module
5. Check that the host version requirement is set correctly

The verification script will output a summary of the compatibility check, indicating whether the WebAssembly module is compatible with the Supabase Wrappers framework.

## License

[Apache License Version 2.0](./LICENSE) 