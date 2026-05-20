import type {
  AccountCategory,
  AccountItem,
  AccountKind,
} from "@/lib/domain/account-items"
import type { NetWorthSnapshot } from "@/lib/domain/snapshots"

export type CategorySummary = {
  kind: AccountKind
  category: AccountCategory
  amountCents: number
}

export type CurrentSummary = {
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
  categorySummaries: CategorySummary[]
}

export type SnapshotChange = {
  previousSnapshot: NetWorthSnapshot | null
  amountCents: number | null
}

export function summarizeAccountItems(items: AccountItem[]): CurrentSummary {
  const activeItems = items.filter((item) => !item.archivedAt)
  const byCategory = new Map<string, CategorySummary>()
  let totalAssetsCents = 0
  let totalLiabilitiesCents = 0

  for (const item of activeItems) {
    if (item.kind === "asset") {
      totalAssetsCents += item.amountCents
    } else {
      totalLiabilitiesCents += item.amountCents
    }

    const key = `${item.kind}:${item.category}`
    const existing = byCategory.get(key)

    if (existing) {
      existing.amountCents += item.amountCents
    } else {
      byCategory.set(key, {
        kind: item.kind,
        category: item.category,
        amountCents: item.amountCents,
      })
    }
  }

  return {
    totalAssetsCents,
    totalLiabilitiesCents,
    netWorthCents: totalAssetsCents - totalLiabilitiesCents,
    categorySummaries: Array.from(byCategory.values()).filter(
      (summary) => summary.amountCents > 0
    ),
  }
}

export function getSnapshotChange(
  currentNetWorthCents: number,
  snapshotsDesc: NetWorthSnapshot[],
  today: string
): SnapshotChange {
  const previousSnapshot =
    snapshotsDesc.find((snapshot) => snapshot.snapshotDate < today) ??
    snapshotsDesc[1] ??
    null

  return {
    previousSnapshot,
    amountCents: previousSnapshot
      ? currentNetWorthCents - previousSnapshot.netWorthCents
      : null,
  }
}
