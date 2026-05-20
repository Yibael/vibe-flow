# 数据库 03：净值看板与分析查询

## 对应 PRD

对应 `docs/prd/03-dashboard-analysis.md`。

本文档描述净值看板需要的数据查询结构。看板是只读页面，不修改数据库。

## 目标

支持看板展示：

- 当前净资产。
- 当前总资产。
- 当前总负债。
- 相对上一快照变化。
- 净值历史趋势。
- 当前资产分类组成。
- 当前负债分类组成。
- 最近更新资产负债项目。

## 数据来源

看板读取：

- `account_items`
- `net_worth_snapshots`
- `snapshot_category_breakdowns`

其中：

- 当前指标来自 `account_items` 实时汇总。
- 趋势图来自 `net_worth_snapshots`。
- 当前分类组成来自 `account_items` 实时汇总。
- 历史快照分类明细可来自 `snapshot_category_breakdowns`。

## 当前指标查询

```sql
SELECT
  COALESCE(SUM(CASE WHEN kind = 'asset' THEN amount_cents ELSE 0 END), 0)
    AS total_assets_cents,
  COALESCE(SUM(CASE WHEN kind = 'liability' THEN amount_cents ELSE 0 END), 0)
    AS total_liabilities_cents,
  COALESCE(SUM(CASE WHEN kind = 'asset' THEN amount_cents ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN kind = 'liability' THEN amount_cents ELSE 0 END), 0)
    AS net_worth_cents
FROM account_items
WHERE archived_at IS NULL;
```

展示规则：

- `total_assets_cents` 展示为总资产。
- `total_liabilities_cents` 展示为总负债。
- `net_worth_cents` 展示为当前净资产。
- `net_worth_cents` 可以为负数。

## 上一快照查询

看板需要用上一条快照计算变化。

```sql
SELECT
  id,
  snapshot_date,
  net_worth_cents
FROM net_worth_snapshots
WHERE snapshot_date < ?
ORDER BY snapshot_date DESC
LIMIT 1;
```

参数：

- `?` 为当前本地日期，格式 `YYYY-MM-DD`。

如果没有上一快照：

- 看板变化值展示“暂无对比”。
- 不展示 0。

变化计算：

```text
net_worth_delta_cents = current_net_worth_cents - previous_net_worth_cents
```

## 趋势图查询

```sql
SELECT
  snapshot_date,
  net_worth_cents
FROM net_worth_snapshots
ORDER BY snapshot_date ASC;
```

趋势图规则：

- 按日期升序渲染。
- 日期不连续时不补点。
- 快照少于两条时展示空状态。
- 净资产为负数时正常展示。

## 当前分类组成查询

```sql
SELECT
  kind,
  category,
  SUM(amount_cents) AS amount_cents
FROM account_items
WHERE archived_at IS NULL
GROUP BY kind, category
ORDER BY kind ASC, amount_cents DESC;
```

应用层分组：

- `kind = 'asset'` 进入资产组成。
- `kind = 'liability'` 进入负债组成。

占比计算：

```text
asset_percentage = category_amount_cents / total_assets_cents
liability_percentage = category_amount_cents / total_liabilities_cents
```

边界：

- 总资产为 0 时，不计算资产占比。
- 总负债为 0 时，不计算负债占比。
- 不得除以 0。

## 最近更新项目查询

```sql
SELECT
  id,
  name,
  kind,
  category,
  amount_cents,
  note,
  updated_at
FROM account_items
WHERE archived_at IS NULL
ORDER BY updated_at DESC
LIMIT 10;
```

展示规则：

- 只展示未归档项目。
- 按 `updated_at DESC` 排序。
- 负债金额仍按正数展示。
- 类别 key 在应用层映射为中文。

## 最新快照查询

快照管理页或看板辅助信息可读取最新快照。

```sql
SELECT
  id,
  snapshot_date,
  total_assets_cents,
  total_liabilities_cents,
  net_worth_cents,
  updated_at
FROM net_worth_snapshots
ORDER BY snapshot_date DESC
LIMIT 1;
```

## 快照数量查询

```sql
SELECT COUNT(*) AS snapshot_count
FROM net_worth_snapshots;
```

## 最早快照查询

```sql
SELECT
  id,
  snapshot_date,
  net_worth_cents
FROM net_worth_snapshots
ORDER BY snapshot_date ASC
LIMIT 1;
```

## 历史快照分类明细查询

如果看板需要展示某条历史快照保存时的分类组成，使用：

```sql
SELECT
  b.kind,
  b.category,
  b.amount_cents
FROM snapshot_category_breakdowns b
JOIN net_worth_snapshots s ON s.id = b.snapshot_id
WHERE s.snapshot_date = ?
ORDER BY b.kind ASC, b.amount_cents DESC;
```

第一版看板默认展示当前分类组成，因此主要使用 `account_items` 实时汇总。

## 推荐聚合返回结构

```ts
type DashboardData = {
  summary: {
    totalAssetsCents: number
    totalLiabilitiesCents: number
    netWorthCents: number
    previousNetWorthCents: number | null
    netWorthDeltaCents: number | null
  }
  trend: Array<{
    snapshotDate: string
    netWorthCents: number
  }>
  assetBreakdown: Array<{
    category: string
    amountCents: number
    percentage: number | null
  }>
  liabilityBreakdown: Array<{
    category: string
    amountCents: number
    percentage: number | null
  }>
  recentItems: Array<{
    id: string
    name: string
    kind: "asset" | "liability"
    category: string
    amountCents: number
    updatedAt: string
  }>
}
```

## 查询执行建议

看板可以一次性执行多条只读 SQL，然后在应用层组合成 `DashboardData`。

建议顺序：

1. 查询当前指标。
2. 查询上一快照。
3. 查询趋势。
4. 查询当前分类组成。
5. 查询最近更新项目。

所有查询只读，不需要事务。

## 边界条件

- 没有账户项目时，当前指标为 0。
- 没有快照时，趋势为空。
- 只有一条快照时，趋势图展示数据不足。
- 没有上一快照时，变化值为 `null`。
- 没有负债时，负债组成为空，不计算百分比。
- 已归档项目不得出现在当前指标、分类组成或最近更新项目中。

## 验收检查项

- 当前指标与 `account_items` 未归档项目一致。
- 已归档项目不影响看板。
- 趋势按日期升序。
- 无上一快照时返回 `previousNetWorthCents = null`。
- 分类占比不会除以 0。
- 最近更新项目按 `updated_at DESC` 返回。

