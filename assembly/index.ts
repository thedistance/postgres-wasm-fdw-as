// AssemblyScript implementation of the Postgres Wasm FDW
// This implementation aligns with the Rust version's data format but uses mock data
// It follows the WebAssembly Component Model specification for compatibility with Supabase Wrappers

/**
 * Cell represents a value in a row
 * Base class for all cell types in the FDW
 */
class Cell {
  kind: string;
  
  constructor(kind: string) {
    this.kind = kind;
  }
}

/**
 * BoolCell represents a boolean value in a row
 */
class BoolCell extends Cell {
  value: boolean;
  
  constructor(value: boolean) {
    super("Bool");
    this.value = value;
  }
}

/**
 * IntCell represents an integer value in a row
 */
class IntCell extends Cell {
  value: i32;
  
  constructor(value: i32) {
    super("Int");
    this.value = value;
  }
}

/**
 * StringCell represents a string value in a row
 */
class StringCell extends Cell {
  value: string;
  
  constructor(value: string) {
    super("String");
    this.value = value;
  }
}

/**
 * TimestampCell represents a timestamp value in a row
 */
class TimestampCell extends Cell {
  value: f64;
  
  constructor(value: f64) {
    super("Timestamp");
    this.value = value;
  }
}

/**
 * JsonCell represents a JSON value in a row
 */
class JsonCell extends Cell {
  value: string;
  
  constructor(value: string) {
    super("Json");
    this.value = value;
  }
}

/**
 * NullCell represents a NULL value in a row
 */
class NullCell extends Cell {
  constructor() {
    super("Null");
  }
}

/**
 * Row represents a row in a table
 * Contains an array of cells
 */
class Row {
  private cells: Array<Cell>;

  constructor() {
    this.cells = new Array<Cell>();
  }

  /**
   * Add a cell to the row
   * @param cell The cell to add, or null for a NULL value
   */
  push(cell: Cell | null): void {
    if (cell === null) {
      this.cells.push(new NullCell());
    } else {
      this.cells.push(cell);
    }
  }

  /**
   * Get a cell from the row
   * @param index The index of the cell to get
   * @returns The cell at the specified index
   */
  get(index: i32): Cell {
    return this.cells[index];
  }
}

/**
 * Context provides access to the FDW context
 * Contains columns and options
 */
class Context {
  private columns: Array<Column>;
  private options: Map<i32, Options>;

  constructor() {
    this.columns = new Array<Column>();
    this.options = new Map<i32, Options>();
  }

  /**
   * Get the columns in the context
   * @returns Array of columns
   */
  get_columns(): Array<Column> {
    return this.columns;
  }

  /**
   * Get options of a specific type
   * @param type The type of options to get
   * @returns The options of the specified type, or a new empty Options object if not found
   */
  get_options(type: i32): Options {
    const options = this.options.get(type);
    return options ? options : new Options();
  }
}

/**
 * Column definition
 * Contains name and type OID
 */
class Column {
  private name_: string;
  private typeOid_: i32;

  constructor(name: string, typeOid: i32) {
    this.name_ = name;
    this.typeOid_ = typeOid;
  }

  /**
   * Get the name of the column
   * @returns The column name
   */
  name(): string {
    return this.name_;
  }

  /**
   * Get the type OID of the column
   * @returns The column type OID
   */
  type_oid(): i32 {
    return this.typeOid_;
  }
}

/**
 * Options for the FDW
 * Contains key-value pairs
 */
class Options {
  private options: Map<string, string>;

  constructor() {
    this.options = new Map<string, string>();
  }

  /**
   * Get an option value
   * @param key The option key
   * @returns The option value, or null if not found
   */
  get(key: string): string | null {
    const value = this.options.get(key);
    return value ? value : null;
  }

  /**
   * Get a required option value
   * @param key The option key
   * @returns The option value
   * @throws Error if the option is not found
   */
  require(key: string): string {
    const value = this.get(key);
    if (value === null) {
      throw new Error(`Option '${key}' is required but not provided`);
    }
    return value;
  }

  /**
   * Get an option value with a default
   * @param key The option key
   * @param defaultValue The default value to use if the option is not found
   * @returns The option value, or the default value if not found
   */
  requireOr(key: string, defaultValue: string): string {
    const value = this.get(key);
    return value !== null ? value : defaultValue;
  }
}

// Mock data for GitHub events
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

// Static mock data for GitHub events
const MOCK_EVENTS: MockEvent[] = [
  new MockEvent(
    "29285330200",
    "PushEvent",
    "{\"id\":12345,\"login\":\"user1\",\"display_login\":\"user1\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/user1\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/12345\"}",
    "{\"id\":54321,\"name\":\"user1/repo1\",\"url\":\"https://api.github.com/repos/user1/repo1\"}",
    "{\"push_id\":12345678,\"size\":1,\"distinct_size\":1,\"ref\":\"refs/heads/main\",\"head\":\"abcdef1234567890\",\"before\":\"0987654321fedcba\",\"commits\":[{\"sha\":\"abcdef1234567890\",\"author\":{\"email\":\"user1@example.com\",\"name\":\"User 1\"},\"message\":\"Update README.md\",\"distinct\":true,\"url\":\"https://api.github.com/repos/user1/repo1/commits/abcdef1234567890\"}]}",
    true,
    "2023-01-01T00:00:00Z"
  ),
  new MockEvent(
    "29285330201",
    "PullRequestEvent",
    "{\"id\":12346,\"login\":\"user2\",\"display_login\":\"user2\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/user2\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/12346\"}",
    "{\"id\":54322,\"name\":\"user2/repo2\",\"url\":\"https://api.github.com/repos/user2/repo2\"}",
    "{\"action\":\"opened\",\"number\":123,\"pull_request\":{\"url\":\"https://api.github.com/repos/user2/repo2/pulls/123\",\"id\":987654321,\"state\":\"open\",\"title\":\"Add new feature\",\"user\":{\"login\":\"user2\"},\"body\":\"This PR adds a new feature\",\"created_at\":\"2023-01-02T00:00:00Z\",\"updated_at\":\"2023-01-02T00:00:00Z\"}}",
    true,
    "2023-01-02T00:00:00Z"
  ),
  new MockEvent(
    "29285330202",
    "IssueCommentEvent",
    "{\"id\":12347,\"login\":\"user3\",\"display_login\":\"user3\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/user3\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/12347\"}",
    "{\"id\":54323,\"name\":\"user3/repo3\",\"url\":\"https://api.github.com/repos/user3/repo3\"}",
    "{\"action\":\"created\",\"issue\":{\"url\":\"https://api.github.com/repos/user3/repo3/issues/456\",\"id\":123456789,\"number\":456,\"title\":\"Bug report\",\"user\":{\"login\":\"user3\"},\"state\":\"open\",\"body\":\"There is a bug in the code\",\"created_at\":\"2023-01-03T00:00:00Z\",\"updated_at\":\"2023-01-03T00:00:00Z\"},\"comment\":{\"url\":\"https://api.github.com/repos/user3/repo3/issues/comments/123456\",\"id\":123456,\"user\":{\"login\":\"user3\"},\"body\":\"I found the issue\",\"created_at\":\"2023-01-03T00:00:00Z\",\"updated_at\":\"2023-01-03T00:00:00Z\"}}",
    true,
    "2023-01-03T00:00:00Z"
  ),
  new MockEvent(
    "29285330203",
    "WatchEvent",
    "{\"id\":12348,\"login\":\"user4\",\"display_login\":\"user4\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/user4\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/12348\"}",
    "{\"id\":54324,\"name\":\"user4/repo4\",\"url\":\"https://api.github.com/repos/user4/repo4\"}",
    "{\"action\":\"started\"}",
    true,
    "2023-01-04T00:00:00Z"
  ),
  new MockEvent(
    "29285330204",
    "ForkEvent",
    "{\"id\":12349,\"login\":\"user5\",\"display_login\":\"user5\",\"gravatar_id\":\"\",\"url\":\"https://api.github.com/users/user5\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/12349\"}",
    "{\"id\":54325,\"name\":\"user5/repo5\",\"url\":\"https://api.github.com/repos/user5/repo5\"}",
    "{\"forkee\":{\"id\":98765432,\"name\":\"repo5-fork\",\"full_name\":\"user5/repo5-fork\",\"owner\":{\"login\":\"user5\",\"id\":12349},\"html_url\":\"https://github.com/user5/repo5-fork\",\"description\":\"A fork of repo5\",\"fork\":true,\"created_at\":\"2023-01-05T00:00:00Z\",\"updated_at\":\"2023-01-05T00:00:00Z\",\"pushed_at\":\"2023-01-05T00:00:00Z\"}}",
    true,
    "2023-01-05T00:00:00Z"
  )
];

/**
 * Main FDW implementation
 * Implements the WebAssembly Component Model interface for Supabase Wrappers
 */
class GitHubEventsFdw {
  // Static instance
  private static instance: GitHubEventsFdw | null = null;

  // Instance properties
  private baseUrl: string = "";
  private srcRows: MockEvent[] = [];
  private srcIdx: i32 = 0;

  /**
   * Initialize the singleton instance
   * Similar to the Rust version's init_instance function
   */
  static init_instance(): void {
    if (GitHubEventsFdw.instance === null) {
      GitHubEventsFdw.instance = new GitHubEventsFdw();
    }
  }

  /**
   * Get the singleton instance
   * @returns The singleton instance
   * @throws Error if the instance is not initialized
   */
  static getInstance(): GitHubEventsFdw {
    if (GitHubEventsFdw.instance === null) {
      GitHubEventsFdw.init_instance();
    }
    return GitHubEventsFdw.instance!;
  }

  /**
   * Get a mutable reference to this instance
   * Similar to the Rust version's this_mut function
   * @returns This instance
   */
  private this_mut(): GitHubEventsFdw {
    return this;
  }

  /**
   * Get the host version requirement
   * @returns The semver expression for the Wasm FDW host version requirement
   */
  host_version_requirement(): string {
    // semver expression for Wasm FDW host version requirement
    return "^0.1.0";
  }

  /**
   * Initialize the FDW
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  init(ctx: Context): string {
    const opts = ctx.get_options(0); // Server options
    this.baseUrl = opts.requireOr("api_url", "https://api.github.com");
    return "";
  }

  /**
   * Begin scanning the foreign table
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  begin_scan(ctx: Context): string {
    // In a real implementation, we would fetch data from the API
    // For now, we'll use the mock data
    this.srcRows = MOCK_EVENTS;
    this.srcIdx = 0;
    return "";
  }

  /**
   * Iterate through the foreign table
   * @param ctx The FDW context
   * @param row The row to fill with data
   * @returns 0 on success, -1 if no more rows, -2 on error
   */
  iter_scan(ctx: Context, row: Row): i32 {
    if (this.srcIdx >= this.srcRows.length) {
      return -1; // No more rows (equivalent to Ok(None) in Rust)
    }

    const srcRow = this.srcRows[<i32>this.srcIdx];

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
        const baseTimestamp: i64 = 1672531200000;
        const dayOffset: i64 = <i64>this.srcIdx * 86400000; // 1 day in ms
        const timestamp: i64 = baseTimestamp + dayOffset;
        cell = new TimestampCell(<f64>timestamp);
      } else {
        // Unknown column
        return -2; // Error
      }

      row.push(cell);
    }

    this.srcIdx++;
    return 0; // Success (equivalent to Ok(Some(0)) in Rust)
  }

  /**
   * Re-scan the foreign table
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  re_scan(ctx: Context): string {
    this.srcIdx = 0;
    return "";
  }

  /**
   * End scanning the foreign table
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  end_scan(ctx: Context): string {
    this.srcRows = [];
    return "";
  }

  /**
   * Begin modifying the foreign table
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  begin_modify(ctx: Context): string {
    return "modify on foreign table is not supported";
  }

  /**
   * Insert a row into the foreign table
   * @param ctx The FDW context
   * @param row The row to insert
   * @returns Empty string on success, error message on failure
   */
  insert(ctx: Context, row: Row): string {
    return "insert on foreign table is not supported";
  }

  /**
   * Update a row in the foreign table
   * @param ctx The FDW context
   * @param rowid The row ID to update
   * @param row The new row data
   * @returns Empty string on success, error message on failure
   */
  update(ctx: Context, rowid: Cell, row: Row): string {
    return "update on foreign table is not supported";
  }

  /**
   * Delete a row from the foreign table
   * @param ctx The FDW context
   * @param rowid The row ID to delete
   * @returns Empty string on success, error message on failure
   */
  delete(ctx: Context, rowid: Cell): string {
    return "delete on foreign table is not supported";
  }

  /**
   * End modifying the foreign table
   * @param ctx The FDW context
   * @returns Empty string on success, error message on failure
   */
  end_modify(ctx: Context): string {
    return "";
  }
}

// Initialize the FDW instance
GitHubEventsFdw.init_instance();

/**
 * Export the host version requirement
 * @returns The semver expression for the Wasm FDW host version requirement
 */
export function host_version_requirement(): string {
  return GitHubEventsFdw.getInstance().host_version_requirement();
}

/**
 * Export the init function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function init(ctx: Context): string {
  return GitHubEventsFdw.getInstance().init(ctx);
}

/**
 * Export the begin_scan function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function begin_scan(ctx: Context): string {
  return GitHubEventsFdw.getInstance().begin_scan(ctx);
}

/**
 * Export the iter_scan function
 * @param ctx The FDW context
 * @param row The row to fill with data
 * @returns 0 on success, -1 if no more rows, -2 on error
 */
export function iter_scan(ctx: Context, row: Row): i32 {
  return GitHubEventsFdw.getInstance().iter_scan(ctx, row);
}

/**
 * Export the re_scan function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function re_scan(ctx: Context): string {
  return GitHubEventsFdw.getInstance().re_scan(ctx);
}

/**
 * Export the end_scan function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function end_scan(ctx: Context): string {
  return GitHubEventsFdw.getInstance().end_scan(ctx);
}

/**
 * Export the begin_modify function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function begin_modify(ctx: Context): string {
  return GitHubEventsFdw.getInstance().begin_modify(ctx);
}

/**
 * Export the insert function
 * @param ctx The FDW context
 * @param row The row to insert
 * @returns Empty string on success, error message on failure
 */
export function insert(ctx: Context, row: Row): string {
  return GitHubEventsFdw.getInstance().insert(ctx, row);
}

/**
 * Export the update function
 * @param ctx The FDW context
 * @param rowid The row ID to update
 * @param row The new row data
 * @returns Empty string on success, error message on failure
 */
export function update(ctx: Context, rowid: Cell, row: Row): string {
  return GitHubEventsFdw.getInstance().update(ctx, rowid, row);
}

/**
 * Export the delete function
 * @param ctx The FDW context
 * @param rowid The row ID to delete
 * @returns Empty string on success, error message on failure
 */
export function delete_(ctx: Context, rowid: Cell): string {
  return GitHubEventsFdw.getInstance().delete(ctx, rowid);
}

/**
 * Export the end_modify function
 * @param ctx The FDW context
 * @returns Empty string on success, error message on failure
 */
export function end_modify(ctx: Context): string {
  return GitHubEventsFdw.getInstance().end_modify(ctx);
} 