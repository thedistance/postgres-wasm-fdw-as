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
  export function parse_from_rfc3339(timestamp: string): number {
    // In a real implementation, this would call the host function
    // For now, we'll return a dummy timestamp
    return Date.now();
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
  try {
    const parsed = <JSON.Obj>JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    return null;
  }
}

// JSON array parsing helper
export function parseJsonArray(jsonStr: string): JSON.Arr | null {
  try {
    const parsed = <JSON.Arr>JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    return null;
  }
} 