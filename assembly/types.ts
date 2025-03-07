// Type definitions for the Postgres Wasm FDW

// HTTP related types
export enum HttpMethod {
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Head,
  Options
}

export class HttpRequest {
  method: HttpMethod;
  url: string;
  headers: Map<string, string>;
  body: string;

  constructor(method: HttpMethod, url: string, headers: Map<string, string> = new Map<string, string>(), body: string = "") {
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.body = body;
  }
}

export class HttpResponse {
  status: number;
  headers: Map<string, string>;
  body: string;

  constructor(status: number, headers: Map<string, string> = new Map<string, string>(), body: string = "") {
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}

// Options types
export enum OptionsType {
  Server,
  Table
}

export class Options {
  private options: Map<string, string>;

  constructor() {
    this.options = new Map<string, string>();
  }

  get(key: string): string | null {
    return this.options.has(key) ? this.options.get(key)! : null;
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

// PostgreSQL data types
export enum TypeOid {
  Bool,
  Int,
  Float,
  String,
  Timestamp,
  Json
}

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

export class FloatCell extends Cell {
  value: f64;
  
  constructor(value: f64) {
    super("Float");
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

// Column definition
export class Column {
  private name_: string;
  private typeOid_: TypeOid;

  constructor(name: string, typeOid: TypeOid) {
    this.name_ = name;
    this.typeOid_ = typeOid;
  }

  name(): string {
    return this.name_;
  }

  type_oid(): TypeOid {
    return this.typeOid_;
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

  get(index: number): Cell {
    return this.cells[index];
  }
}

// Context provides access to the FDW context
export class Context {
  private columns: Array<Column>;
  private options: Map<OptionsType, Options>;

  constructor() {
    this.columns = new Array<Column>();
    this.options = new Map<OptionsType, Options>();
  }

  get_columns(): Array<Column> {
    return this.columns;
  }

  get_options(type: OptionsType): Options {
    if (this.options.has(type)) {
      return this.options.get(type)!;
    }
    return new Options();
  }

  // Methods to set up the context (for testing)
  add_column(column: Column): void {
    this.columns.push(column);
  }

  set_options(type: OptionsType, options: Options): void {
    this.options.set(type, options);
  }
} 