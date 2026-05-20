import type {
  AccountCategory,
  AccountItem,
  AccountKind,
} from "@/lib/domain/account-items"
import type {
  NetWorthSnapshot,
  SnapshotCategoryBreakdown,
} from "@/lib/domain/snapshots"

export type AccountItemRow = {
  id: string
  name: string
  kind: AccountKind
  category: AccountCategory
  amount_cents: number
  note: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type NetWorthSnapshotRow = {
  id: string
  snapshot_date: string
  total_assets_cents: number
  total_liabilities_cents: number
  net_worth_cents: number
  created_at: string
  updated_at: string
}

export type SnapshotCategoryBreakdownRow = {
  id: string
  snapshot_id: string
  kind: AccountKind
  category: AccountCategory
  amount_cents: number
  created_at: string
}

export function mapAccountItem(row: AccountItemRow): AccountItem {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    category: row.category,
    amountCents: row.amount_cents,
    note: row.note,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSnapshot(row: NetWorthSnapshotRow): NetWorthSnapshot {
  return {
    id: row.id,
    snapshotDate: row.snapshot_date,
    totalAssetsCents: row.total_assets_cents,
    totalLiabilitiesCents: row.total_liabilities_cents,
    netWorthCents: row.net_worth_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSnapshotCategoryBreakdown(
  row: SnapshotCategoryBreakdownRow
): SnapshotCategoryBreakdown {
  return {
    id: row.id,
    snapshotId: row.snapshot_id,
    kind: row.kind,
    category: row.category,
    amountCents: row.amount_cents,
    createdAt: row.created_at,
  }
}
