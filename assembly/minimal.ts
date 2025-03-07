// A minimal example that will compile successfully

// Required FDW interface functions
export function host_version_requirement(): string {
  return "^0.1.0";
}

export function init(_ctx: i32): string {
  return "";
}

export function begin_scan(_ctx: i32): string {
  return "";
}

export function iter_scan(_ctx: i32, _row: i32): i32 {
  return 0;
}

export function re_scan(_ctx: i32): string {
  return "";
}

export function end_scan(_ctx: i32): string {
  return "";
}

export function begin_modify(_ctx: i32): string {
  return "";
}

export function insert(_ctx: i32, _row: i32): string {
  return "";
}

export function update(_ctx: i32, _rowid: i32, _row: i32): string {
  return "";
}

export function delete_(_ctx: i32, _rowid: i32): string {
  return "";
}

export function end_modify(_ctx: i32): string {
  return "";
}

// Main function
export function main(): void {
  // Do nothing
} 