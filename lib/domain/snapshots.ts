import type { AccountKind, AccountCategory } from "@/lib/domain/account-items"

export type NetWorthSnapshot = {
  id: string
  snapshotDate: string
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
  createdAt: string
  updatedAt: string
}

export type SnapshotCategoryBreakdown = {
  id: string
  snapshotId: string
  kind: AccountKind
  category: AccountCategory
  amountCents: number
  createdAt: string
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function isDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00`)

  return !Number.isNaN(date.getTime()) && getLocalDateString(date) === value
}

export function getIsoTimestamp() {
  return new Date().toISOString()
}
