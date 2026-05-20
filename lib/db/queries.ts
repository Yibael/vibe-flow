import "server-only"

import type Database from "better-sqlite3"

import { getDb } from "@/lib/db"
import {
  mapAccountItem,
  mapSnapshot,
  mapSnapshotCategoryBreakdown,
  type AccountItemRow,
  type NetWorthSnapshotRow,
  type SnapshotCategoryBreakdownRow,
} from "@/lib/db/schema"
import type {
  AccountCategory,
  AccountItem,
  AccountKind,
} from "@/lib/domain/account-items"
import type {
  CategorySummary,
  CurrentSummary,
} from "@/lib/domain/summaries"
import { getIsoTimestamp, getLocalDateString } from "@/lib/domain/snapshots"
import type {
  NetWorthSnapshot,
  SnapshotCategoryBreakdown,
} from "@/lib/domain/snapshots"

export type AccountItemWriteInput = {
  name: string
  kind: AccountKind
  category: AccountCategory
  amountCents: number
  note?: string
}

function generateId() {
  return crypto.randomUUID()
}

function normalizeNote(note: string | undefined) {
  const value = note?.trim()

  return value ? value : null
}

export function getAllAccountItems() {
  return getDb()
    .prepare("SELECT * FROM account_items ORDER BY updated_at DESC")
    .all()
    .map((row) => mapAccountItem(row as AccountItemRow))
}

export function getActiveAccountItems(limit?: number) {
  const sql = limit
    ? "SELECT * FROM account_items WHERE archived_at IS NULL ORDER BY updated_at DESC LIMIT ?"
    : "SELECT * FROM account_items WHERE archived_at IS NULL ORDER BY updated_at DESC"
  const statement = getDb().prepare(sql)
  const rows = limit ? statement.all(limit) : statement.all()

  return rows.map((row) => mapAccountItem(row as AccountItemRow))
}

export function getAccountItemById(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM account_items WHERE id = ?")
    .get(id) as AccountItemRow | undefined

  return row ? mapAccountItem(row) : null
}

export function getCurrentSummary(): CurrentSummary {
  const db = getDb()
  const totals = db
    .prepare(
      `
SELECT
  COALESCE(SUM(CASE WHEN kind = 'asset' THEN amount_cents ELSE 0 END), 0) AS total_assets_cents,
  COALESCE(SUM(CASE WHEN kind = 'liability' THEN amount_cents ELSE 0 END), 0) AS total_liabilities_cents
FROM account_items
WHERE archived_at IS NULL
`
    )
    .get() as {
    total_assets_cents: number
    total_liabilities_cents: number
  }

  const categorySummaries = db
    .prepare(
      `
SELECT kind, category, SUM(amount_cents) AS amount_cents
FROM account_items
WHERE archived_at IS NULL
GROUP BY kind, category
HAVING amount_cents > 0
ORDER BY kind ASC, amount_cents DESC
`
    )
    .all()
    .map((row) => {
      const typed = row as {
        kind: AccountKind
        category: AccountCategory
        amount_cents: number
      }

      return {
        kind: typed.kind,
        category: typed.category,
        amountCents: typed.amount_cents,
      }
    })

  return {
    totalAssetsCents: totals.total_assets_cents,
    totalLiabilitiesCents: totals.total_liabilities_cents,
    netWorthCents: totals.total_assets_cents - totals.total_liabilities_cents,
    categorySummaries,
  }
}

export function getSnapshotsDesc() {
  return getDb()
    .prepare("SELECT * FROM net_worth_snapshots ORDER BY snapshot_date DESC")
    .all()
    .map((row) => mapSnapshot(row as NetWorthSnapshotRow))
}

export function getSnapshotsAsc() {
  return getDb()
    .prepare("SELECT * FROM net_worth_snapshots ORDER BY snapshot_date ASC")
    .all()
    .map((row) => mapSnapshot(row as NetWorthSnapshotRow))
}

export function getSnapshotByDate(snapshotDate: string) {
  const row = getDb()
    .prepare("SELECT * FROM net_worth_snapshots WHERE snapshot_date = ?")
    .get(snapshotDate) as NetWorthSnapshotRow | undefined

  return row ? mapSnapshot(row) : null
}

export function getSnapshotById(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM net_worth_snapshots WHERE id = ?")
    .get(id) as NetWorthSnapshotRow | undefined

  return row ? mapSnapshot(row) : null
}

export function getSnapshotBreakdowns(snapshotId: string) {
  return getDb()
    .prepare(
      "SELECT * FROM snapshot_category_breakdowns WHERE snapshot_id = ? ORDER BY kind ASC, amount_cents DESC"
    )
    .all(snapshotId)
    .map((row) =>
      mapSnapshotCategoryBreakdown(row as SnapshotCategoryBreakdownRow)
    )
}

export function createAccountItem(input: AccountItemWriteInput) {
  const db = getDb()

  return db.transaction(() => {
    const now = getIsoTimestamp()
    const id = generateId()

    db.prepare(
      `
INSERT INTO account_items (
  id,
  name,
  kind,
  category,
  amount_cents,
  note,
  archived_at,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
`
    ).run(
      id,
      input.name,
      input.kind,
      input.category,
      input.amountCents,
      normalizeNote(input.note),
      now,
      now
    )

    upsertSnapshotFromCurrentSummary(db, getLocalDateString())

    return getAccountItemById(id)
  })()
}

export function updateAccountItem(id: string, input: AccountItemWriteInput) {
  const db = getDb()

  return db.transaction(() => {
    const now = getIsoTimestamp()
    const result = db
      .prepare(
        `
UPDATE account_items
SET
  name = ?,
  kind = ?,
  category = ?,
  amount_cents = ?,
  note = ?,
  updated_at = ?
WHERE id = ? AND archived_at IS NULL
`
      )
      .run(
        input.name,
        input.kind,
        input.category,
        input.amountCents,
        normalizeNote(input.note),
        now,
        id
      )

    if (result.changes === 0) {
      return null
    }

    upsertSnapshotFromCurrentSummary(db, getLocalDateString())

    return getAccountItemById(id)
  })()
}

export function archiveAccountItem(id: string) {
  const db = getDb()

  return db.transaction(() => {
    const now = getIsoTimestamp()
    const result = db
      .prepare(
        `
UPDATE account_items
SET archived_at = ?, updated_at = ?
WHERE id = ? AND archived_at IS NULL
`
      )
      .run(now, now, id)

    if (result.changes === 0) {
      return null
    }

    upsertSnapshotFromCurrentSummary(db, getLocalDateString())

    return getAccountItemById(id)
  })()
}

export function upsertSnapshot(snapshotDate: string) {
  return upsertSnapshotFromCurrentSummary(getDb(), snapshotDate)
}

export function deleteSnapshot(id: string) {
  const result = getDb()
    .prepare("DELETE FROM net_worth_snapshots WHERE id = ?")
    .run(id)

  return result.changes > 0
}

export function getSnapshotOverview(snapshots: NetWorthSnapshot[]) {
  const latest = snapshots[0] ?? null
  const earliest = snapshots[snapshots.length - 1] ?? null

  return {
    count: snapshots.length,
    latest,
    earliest,
  }
}

function getCurrentSummaryInTransaction(db: Database.Database): CurrentSummary {
  const totals = db
    .prepare(
      `
SELECT
  COALESCE(SUM(CASE WHEN kind = 'asset' THEN amount_cents ELSE 0 END), 0) AS total_assets_cents,
  COALESCE(SUM(CASE WHEN kind = 'liability' THEN amount_cents ELSE 0 END), 0) AS total_liabilities_cents
FROM account_items
WHERE archived_at IS NULL
`
    )
    .get() as {
    total_assets_cents: number
    total_liabilities_cents: number
  }

  const categorySummaries = db
    .prepare(
      `
SELECT kind, category, SUM(amount_cents) AS amount_cents
FROM account_items
WHERE archived_at IS NULL
GROUP BY kind, category
HAVING amount_cents > 0
ORDER BY kind ASC, amount_cents DESC
`
    )
    .all()
    .map((row) => {
      const typed = row as {
        kind: AccountKind
        category: AccountCategory
        amount_cents: number
      }

      return {
        kind: typed.kind,
        category: typed.category,
        amountCents: typed.amount_cents,
      }
    })

  return {
    totalAssetsCents: totals.total_assets_cents,
    totalLiabilitiesCents: totals.total_liabilities_cents,
    netWorthCents: totals.total_assets_cents - totals.total_liabilities_cents,
    categorySummaries,
  }
}

function upsertSnapshotFromCurrentSummary(
  db: Database.Database,
  snapshotDate: string
) {
  const summary = getCurrentSummaryInTransaction(db)
  const existing = db
    .prepare("SELECT * FROM net_worth_snapshots WHERE snapshot_date = ?")
    .get(snapshotDate) as NetWorthSnapshotRow | undefined
  const now = getIsoTimestamp()
  const snapshotId = existing?.id ?? generateId()

  if (existing) {
    db.prepare(
      `
UPDATE net_worth_snapshots
SET
  total_assets_cents = ?,
  total_liabilities_cents = ?,
  net_worth_cents = ?,
  updated_at = ?
WHERE id = ?
`
    ).run(
      summary.totalAssetsCents,
      summary.totalLiabilitiesCents,
      summary.netWorthCents,
      now,
      snapshotId
    )
  } else {
    db.prepare(
      `
INSERT INTO net_worth_snapshots (
  id,
  snapshot_date,
  total_assets_cents,
  total_liabilities_cents,
  net_worth_cents,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?)
`
    ).run(
      snapshotId,
      snapshotDate,
      summary.totalAssetsCents,
      summary.totalLiabilitiesCents,
      summary.netWorthCents,
      now,
      now
    )
  }

  rebuildSnapshotBreakdowns(db, snapshotId, summary.categorySummaries, now)

  return {
    snapshot: mapSnapshot(
      db
        .prepare("SELECT * FROM net_worth_snapshots WHERE id = ?")
        .get(snapshotId) as NetWorthSnapshotRow
    ),
    status: existing ? "updated" : "created",
  } as const
}

function rebuildSnapshotBreakdowns(
  db: Database.Database,
  snapshotId: string,
  categorySummaries: CategorySummary[],
  now: string
) {
  db.prepare(
    "DELETE FROM snapshot_category_breakdowns WHERE snapshot_id = ?"
  ).run(snapshotId)

  const insert = db.prepare(
    `
INSERT INTO snapshot_category_breakdowns (
  id,
  snapshot_id,
  kind,
  category,
  amount_cents,
  created_at
) VALUES (?, ?, ?, ?, ?, ?)
`
  )

  for (const summary of categorySummaries) {
    insert.run(
      generateId(),
      snapshotId,
      summary.kind,
      summary.category,
      summary.amountCents,
      now
    )
  }
}

export type DashboardData = {
  summary: CurrentSummary
  snapshotsAsc: NetWorthSnapshot[]
  snapshotsDesc: NetWorthSnapshot[]
  recentItems: AccountItem[]
}

export type SnapshotDetail = NetWorthSnapshot & {
  breakdowns: SnapshotCategoryBreakdown[]
}
