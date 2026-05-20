import type Database from "better-sqlite3"

import { getIsoTimestamp } from "@/lib/domain/snapshots"

type Migration = {
  id: string
  sql: string
}

const migrations: Migration[] = [
  {
    id: "001_initial_net_worth_schema",
    sql: `
CREATE TABLE IF NOT EXISTS account_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (kind = 'asset' AND category IN (
      'cash',
      'bank_account',
      'investment',
      'real_estate',
      'vehicle',
      'other_asset'
    ))
    OR
    (kind = 'liability' AND category IN (
      'loan',
      'credit_card',
      'other_liability'
    ))
  )
);

CREATE INDEX IF NOT EXISTS idx_account_items_active_updated_at
ON account_items (archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_items_kind_category_active
ON account_items (kind, category, archived_at);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_date TEXT NOT NULL UNIQUE CHECK (
    snapshot_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  total_assets_cents INTEGER NOT NULL CHECK (total_assets_cents >= 0),
  total_liabilities_cents INTEGER NOT NULL CHECK (total_liabilities_cents >= 0),
  net_worth_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date_desc
ON net_worth_snapshots (snapshot_date DESC);

CREATE TABLE IF NOT EXISTS snapshot_category_breakdowns (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (snapshot_id)
    REFERENCES net_worth_snapshots(id)
    ON DELETE CASCADE,
  UNIQUE (snapshot_id, kind, category),
  CHECK (
    (kind = 'asset' AND category IN (
      'cash',
      'bank_account',
      'investment',
      'real_estate',
      'vehicle',
      'other_asset'
    ))
    OR
    (kind = 'liability' AND category IN (
      'loan',
      'credit_card',
      'other_liability'
    ))
  )
);

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_snapshot
ON snapshot_category_breakdowns (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_kind_category
ON snapshot_category_breakdowns (kind, category);
`,
  },
]

export function runMigrations(db: Database.Database) {
  db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
`)

  const hasMigration = db
    .prepare("SELECT id FROM schema_migrations WHERE id = ?")
    .pluck()
  const insertMigration = db.prepare(
    "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)"
  )

  const migrate = db.transaction(() => {
    for (const migration of migrations) {
      if (hasMigration.get(migration.id)) {
        continue
      }

      db.exec(migration.sql)
      insertMigration.run(migration.id, getIsoTimestamp())
    }
  })

  migrate()
}
