// AssemblyScript implementation of the Postgres Wasm FDW using the Component Model
// This implementation aligns with the Rust version's data format

// Cell represents a value in a row
export class Cell {
  kind: string;
  
  constructor(kind: string) {
    this.kind = kind;
  }
}

export class BoolCell extends Cell {
  value: boolean;
  
  constructor(value: boolean) {
    super("Bool");
    this.value = value;
  }
}

export class IntCell extends Cell {
  value: i32;
  
  constructor(value: i32) {
    super("Int");
    this.value = value;
  }
}

export class StringCell extends Cell {
  value: string;
  
  constructor(value: string) {
    super("String");
    this.value = value;
  }
}

export class TimestampCell extends Cell {
  value: i64;
  
  constructor(value: i64) {
    super("Timestamp");
    this.value = value;
  }
}

export class JsonCell extends Cell {
  value: string;
  
  constructor(value: string) {
    super("Json");
    this.value = value;
  }
}

export class NullCell extends Cell {
  constructor() {
    super("Null");
  }
}

// Row represents a row in a table
export class Row {
  private cells: Array<Cell>;

  constructor() {
    this.cells = new Array<Cell>();
  }

  push(cell: Cell | null): void {
    if (cell === null) {
      this.cells.push(new NullCell());
    } else {
      this.cells.push(cell);
    }
  }

  get(index: i32): Cell {
    return this.cells[index];
  }
}

// Context provides access to the FDW context
export class Context {
  private columns: Array<Column>;
  private options: Map<i32, Options>;

  constructor() {
    this.columns = new Array<Column>();
    this.options = new Map<i32, Options>();
  }

  get_columns(): Array<Column> {
    return this.columns;
  }

  get_options(type: i32): Options {
    if (this.options.has(type)) {
      return this.options.get(type);
    }
    return new Options();
  }
}

// Column definition
export class Column {
  private name_: string;
  private typeOid_: i32;

  constructor(name: string, typeOid: i32) {
    this.name_ = name;
    this.typeOid_ = typeOid;
  }

  name(): string {
    return this.name_;
  }

  type_oid(): i32 {
    return this.typeOid_;
  }
}

// Options for the FDW
export class Options {
  private options: Map<string, string>;

  constructor() {
    this.options = new Map<string, string>();
  }

  get(key: string): string | null {
    if (this.options.has(key)) {
      return this.options.get(key);
    }
    return null;
  }

  require(key: string): string {
    const value = this.get(key);
    if (value === null) {
      throw new Error(`Option '${key}' is required but not provided`);
    }
    return value;
  }

  requireOr(key: string, defaultValue: string): string {
    const value = this.get(key);
    return value !== null ? value : defaultValue;
  }
}

// Mock data from the CSV file
class MockEvent {
  id: string;
  type: string;
  actor: string;
  repo: string;
  payload: string;
  isPublic: boolean;
  created_at: string;

  constructor(
    id: string,
    type: string,
    actor: string,
    repo: string,
    payload: string,
    public_: boolean,
    created_at: string
  ) {
    this.id = id;
    this.type = type;
    this.actor = actor;
    this.repo = repo;
    this.payload = payload;
    this.isPublic = public_;
    this.created_at = created_at;
  }
}

// Static mock data from the CSV file
const MOCK_EVENTS: MockEvent[] = [
  new MockEvent(
    "12345",
    "PushEvent",
    "{\"login\":\"user1\",\"id\":1001}",
    "{\"name\":\"repo1\",\"id\":2001}",
    "{\"size\":1,\"commits\":[]}",
    true,
    "2023-01-01T00:00:00Z"
  ),
  new MockEvent(
    "12346",
    "PullRequestEvent",
    "{\"login\":\"user2\",\"id\":1002}",
    "{\"name\":\"repo2\",\"id\":2002}",
    "{\"action\":\"opened\"}",
    true,
    "2023-01-02T00:00:00Z"
  ),
  new MockEvent(
    "12347",
    "IssueCommentEvent",
    "{\"login\":\"user3\",\"id\":1003}",
    "{\"name\":\"repo3\",\"id\":2003}",
    "{\"action\":\"created\",\"issue\":{\"number\":42}}",
    true,
    "2023-01-03T00:00:00Z"
  ),
  new MockEvent(
    "12348",
    "WatchEvent",
    "{\"login\":\"user4\",\"id\":1004}",
    "{\"name\":\"repo4\",\"id\":2004}",
    "{\"action\":\"started\"}",
    true,
    "2023-01-04T00:00:00Z"
  ),
  new MockEvent(
    "12349",
    "ForkEvent",
    "{\"login\":\"user5\",\"id\":1005}",
    "{\"name\":\"repo5\",\"id\":2005}",
    "{\"forkee\":{\"id\":3001}}",
    true,
    "2023-01-05T00:00:00Z"
  )
];

// Main FDW implementation
class ExampleFdw {
  // Static instance
  private static instance: ExampleFdw = new ExampleFdw();

  // Instance properties
  private baseUrl: string = "";
  private srcRows: MockEvent[] = [];
  private srcIdx: i32 = 0;

  // Get the singleton instance
  static getInstance(): ExampleFdw {
    return ExampleFdw.instance;
  }

  // Host version requirement
  host_version_requirement(): string {
    // semver expression for Wasm FDW host version requirement
    return "^0.1.0";
  }

  // Initialize the FDW
  init(ctx: Context): string {
    const opts = ctx.get_options(0); // Server options
    this.baseUrl = opts.requireOr("api_url", "https://api.github.com");
    return "";
  }

  // Begin scanning the foreign table
  begin_scan(ctx: Context): string {
    // In a real implementation, we would fetch data from the API
    // For now, we'll use the mock data
    this.srcRows = MOCK_EVENTS;
    this.srcIdx = 0;
    return "";
  }

  // Iterate through the foreign table
  iter_scan(ctx: Context, row: Row): i32 {
    if (this.srcIdx >= this.srcRows.length) {
      return -1; // No more rows (equivalent to Ok(None) in Rust)
    }

    const srcRow = this.srcRows[this.srcIdx];

    for (let i = 0; i < ctx.get_columns().length; i++) {
      const tgtCol = ctx.get_columns()[i];
      const tgtColName = tgtCol.name();
      
      let cell: Cell | null = null;

      if (tgtColName == "id") {
        cell = new StringCell(srcRow.id);
      } else if (tgtColName == "type") {
        cell = new StringCell(srcRow.type);
      } else if (tgtColName == "actor") {
        cell = new JsonCell(srcRow.actor);
      } else if (tgtColName == "repo") {
        cell = new JsonCell(srcRow.repo);
      } else if (tgtColName == "payload") {
        cell = new JsonCell(srcRow.payload);
      } else if (tgtColName == "public") {
        cell = new BoolCell(srcRow.isPublic);
      } else if (tgtColName == "created_at") {
        // Convert the ISO string to a timestamp
        // For simplicity, we'll use a fixed timestamp plus an offset
        const timestamp = i64(1672531200000 + this.srcIdx * 86400000); // Jan 1, 2023 + days
        cell = new TimestampCell(timestamp);
      } else {
        // Unknown column
        return -2; // Error
      }

      row.push(cell);
    }

    this.srcIdx++;
    return 0; // Success (equivalent to Ok(Some(0)) in Rust)
  }

  // Re-scan the foreign table
  re_scan(_ctx: Context): string {
    this.srcIdx = 0;
    return "";
  }

  // End scanning the foreign table
  end_scan(_ctx: Context): string {
    this.srcRows = [];
    return "";
  }

  // Begin modifying the foreign table
  begin_modify(_ctx: Context): string {
    return "modify on foreign table is not supported";
  }

  // Insert a row into the foreign table
  insert(_ctx: Context, _row: Row): string {
    return "insert on foreign table is not supported";
  }

  // Update a row in the foreign table
  update(_ctx: Context, _rowid: Cell, _row: Row): string {
    return "update on foreign table is not supported";
  }

  // Delete a row from the foreign table
  delete(_ctx: Context, _rowid: Cell): string {
    return "delete on foreign table is not supported";
  }

  // End modifying the foreign table
  end_modify(_ctx: Context): string {
    return "";
  }
}

// Export the FDW instance functions
export function host_version_requirement(): string {
  return ExampleFdw.getInstance().host_version_requirement();
}

export function init(ctx: Context): string {
  return ExampleFdw.getInstance().init(ctx);
}

export function begin_scan(ctx: Context): string {
  return ExampleFdw.getInstance().begin_scan(ctx);
}

export function iter_scan(ctx: Context, row: Row): i32 {
  return ExampleFdw.getInstance().iter_scan(ctx, row);
}

export function re_scan(ctx: Context): string {
  return ExampleFdw.getInstance().re_scan(ctx);
}

export function end_scan(ctx: Context): string {
  return ExampleFdw.getInstance().end_scan(ctx);
}

export function begin_modify(ctx: Context): string {
  return ExampleFdw.getInstance().begin_modify(ctx);
}

export function insert(ctx: Context, row: Row): string {
  return ExampleFdw.getInstance().insert(ctx, row);
}

export function update(ctx: Context, rowid: Cell, row: Row): string {
  return ExampleFdw.getInstance().update(ctx, rowid, row);
}

export function delete_(ctx: Context, rowid: Cell): string {
  return ExampleFdw.getInstance().delete(ctx, rowid);
}

export function end_modify(ctx: Context): string {
  return ExampleFdw.getInstance().end_modify(ctx);
} 