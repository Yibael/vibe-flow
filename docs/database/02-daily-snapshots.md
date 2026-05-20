# 数据库 02：每日净值快照

## 对应 PRD

对应 `docs/prd/02-daily-snapshots.md`。

本文档描述每日净值快照和快照分类明细的数据结构、约束、事务和查询。

## 目标

支持：

- 保存今日快照。
- 自动更新今日快照。
- 补录历史日期快照。
- 同一日期快照 upsert。
- 删除快照。
- 保留快照保存当时的分类汇总。

## 主表：net_worth_snapshots

`net_worth_snapshots` 保存每日净值快照主数据。

### 表结构

```sql
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
```

## 主表字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | 主键，应用层生成 UUID |
| `snapshot_date` | TEXT | 是 | 快照日期，格式为 `YYYY-MM-DD`，唯一 |
| `total_assets_cents` | INTEGER | 是 | 保存时总资产，单位分 |
| `total_liabilities_cents` | INTEGER | 是 | 保存时总负债，单位分 |
| `net_worth_cents` | INTEGER | 是 | 保存时净资产，允许为负 |
| `created_at` | TEXT | 是 | 创建时间 |
| `updated_at` | TEXT | 是 | 最后更新时间 |

## 明细表：snapshot_category_breakdowns

`snapshot_category_breakdowns` 保存某条快照在保存当时的分类汇总。

### 表结构

```sql
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
```

## 明细表字段说明

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | TEXT | 是 | 主键，应用层生成 UUID |
| `snapshot_id` | TEXT | 是 | 所属快照 ID |
| `kind` | TEXT | 是 | `asset` 或 `liability` |
| `category` | TEXT | 是 | 分类 key |
| `amount_cents` | INTEGER | 是 | 该快照中该分类金额，单位分 |
| `created_at` | TEXT | 是 | 明细创建时间 |

## 索引

```sql
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date_desc
ON net_worth_snapshots (snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_snapshot
ON snapshot_category_breakdowns (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_kind_category
ON snapshot_category_breakdowns (kind, category);
```

## 快照计算 SQL

### 总资产、总负债、净资产

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

### 分类汇总

```sql
SELECT
  kind,
  category,
  SUM(amount_cents) AS amount_cents
FROM account_items
WHERE archived_at IS NULL
GROUP BY kind, category;
```

## 快照 Upsert 事务

保存某个日期快照时必须使用事务。

事务步骤：

1. 基于当前未归档 `account_items` 计算汇总。
2. 查询 `snapshot_date` 是否已存在。
3. 如果不存在，插入 `net_worth_snapshots`。
4. 如果存在，更新该行汇总字段和 `updated_at`。
5. 删除该快照已有 `snapshot_category_breakdowns`。
6. 插入新的分类明细。
7. 提交事务。

伪 SQL：

```sql
-- 1. 查询是否存在
SELECT id
FROM net_worth_snapshots
WHERE snapshot_date = ?;

-- 2A. 不存在时插入
INSERT INTO net_worth_snapshots (
  id,
  snapshot_date,
  total_assets_cents,
  total_liabilities_cents,
  net_worth_cents,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?);

-- 2B. 存在时更新
UPDATE net_worth_snapshots
SET
  total_assets_cents = ?,
  total_liabilities_cents = ?,
  net_worth_cents = ?,
  updated_at = ?
WHERE snapshot_date = ?;

-- 3. 重建分类明细
DELETE FROM snapshot_category_breakdowns
WHERE snapshot_id = ?;

INSERT INTO snapshot_category_breakdowns (
  id,
  snapshot_id,
  kind,
  category,
  amount_cents,
  created_at
) VALUES (?, ?, ?, ?, ?, ?);
```

## 删除快照

删除快照只删除 `net_worth_snapshots`。

```sql
DELETE FROM net_worth_snapshots
WHERE id = ?;
```

由于 `snapshot_category_breakdowns.snapshot_id` 使用 `ON DELETE CASCADE`，分类明细会自动删除。

删除快照不得修改 `account_items`。

## 快照列表 SQL

```sql
SELECT
  id,
  snapshot_date,
  total_assets_cents,
  total_liabilities_cents,
  net_worth_cents,
  created_at,
  updated_at
FROM net_worth_snapshots
ORDER BY snapshot_date DESC;
```

## 单条快照及分类明细 SQL

```sql
SELECT *
FROM net_worth_snapshots
WHERE id = ?;
```

```sql
SELECT
  kind,
  category,
  amount_cents
FROM snapshot_category_breakdowns
WHERE snapshot_id = ?
ORDER BY kind ASC, amount_cents DESC;
```

## 边界条件

- 同一日期只能有一条快照。
- 重复保存同一日期必须更新已有记录。
- 无未归档项目时可以保存 0 值快照。
- 净资产可以为负数。
- 历史快照不随账户后续变化重算。
- 删除快照不会影响账户项目。
- 分类明细必须和快照主表保持事务一致。

## 验收检查项

- 保存今日快照后，主表有一条今日记录。
- 再次保存今日快照时，仍只有一条今日记录。
- 补录历史日期时，可创建指定日期快照。
- 补录已有日期时，更新该日期快照。
- 删除快照后，分类明细自动删除。
- 删除快照后，账户项目不变。

