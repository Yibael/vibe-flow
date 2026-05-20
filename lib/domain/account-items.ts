export const ACCOUNT_KINDS = ["asset", "liability"] as const

export type AccountKind = (typeof ACCOUNT_KINDS)[number]

export const ASSET_CATEGORIES = [
  "cash",
  "bank_account",
  "investment",
  "real_estate",
  "vehicle",
  "other_asset",
] as const

export const LIABILITY_CATEGORIES = [
  "loan",
  "credit_card",
  "other_liability",
] as const

export const ACCOUNT_CATEGORIES = [
  ...ASSET_CATEGORIES,
  ...LIABILITY_CATEGORIES,
] as const

export type AssetCategory = (typeof ASSET_CATEGORIES)[number]
export type LiabilityCategory = (typeof LIABILITY_CATEGORIES)[number]
export type AccountCategory = (typeof ACCOUNT_CATEGORIES)[number]

export type AccountItem = {
  id: string
  name: string
  kind: AccountKind
  category: AccountCategory
  amountCents: number
  note: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export const ACCOUNT_KIND_LABELS: Record<AccountKind, string> = {
  asset: "资产",
  liability: "负债",
}

export const ACCOUNT_CATEGORY_LABELS: Record<AccountCategory, string> = {
  cash: "现金",
  bank_account: "银行账户",
  investment: "投资",
  real_estate: "房产",
  vehicle: "车辆",
  other_asset: "其他资产",
  loan: "贷款",
  credit_card: "信用卡",
  other_liability: "其他负债",
}

export const ACCOUNT_CATEGORY_OPTIONS: Record<
  AccountKind,
  readonly AccountCategory[]
> = {
  asset: ASSET_CATEGORIES,
  liability: LIABILITY_CATEGORIES,
}

export function isAccountKind(value: string): value is AccountKind {
  return ACCOUNT_KINDS.includes(value as AccountKind)
}

export function isAccountCategory(value: string): value is AccountCategory {
  return ACCOUNT_CATEGORIES.includes(value as AccountCategory)
}

export function categoryMatchesKind(
  kind: AccountKind,
  category: AccountCategory
) {
  return ACCOUNT_CATEGORY_OPTIONS[kind].includes(category)
}

export function getDefaultCategory(kind: AccountKind): AccountCategory {
  return ACCOUNT_CATEGORY_OPTIONS[kind][0]
}
