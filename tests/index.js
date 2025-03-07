// Simple test for the AssemblyScript implementation
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';

async function test() {
  try {
    // Load the WebAssembly module
    const wasmModule = readFileSync('./build/release.wasm');
    const { exports } = await instantiate(wasmModule);

    console.log('WebAssembly module loaded successfully');
    console.log('Host version requirement:', exports.host_version_requirement());

    // TODO: Add more tests here

    console.log('All tests passed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 