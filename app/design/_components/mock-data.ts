export type AccountKind = "asset" | "liability"

export type AccountItem = {
  id: string
  name: string
  kind: AccountKind
  category: string
  amount: number
  note: string
  updatedAt: string
  archived: boolean
}

export type Snapshot = {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  updatedAt: string
}

export const accountItems: AccountItem[] = [
  {
    id: "acc-1",
    name: "招商银行储蓄卡",
    kind: "asset",
    category: "银行账户",
    amount: 186_420.32,
    note: "日常现金管理",
    updatedAt: "2026-05-21 09:20",
    archived: false,
  },
  {
    id: "acc-2",
    name: "指数基金账户",
    kind: "asset",
    category: "投资",
    amount: 268_900,
    note: "长期持有",
    updatedAt: "2026-05-20 22:15",
    archived: false,
  },
  {
    id: "acc-3",
    name: "自住房估值",
    kind: "asset",
    category: "房产",
    amount: 1_680_000,
    note: "按保守市场价记录",
    updatedAt: "2026-05-18 18:30",
    archived: false,
  },
  {
    id: "acc-4",
    name: "车辆估值",
    kind: "asset",
    category: "车辆",
    amount: 96_000,
    note: "二手估值",
    updatedAt: "2026-05-16 15:10",
    archived: false,
  },
  {
    id: "acc-5",
    name: "住房贷款",
    kind: "liability",
    category: "贷款",
    amount: 820_000,
    note: "按剩余本金记录",
    updatedAt: "2026-05-21 08:55",
    archived: false,
  },
  {
    id: "acc-6",
    name: "信用卡本期账单",
    kind: "liability",
    category: "信用卡",
    amount: 8_630.8,
    note: "本月待还",
    updatedAt: "2026-05-19 12:40",
    archived: false,
  },
  {
    id: "acc-7",
    name: "旧工资卡",
    kind: "asset",
    category: "银行账户",
    amount: 0,
    note: "已停用账户",
    updatedAt: "2026-04-02 10:00",
    archived: true,
  },
]

export const snapshots: Snapshot[] = [
  {
    id: "snap-1",
    date: "2026-05-15",
    totalAssets: 2_180_500,
    totalLiabilities: 839_200,
    netWorth: 1_341_300,
    updatedAt: "2026-05-15 21:03",
  },
  {
    id: "snap-2",
    date: "2026-05-16",
    totalAssets: 2_196_800,
    totalLiabilities: 837_900,
    netWorth: 1_358_900,
    updatedAt: "2026-05-16 21:16",
  },
  {
    id: "snap-3",
    date: "2026-05-17",
    totalAssets: 2_203_200,
    totalLiabilities: 836_500,
    netWorth: 1_366_700,
    updatedAt: "2026-05-17 21:08",
  },
  {
    id: "snap-4",
    date: "2026-05-18",
    totalAssets: 2_218_000,
    totalLiabilities: 834_800,
    netWorth: 1_383_200,
    updatedAt: "2026-05-18 21:45",
  },
  {
    id: "snap-5",
    date: "2026-05-19",
    totalAssets: 2_223_900,
    totalLiabilities: 833_100,
    netWorth: 1_390_800,
    updatedAt: "2026-05-19 22:12",
  },
  {
    id: "snap-6",
    date: "2026-05-20",
    totalAssets: 2_231_120,
    totalLiabilities: 831_600,
    netWorth: 1_399_520,
    updatedAt: "2026-05-20 22:00",
  },
  {
    id: "snap-7",
    date: "2026-05-21",
    totalAssets: 2_231_320.32,
    totalLiabilities: 828_630.8,
    netWorth: 1_402_689.52,
    updatedAt: "2026-05-21 09:32",
  },
]

export function getActiveAccounts() {
  return accountItems.filter((item) => !item.archived)
}

export function getSummary(items = getActiveAccounts()) {
  const totalAssets = items
    .filter((item) => item.kind === "asset")
    .reduce((sum, item) => sum + item.amount, 0)
  const totalLiabilities = items
    .filter((item) => item.kind === "liability")
    .reduce((sum, item) => sum + item.amount, 0)

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  }
}

export function getBreakdown(kind: AccountKind, items = getActiveAccounts()) {
  const grouped = new Map<string, number>()
  for (const item of items.filter((entry) => entry.kind === kind)) {
    grouped.set(item.category, (grouped.get(item.category) ?? 0) + item.amount)
  }
  const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0)

  return Array.from(grouped.entries()).map(([category, amount]) => ({
    category,
    amount,
    percent: total > 0 ? amount / total : null,
  }))
}

