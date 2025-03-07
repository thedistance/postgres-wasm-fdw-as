// HTTP Test for WebAssembly FDW
import { readFileSync } from 'fs';
import { instantiate } from '@assemblyscript/loader';
import fetch from 'node-fetch';

async function test() {
  try {
    console.log('Loading WebAssembly module...');
    const wasmModule = readFileSync('./build/release.wasm');

    // Create a memory object
    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });

    // Create text encoder/decoder for string handling
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    // Function to write a string to memory
    function writeString(str) {
      const bytes = textEncoder.encode(str);
      const ptr = exports.__new(bytes.length, 1); // String id = 1
      const memory = new Uint8Array(exports.memory.buffer);
      memory.set(bytes, ptr);
      return ptr;
    }

    // Function to read a string from memory
    function readString(ptr) {
      const memory = new Uint8Array(exports.memory.buffer);
      let end = ptr;
      while (memory[end]) end++;
      return textDecoder.decode(memory.subarray(ptr, end));
    }

    // Mock HTTP response
    function mockHttpResponse(status, body) {
      // In a real implementation, this would create a proper response object
      // that the WebAssembly module can interact with
      console.log(`Mock HTTP response: status=${status}, body=${body}`);
      return {
        status,
        body: writeString(body),
        headers: new Map()
      };
    }

    // Fetch real data from GitHub API
    async function fetchGitHubData() {
      try {
        console.log('Fetching data from GitHub API...');
        const response = await fetch('https://api.github.com/events');
        const data = await response.json();
        console.log(`Fetched ${data.length} events from GitHub API`);
        return data;
      } catch (error) {
        console.error('Error fetching from GitHub API:', error);
        return [];
      }
    }

    // Get real GitHub data
    const githubData = await fetchGitHubData();

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
      },
      http: {
        get: function (requestPtr) {
          console.log('HTTP GET called');
          // In a real implementation, this would make an actual HTTP request
          // For now, we'll return a mock response with real GitHub data
          return mockHttpResponse(200, JSON.stringify(githubData));
        }
      },
      time: {
        parse_from_rfc3339: function (timestampPtr) {
          console.log('parse_from_rfc3339 called');
          return BigInt(Date.now());
        }
      },
      utils: {
        report_info: function (messagePtr) {
          const message = readString(messagePtr);
          console.log('Info:', message);
        }
      }
    });

    console.log('WebAssembly module loaded successfully');

    // Test host_version_requirement
    const versionReq = exports.host_version_requirement();
    console.log('Host version requirement:', versionReq);

    // Create a simple context with the required options
    const ctx = {
      get_options: function (type) {
        if (type === 0) { // Server options
          return {
            get: function (key) {
              if (key === 'api_url') return writeString('https://api.github.com');
              return null;
            },
            has: function (key) {
              return key === 'api_url';
            },
            require: function (key) {
              if (key === 'api_url') return writeString('https://api.github.com');
              throw new Error(`Required option '${key}' not found`);
            },
            requireOr: function (key, defaultValue) {
              if (key === 'api_url') return writeString('https://api.github.com');
              return writeString(defaultValue);
            }
          };
        } else { // Table options
          return {
            get: function (key) {
              if (key === 'object') return writeString('events');
              if (key === 'rowid_column') return writeString('id');
              return null;
            },
            has: function (key) {
              return key === 'object' || key === 'rowid_column';
            },
            require: function (key) {
              if (key === 'object') return writeString('events');
              if (key === 'rowid_column') return writeString('id');
              throw new Error(`Required option '${key}' not found`);
            },
            requireOr: function (key, defaultValue) {
              if (key === 'object') return writeString('events');
              if (key === 'rowid_column') return writeString('id');
              return writeString(defaultValue);
            }
          };
        }
      },
      get_columns: function () {
        return [
          {
            name: function () { return writeString('id'); },
            type_oid: function () { return 3; } // String
          },
          {
            name: function () { return writeString('type'); },
            type_oid: function () { return 3; } // String
          }
        ];
      }
    };

    // Test init
    try {
      console.log('\nTesting init...');
      const initResult = exports.init(ctx);
      console.log('Init result:', initResult);
    } catch (error) {
      console.error('Error in init:', error);
    }

    // Test begin_scan
    try {
      console.log('\nTesting begin_scan...');
      const beginScanResult = exports.begin_scan(ctx);
      console.log('Begin scan result:', beginScanResult);
    } catch (error) {
      console.error('Error in begin_scan:', error);
    }

    console.log('\nHTTP test completed!');
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 