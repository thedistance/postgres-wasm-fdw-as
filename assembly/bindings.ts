// Bindings for the Wasm Interface Types
import { JSON } from "../node_modules/assemblyscript-json/assembly/index";
import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  Cell,
  Context,
  Row
} from "./types";

// HTTP bindings
export namespace http {
  export function get(request: HttpRequest): HttpResponse {
    // In a real implementation, this would call the host function
    // For now, we'll simulate it
    return new HttpResponse(200, new Map<string, string>(), "[]");
  }
}

// Time bindings
export namespace time {
  export function parse_from_rfc3339(timestamp: string): i64 {
    // In a real implementation, this would call the host function
    // For now, we'll return a dummy timestamp
    return i64(Date.now());
  }
}

// Utils bindings
export namespace utils {
  export function report_info(message: string): void {
    // In a real implementation, this would call the host function
    // For now, we'll do nothing
    console.log(message);
  }
}

// JSON parsing helper
export function parseJson(jsonStr: string): JSON.Obj | null {
  // AssemblyScript doesn't support try/catch, so we'll use a simpler approach
  const parsed = JSON.parse(jsonStr);
  if (parsed && parsed.isObj) {
    return <JSON.Obj>parsed;
  }
  return null;
}

// JSON array parsing helper
export function parseJsonArray(jsonStr: string): JSON.Arr | null {
  // AssemblyScript doesn't support try/catch, so we'll use a simpler approach
  const parsed = JSON.parse(jsonStr);
  if (parsed && parsed.isArr) {
    return <JSON.Arr>parsed;
  }
  return null;
} 