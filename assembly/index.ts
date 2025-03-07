// Main entry point for the AssemblyScript implementation of the Postgres Wasm FDW
import { JSON } from "assemblyscript-json";
import {
  HttpMethod,
  HttpRequest,
  Cell,
  Context,
  Row,
  OptionsType,
  TypeOid
} from "./types";
import { http, time, utils, parseJsonArray } from "./bindings";

// ExampleFdw class implements the FDW interface
class ExampleFdw {
  // Static instance
  private static instance: ExampleFdw | null = null;

  // Instance properties
  private baseUrl: string = "";
  private srcRows: JSON.Arr | null = null;
  private srcIdx: number = 0;

  // Get the singleton instance
  static getInstance(): ExampleFdw {
    if (ExampleFdw.instance === null) {
      ExampleFdw.instance = new ExampleFdw();
    }
    return ExampleFdw.instance;
  }

  // Host version requirement
  host_version_requirement(): string {
    // semver expression for Wasm FDW host version requirement
    return "^0.1.0";
  }

  // Initialize the FDW
  init(ctx: Context): string | null {
    const opts = ctx.get_options(OptionsType.Server);
    this.baseUrl = opts.requireOr("api_url", "https://api.github.com");
    return null;
  }

  // Begin scanning the foreign table
  begin_scan(ctx: Context): string | null {
    const opts = ctx.get_options(OptionsType.Table);
    const object = opts.require("object");
    const url = `${this.baseUrl}/${object}`;

    const headers = new Map<string, string>();
    headers.set("user-agent", "Example FDW");

    const req = new HttpRequest(HttpMethod.Get, url, headers);
    const resp = http.get(req);

    if (resp.status !== 200) {
      return `HTTP request failed with status ${resp.status}`;
    }

    this.srcRows = parseJsonArray(resp.body);
    if (this.srcRows === null) {
      return "Failed to parse JSON response";
    }

    this.srcIdx = 0;
    utils.report_info(`We got response array length: ${this.srcRows.length.toString()}`);

    return null;
  }

  // Iterate through the foreign table
  iter_scan(ctx: Context, row: Row): number | null {
    if (this.srcRows === null || this.srcIdx >= this.srcRows.length) {
      return null;
    }

    const srcRow = this.srcRows.at(this.srcIdx);
    if (srcRow === null || !srcRow.isObj) {
      return null;
    }

    const srcObj = <JSON.Obj>srcRow;

    for (let i = 0; i < ctx.get_columns().length; i++) {
      const tgtCol = ctx.get_columns()[i];
      const tgtColName = tgtCol.name();
      
      const src = srcObj.has(tgtColName) ? srcObj.get(tgtColName) : null;
      if (src === null) {
        // Return null instead of a string to indicate an error
        return null;
      }

      let cell: Cell | null = null;

      switch (tgtCol.type_oid()) {
        case TypeOid.Bool:
          if (src.isBool) {
            cell = { kind: "Bool", value: (<JSON.Bool>src).valueOf() };
          }
          break;
        case TypeOid.String:
          if (src.isString) {
            cell = { kind: "String", value: (<JSON.Str>src).valueOf() };
          }
          break;
        case TypeOid.Timestamp:
          if (src.isString) {
            const ts = time.parse_from_rfc3339((<JSON.Str>src).valueOf());
            cell = { kind: "Timestamp", value: ts };
          }
          break;
        case TypeOid.Json:
          if (src.isObj) {
            cell = { kind: "Json", value: src.toString() };
          }
          break;
        default:
          // Return null instead of a string to indicate an error
          return null;
      }

      row.push(cell);
    }

    this.srcIdx++;
    return 0;
  }

  // Re-scan the foreign table
  re_scan(_ctx: Context): string | null {
    return "re_scan on foreign table is not supported";
  }

  // End scanning the foreign table
  end_scan(_ctx: Context): string | null {
    if (this.srcRows !== null) {
      this.srcRows = null;
    }
    return null;
  }

  // Begin modifying the foreign table
  begin_modify(_ctx: Context): string | null {
    return "modify on foreign table is not supported";
  }

  // Insert a row into the foreign table
  insert(_ctx: Context, _row: Row): string | null {
    return null;
  }

  // Update a row in the foreign table
  update(_ctx: Context, _rowid: Cell, _row: Row): string | null {
    return null;
  }

  // Delete a row from the foreign table
  delete(_ctx: Context, _rowid: Cell): string | null {
    return null;
  }

  // End modifying the foreign table
  end_modify(_ctx: Context): string | null {
    return null;
  }
}

// Export the FDW instance
export function host_version_requirement(): string {
  return ExampleFdw.getInstance().host_version_requirement();
}

export function init(ctx: Context): string | null {
  return ExampleFdw.getInstance().init(ctx);
}

export function begin_scan(ctx: Context): string | null {
  return ExampleFdw.getInstance().begin_scan(ctx);
}

export function iter_scan(ctx: Context, row: Row): number | null {
  return ExampleFdw.getInstance().iter_scan(ctx, row);
}

export function re_scan(ctx: Context): string | null {
  return ExampleFdw.getInstance().re_scan(ctx);
}

export function end_scan(ctx: Context): string | null {
  return ExampleFdw.getInstance().end_scan(ctx);
}

export function begin_modify(ctx: Context): string | null {
  return ExampleFdw.getInstance().begin_modify(ctx);
}

export function insert(ctx: Context, row: Row): string | null {
  return ExampleFdw.getInstance().insert(ctx, row);
}

export function update(ctx: Context, rowid: Cell, row: Row): string | null {
  return ExampleFdw.getInstance().update(ctx, rowid, row);
}

export function delete_(ctx: Context, rowid: Cell): string | null {
  return ExampleFdw.getInstance().delete(ctx, rowid);
}

export function end_modify(ctx: Context): string | null {
  return ExampleFdw.getInstance().end_modify(ctx);
} 