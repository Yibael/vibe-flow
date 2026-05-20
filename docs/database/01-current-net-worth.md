# 数据库 01：当前净值管理

## 对应 PRD

对应 `docs/prd/01-current-net-worth.md`。

本文档描述当前资产负债项目的数据结构、约束、索引和汇总查询。

## 目标

支持用户手动维护当前资产和负债余额，并基于未归档项目计算：

- 总资产。
- 总负债。
- 净资产。
- 当前分类汇总。
- 最近更新项目。

## 主表：account_items

`account_items` 是当前净值计算的事实来源。

### 表结构

```sql
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
```

## 字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | 主键，应用层生成 UUID |
| `name` | TEXT | 是 | 项目名称，不允许为空或全空格 |
| `kind` | TEXT | 是 | `asset` 或 `liability` |
| `category` | TEXT | 是 | 类别 key，必须与 `kind` 匹配 |
| `amount_cents` | INTEGER | 是 | 人民币金额，单位为分，不允许负数 |
| `note` | TEXT | 否 | 备注，可为空 |
| `archived_at` | TEXT | 否 | 归档时间；为空表示有效 |
| `created_at` | TEXT | 是 | 创建时间 |
| `updated_at` | TEXT | 是 | 最后更新时间 |

## 类别约束

资产类别：

- `cash`
- `bank_account`
- `investment`
- `real_estate`
- `vehicle`
- `other_asset`

负债类别：

- `loan`
- `credit_card`
- `other_liability`

非法示例：

- `kind = 'asset'` 且 `category = 'loan'`。
- `kind = 'liability'` 且 `category = 'investment'`。

以上写入必须被数据库拒绝。

## 金额规则

- `amount_cents` 存储人民币分。
- 资产金额为正数或 0。
- 负债金额也为正数或 0。
- 负债不使用负数表示。
- 净值计算时由 `kind` 决定加总到资产侧或负债侧。

示例：

| 页面输入 | 数据库存储 |
| --- | --- |
| `0` | `0` |
| `12.34` | `1234` |
| `1000000` | `100000000` |

## 归档规则

归档项目时：

- 设置 `archived_at`。
- 更新 `updated_at`。
- 不物理删除记录。
- 该项目不再参与当前净值和分类汇总。

第一版不要求恢复归档项目。如果后续支持恢复，只需将 `archived_at` 置空并更新 `updated_at`。

## 索引

```sql
CREATE INDEX IF NOT EXISTS idx_account_items_active_updated_at
ON account_items (archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_items_kind_category_active
ON account_items (kind, category, archived_at);
```

索引用途：

- `idx_account_items_active_updated_at` 支持最近更新项目列表。
- `idx_account_items_kind_category_active` 支持当前分类汇总。

## 当前汇总 SQL

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

## 当前分类汇总 SQL

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

应用层计算百分比：

- 资产类别占比 = 该资产类别金额 / 总资产。
- 负债类别占比 = 该负债类别金额 / 总负债。
- 分母为 0 时不计算百分比。

## 项目列表 SQL

### 未归档项目

```sql
SELECT *
FROM account_items
WHERE archived_at IS NULL
ORDER BY updated_at DESC;
```

### 包含归档项目

```sql
SELECT *
FROM account_items
ORDER BY
  archived_at IS NOT NULL ASC,
  updated_at DESC;
```

### 最近更新项目

```sql
SELECT *
FROM account_items
WHERE archived_at IS NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## 写入规则

### 新增项目

必须写入：

- `id`
- `name`
- `kind`
- `category`
- `amount_cents`
- `created_at`
- `updated_at`

`archived_at` 初始为空。

### 编辑项目

允许更新：

- `name`
- `kind`
- `category`
- `amount_cents`
- `note`
- `updated_at`

编辑时仍需满足类别和类型匹配约束。

### 归档项目

只更新：

- `archived_at`
- `updated_at`

## 边界条件

- 金额为 0 可以保存。
- 空名称不能保存。
- 负数金额不能保存。
- 当前净资产可以为负数。
- 没有任何未归档项目时，当前汇总返回 0。
- 归档项目不参与当前汇总。

## 验收检查项

- 新增资产后，总资产增加。
- 新增负债后，总负债增加。
- 编辑金额后，汇总结果变化。
- 归档项目后，汇总不再包含该项目。
- 资产类别和负债类别不能混用。
- 最近更新项目按 `updated_at DESC` 排序。

