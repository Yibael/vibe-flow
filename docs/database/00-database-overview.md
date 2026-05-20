# 数据库 00：总体数据结构

## 目标

本文档定义个人净值管理系统第一版的 SQLite 数据库总体结构。数据库需要支持：

- 当前资产负债项目管理。
- 当前净值汇总。
- 每日净值快照。
- 历史快照补录。
- 看板趋势与分类分析。

数据库以本机单人使用为前提，不设计登录、多用户、云同步、多币种或外部金融账户同步。

## 技术选型

- 数据库：SQLite。
- Node 访问层：better-sqlite3。
- 金额存储：整数分。
- 日期存储：本地日期字符串。
- 时间戳存储：ISO 8601 文本。

## 核心原则

- `account_items` 是当前净值的唯一事实来源。
- 当前汇总只统计 `archived_at IS NULL` 的资产负债项目。
- 归档项目不物理删除，只设置 `archived_at`。
- 历史快照保存的是当时的汇总结果，不随账户后续变更自动重算。
- 同一日期只能有一条净值快照。
- 快照分类汇总使用明细表，不使用 JSON 字段。
- 删除快照时级联删除该快照的分类明细。

## 命名约定

### 表名

使用小写蛇形命名：

- `schema_migrations`
- `account_items`
- `net_worth_snapshots`
- `snapshot_category_breakdowns`

### 字段名

使用小写蛇形命名。

金额字段统一使用 `_cents` 后缀，表示人民币“分”：

- `amount_cents`
- `total_assets_cents`
- `total_liabilities_cents`
- `net_worth_cents`

时间字段统一使用 `_at` 后缀：

- `created_at`
- `updated_at`
- `archived_at`
- `applied_at`

日期字段使用 `_date` 后缀：

- `snapshot_date`

## ID 规则

所有业务表主键使用 `TEXT`。

建议由应用层生成稳定 ID，例如：

- `crypto.randomUUID()`。
- 或其他稳定 UUID 字符串。

数据库不使用自增整数主键，避免后续导入、导出或迁移时主键含义不稳定。

## 金额规则

所有金额以人民币“分”为单位存储，使用 `INTEGER`。

示例：

- 页面展示 `123.45` 元。
- 数据库存储 `12345` 分。

规则：

- 资产金额必须大于等于 0。
- 负债金额也以正数存储。
- 净资产可以为负数。
- 不使用浮点数存储金额。

## 日期与时间规则

### 日期

`snapshot_date` 使用本地日期字符串：

```text
YYYY-MM-DD
```

示例：

```text
2026-05-21
```

### 时间戳

`created_at`、`updated_at`、`archived_at` 使用 ISO 8601 文本。

建议格式：

```text
2026-05-21T10:30:00.000+08:00
```

如果实现中统一使用 UTC，也必须在应用层保持一致格式。

## 类别枚举

第一版不支持自定义类别。类别直接存储在 `account_items.category` 和 `snapshot_category_breakdowns.category` 中，并通过 `CHECK` 约束控制。

资产类别：

| key | 中文展示 |
| --- | --- |
| `cash` | 现金 |
| `bank_account` | 银行账户 |
| `investment` | 投资 |
| `real_estate` | 房产 |
| `vehicle` | 车辆 |
| `other_asset` | 其他资产 |

负债类别：

| key | 中文展示 |
| --- | --- |
| `loan` | 贷款 |
| `credit_card` | 信用卡 |
| `other_liability` | 其他负债 |

类别必须和类型匹配：

- `asset` 只能使用资产类别。
- `liability` 只能使用负债类别。

## 表关系

```text
account_items
  当前资产负债项目

net_worth_snapshots
  每日净值快照
  1 ── * snapshot_category_breakdowns

snapshot_category_breakdowns
  快照保存当日的分类汇总明细
```

`account_items` 和 `net_worth_snapshots` 不建立外键关系。原因是快照保存的是当时汇总值，不是账户项目的历史明细。

## 完整建表 SQL

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_account_items_active_updated_at
ON account_items (archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_account_items_kind_category_active
ON account_items (kind, category, archived_at);

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

CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_date_desc
ON net_worth_snapshots (snapshot_date DESC);

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

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_snapshot
ON snapshot_category_breakdowns (snapshot_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_breakdowns_kind_category
ON snapshot_category_breakdowns (kind, category);
```

## 事务规则

以下操作必须使用事务：

- 新增、编辑、归档账户项目并同步更新今日快照。
- 保存今日快照。
- 补录历史日期快照。
- 更新已有日期快照及其分类明细。
- 删除快照。

快照 upsert 事务顺序：

1. 基于当前未归档 `account_items` 计算总资产、总负债、净资产。
2. 按 `snapshot_date` 创建或更新 `net_worth_snapshots`。
3. 删除该快照已有 `snapshot_category_breakdowns`。
4. 重新插入该快照的分类汇总明细。

## 边界条件

- 无账户项目时，当前汇总为 0。
- 无未归档账户项目时，允许保存 0 值快照。
- 净资产允许为负数。
- 同一日期重复保存快照时更新已有记录。
- 删除快照不影响资产负债项目。
- 归档项目不影响历史快照。

## 验收检查项

- 建表 SQL 可在空 SQLite 数据库中成功执行。
- 类别和类型不匹配时插入失败。
- 负数金额插入失败。
- 空名称插入失败。
- 同一日期快照不能重复插入。
- 删除快照后分类明细自动删除。
- 当前汇总查询只包含未归档项目。

