#!/bin/bash

# Install dependencies
npm install

# Build the project
npm run asbuild

# Copy the built WebAssembly module to the appropriate location
# This is just a placeholder, you'll need to adjust this based on your setup
# mkdir -p /path/to/wasm/modules
# cp build/release.wasm /path/to/wasm/modules/postgres-wasm-fdw-as.wasm

echo "Build completed. WebAssembly module is available at build/release.wasm" 