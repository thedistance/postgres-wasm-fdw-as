# Postgres Wasm FDW [AssemblyScript Implementation]

This project demonstrates how to create a Postgres Foreign Data Wrapper with WebAssembly using AssemblyScript, based on the [Wrappers framework](https://github.com/supabase/wrappers).

This example reads the [realtime GitHub events](https://api.github.com/events) into a Postgres database.

## Project Structure

```bash
├── assembly
│   ├── index.ts            # Main entry point for the AssemblyScript code
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

3. Follow the [Wasm FDW developing guide](https://fdw.dev/guides/create-wasm-wrapper/) for integration with PostgreSQL.

## License

[Apache License Version 2.0](./LICENSE) 