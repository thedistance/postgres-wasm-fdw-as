// A minimal example that returns static data
import { JSON } from "../node_modules/assemblyscript-json/assembly/index";
import {
  Cell,
  Context,
  Row,
  OptionsType,
  TypeOid,
  BoolCell,
  IntCell,
  FloatCell,
  StringCell,
  TimestampCell,
  JsonCell,
  NullCell
} from "./types";

// Define a simple data structure for our static data
class StaticDataItem {
  id: string;
  type: string;
  actorLogin: string;
  actorId: i32;
  repoName: string;
  repoId: i32;
  payloadJson: string;
  isPublic: boolean;
  createdAt: string;

  constructor(
    id: string,
    type: string,
    actorLogin: string,
    actorId: i32,
    repoName: string,
    repoId: i32,
    payloadJson: string,
    isPublic: boolean,
    createdAt: string
  ) {
    this.id = id;
    this.type = type;
    this.actorLogin = actorLogin;
    this.actorId = actorId;
    this.repoName = repoName;
    this.repoId = repoId;
    this.payloadJson = payloadJson;
    this.isPublic = isPublic;
    this.createdAt = createdAt;
  }

  getActorJson(): string {
    return `{"login":"${this.actorLogin}","id":${this.actorId}}`;
  }

  getRepoJson(): string {
    return `{"name":"${this.repoName}","id":${this.repoId}}`;
  }
}

// Create static data array - matching the data from events_rows.csv
const STATIC_DATA: StaticDataItem[] = [
  new StaticDataItem(
    "12345",
    "PushEvent",
    "user1",
    1001,
    "repo1",
    2001,
    `{"size":1,"commits":[]}`,
    true,
    "2023-01-01T00:00:00Z"
  ),
  new StaticDataItem(
    "12346",
    "PullRequestEvent",
    "user2",
    1002,
    "repo2",
    2002,
    `{"action":"opened"}`,
    true,
    "2023-01-02T00:00:00Z"
  ),
  new StaticDataItem(
    "12347",
    "IssueCommentEvent",
    "user3",
    1003,
    "repo3",
    2003,
    `{"action":"created","issue":{"number":42}}`,
    true,
    "2023-01-03T00:00:00Z"
  ),
  new StaticDataItem(
    "12348",
    "WatchEvent",
    "user4",
    1004,
    "repo4",
    2004,
    `{"action":"started"}`,
    true,
    "2023-01-04T00:00:00Z"
  ),
  new StaticDataItem(
    "12349",
    "ForkEvent",
    "user5",
    1005,
    "repo5",
    2005,
    `{"forkee":{"id":3001}}`,
    true,
    "2023-01-05T00:00:00Z"
  )
];

// MinimalFdw class implements the FDW interface with static data
class MinimalFdw {
  // Static instance
  private static instance: MinimalFdw = new MinimalFdw();

  // Instance properties
  private srcIdx: i32 = 0;

  // Get the singleton instance
  static getInstance(): MinimalFdw {
    return MinimalFdw.instance;
  }

  // Host version requirement
  host_version_requirement(): string {
    return "^0.1.0";
  }

  // Initialize the FDW
  init(_ctx: Context): string | null {
    return null;
  }

  // Begin scanning the foreign table
  begin_scan(_ctx: Context): string | null {
    this.srcIdx = 0;
    return null;
  }

  // Iterate through the foreign table
  iter_scan(ctx: Context, row: Row): i32 {
    if (this.srcIdx >= STATIC_DATA.length) {
      return -1; // No more rows
    }

    const data = STATIC_DATA[this.srcIdx];
    
    // Push data to the row
    for (let i = 0; i < ctx.get_columns().length; i++) {
      const col = ctx.get_columns()[i];
      const colName = col.name();
      
      let cell: Cell | null = null;
      
      if (colName == "id") {
        cell = new StringCell(data.id);
      } else if (colName == "type") {
        cell = new StringCell(data.type);
      } else if (colName == "actor") {
        cell = new JsonCell(data.getActorJson());
      } else if (colName == "repo") {
        cell = new JsonCell(data.getRepoJson());
      } else if (colName == "payload") {
        cell = new JsonCell(data.payloadJson);
      } else if (colName == "public") {
        cell = new BoolCell(data.isPublic);
      } else if (colName == "created_at") {
        cell = new TimestampCell(i64(Date.now()));
      } else {
        cell = new NullCell();
      }
      
      row.push(cell);
    }
    
    this.srcIdx++;
    return 0; // Success
  }

  // Re-scan the foreign table
  re_scan(_ctx: Context): string | null {
    this.srcIdx = 0;
    return null;
  }

  // End scanning the foreign table
  end_scan(_ctx: Context): string | null {
    return null;
  }

  // Begin modifying the foreign table
  begin_modify(_ctx: Context): string | null {
    return "modify on foreign table is not supported";
  }

  // Insert a row into the foreign table
  insert(_ctx: Context, _row: Row): string | null {
    return "insert on foreign table is not supported";
  }

  // Update a row in the foreign table
  update(_ctx: Context, _rowid: Cell, _row: Row): string | null {
    return "update on foreign table is not supported";
  }

  // Delete a row from the foreign table
  delete(_ctx: Context, _rowid: Cell): string | null {
    return "delete on foreign table is not supported";
  }

  // End modifying the foreign table
  end_modify(_ctx: Context): string | null {
    return null;
  }
}

// Export the FDW instance
export function host_version_requirement(): string {
  return MinimalFdw.getInstance().host_version_requirement();
}

export function init(ctx: Context): string | null {
  return MinimalFdw.getInstance().init(ctx);
}

export function begin_scan(ctx: Context): string | null {
  return MinimalFdw.getInstance().begin_scan(ctx);
}

export function iter_scan(ctx: Context, row: Row): i32 {
  return MinimalFdw.getInstance().iter_scan(ctx, row);
}

export function re_scan(ctx: Context): string | null {
  return MinimalFdw.getInstance().re_scan(ctx);
}

export function end_scan(ctx: Context): string | null {
  return MinimalFdw.getInstance().end_scan(ctx);
}

export function begin_modify(ctx: Context): string | null {
  return MinimalFdw.getInstance().begin_modify(ctx);
}

export function insert(ctx: Context, row: Row): string | null {
  return MinimalFdw.getInstance().insert(ctx, row);
}

export function update(ctx: Context, rowid: Cell, row: Row): string | null {
  return MinimalFdw.getInstance().update(ctx, rowid, row);
}

export function delete_(ctx: Context, rowid: Cell): string | null {
  return MinimalFdw.getInstance().delete(ctx, rowid);
}

export function end_modify(ctx: Context): string | null {
  return MinimalFdw.getInstance().end_modify(ctx);
} 