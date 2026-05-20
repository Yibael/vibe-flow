# 技术文档 03：净值看板与分析

## 对应 PRD

对应 `docs/prd/03-dashboard-analysis.md`。

本阶段交付净值看板、关键指标、趋势图、分类组成、最近更新项目和空状态。文档可独立实施，不依赖其他阶段技术文档。

## 交付目标

- 展示当前净资产、总资产、总负债。
- 展示相对上一快照的变化。
- 展示净值趋势图。
- 展示资产和负债分类组成。
- 展示最近更新项目。
- 处理无数据、单条快照、零负债和负净值等状态。

## 依赖与组件

需要安装依赖：

```bash
bun add better-sqlite3 zod recharts
bun add -d @types/better-sqlite3
```

需要通过 shadcn CLI 安装组件：

```bash
bunx --bun shadcn@latest add card table badge empty skeleton separator chart tabs
```

如果 chart 组件安装时已经处理 Recharts 依赖，则不需要重复安装 `recharts`。

## 数据来源

看板是只读页面，数据来自 SQLite：

- 未归档资产负债项目。
- 已保存净值快照。

看板不得修改账户项目或快照。

## 数据库设计

### account_items

```sql
CREATE TABLE account_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  amount_cny INTEGER NOT NULL CHECK (amount_cny >= 0),
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### net_worth_snapshots

```sql
CREATE TABLE net_worth_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_date TEXT NOT NULL UNIQUE,
  total_assets_cny INTEGER NOT NULL CHECK (total_assets_cny >= 0),
  total_liabilities_cny INTEGER NOT NULL CHECK (total_liabilities_cny >= 0),
  net_worth_cny INTEGER NOT NULL,
  category_breakdown_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 查询与聚合

建议提供一个看板查询函数：

```ts
type DashboardData = {
  summary: {
    totalAssetsCny: number
    totalLiabilitiesCny: number
    netWorthCny: number
    previousNetWorthCny: number | null
    netWorthDeltaCny: number | null
  }
  trend: Array<{
    snapshotDate: string
    netWorthCny: number
  }>
  assetBreakdown: Array<{
    category: string
    amountCny: number
    percentage: number | null
  }>
  liabilityBreakdown: Array<{
    category: string
    amountCny: number
    percentage: number | null
  }>
  recentItems: Array<{
    id: string
    name: string
    category: string
    kind: "asset" | "liability"
    amountCny: number
    updatedAt: string
  }>
}
```

查询规则：

- 当前汇总基于未归档项目实时计算。
- 趋势图使用 `net_worth_snapshots` 按日期升序读取。
- 上一快照使用当前日期之前最近的一条快照；如果没有，则变化值为 `null`。
- 分类占比只在对应总额大于 0 时计算，否则为 `null`。
- 最近更新项目只包含未归档项目，按 `updated_at DESC` 排序。

## 页面与组件

`app/page.tsx` 可以作为看板首页。Server Component 负责读取 `DashboardData` 并传入展示组件。

建议组件：

- `components/net-worth/dashboard.tsx`
- `components/net-worth/metric-cards.tsx`
- `components/net-worth/trend-chart.tsx`
- `components/net-worth/category-composition.tsx`
- `components/net-worth/recent-items-table.tsx`

图表组件使用 `"use client"`。其余纯展示组件可保持 Server Component，除非内部使用浏览器 API。

## UI 布局

首屏布局：

- 顶部指标区：净资产、总资产、总负债、净值变化。
- 中部趋势区：净值趋势图。
- 中部或侧边分类区：资产组成、负债组成。
- 下方列表区：最近更新项目。

设计原则：

- 工具型界面，信息密度适中。
- 不使用营销式 Hero。
- 不使用装饰性大渐变背景。
- 卡片只用于指标、图表和表格容器。
- 文本不得溢出容器。

## 图表实现

使用 shadcn chart 包装 Recharts。

趋势图：

- X 轴：`snapshotDate`。
- Y 轴：`netWorthCny`，展示时格式化为人民币。
- 快照少于两条时展示 Empty。
- 支持净值为负数。

分类组成：

- 可以使用条形列表、表格或图表。
- 资产和负债必须分开展示。
- 百分比为 `null` 时不展示百分比。

## Zustand 使用

本阶段 Zustand 只用于：

- 图表时间范围选择。
- Tab 当前选中状态。
- 客户端局部筛选。

不得使用 Zustand 保存 `DashboardData` 作为业务事实来源。

## 空状态

必须处理：

- 无账户项目：指标为 0，展示添加数据提示。
- 无快照：趋势图展示空状态。
- 只有一条快照：趋势图展示数据不足状态。
- 无负债：负债组成展示无负债状态。
- 无上一快照：变化值展示“暂无对比”。

## 格式化

提供统一工具函数：

- `formatCurrencyFromCents(amountCny)`。
- `formatPercent(value)`。
- `formatDate(date)`。

所有金额展示为人民币格式。不要在组件中散落格式化逻辑。

## 验收验证

- 看板展示当前净资产、总资产和总负债。
- 净资产等于总资产减总负债。
- 有上一快照时展示变化金额。
- 无上一快照时展示“暂无对比”，不是 0。
- 趋势图按日期顺序展示快照。
- 快照少于两条时趋势图区为空状态。
- 资产和负债分类分开展示。
- 分类占比不会除以 0。
- 最近更新项目按更新时间倒序展示。
- 已归档项目不会出现在看板当前视图中。

## 验证命令

```bash
bun run typecheck
bun run lint
bun run build
```

