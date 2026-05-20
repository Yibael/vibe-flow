# 技术文档 02：每日净值快照

## 对应 PRD

对应 `docs/prd/02-daily-snapshots.md`。

本阶段交付每日净值快照、当日自动更新、历史补录、快照列表和删除能力。文档可独立实施，不依赖其他阶段技术文档。

## 交付目标

- 使用 SQLite 保存快照。
- 基于当前未归档资产负债项目生成快照。
- 资产负债项目变更后自动 upsert 今日快照。
- 支持选择历史日期补录快照。
- 支持查看和删除快照。

## 依赖与组件

需要安装依赖：

```bash
bun add better-sqlite3 zod
bun add -d @types/better-sqlite3
```

需要通过 shadcn CLI 安装组件：

```bash
bunx --bun shadcn@latest add card table input field button alert-dialog calendar popover badge empty sonner
```

如项目未使用日期选择器，也可以先用原生 `input type="date"` 实现历史补录日期输入。

## 数据库设计

### account_items

本阶段需要最小账户项目表作为快照来源：

```sql
CREATE TABLE account_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  amount_cny INTEGER NOT NULL CHECK (amount_cny >= 0),
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

日期使用本地日期字符串 `YYYY-MM-DD`。

## 快照生成规则

快照从当前未归档项目汇总生成：

- 总资产：`kind = 'asset' AND archived_at IS NULL` 的金额之和。
- 总负债：`kind = 'liability' AND archived_at IS NULL` 的金额之和。
- 净资产：总资产减总负债。
- 分类汇总：按 `kind + category` 汇总后序列化为 JSON。

没有任何未归档项目时，仍允许生成 0 值快照。

## 服务端查询

建议在 `lib/db/queries.ts` 提供：

- `calculateCurrentSnapshotPayload()`：基于当前项目计算快照内容。
- `upsertSnapshotForDate(date)`：按日期创建或更新快照。
- `getTodaySnapshot()`：读取今日快照。
- `listSnapshots()`：按日期倒序读取快照。
- `deleteSnapshot(id)`：删除快照。

`upsertSnapshotForDate` 必须使用 `snapshot_date` 唯一约束，确保同一日期不会重复。

## Server Actions

建议在 `app/actions/snapshots.ts` 提供：

- `saveTodaySnapshotAction()`。
- `backfillSnapshotAction(formData)`。
- `deleteSnapshotAction(id)`。

每个 action 必须：

- 校验日期格式。
- 禁止空日期。
- 使用事务写入。
- mutation 后调用 `revalidatePath("/")`。
- 返回结构化结果。

## 与账户变更的事务集成

如果同一阶段实现了账户项目变更，则账户写操作必须在同一事务中执行：

1. 新增、编辑或归档账户项目。
2. 根据变更后的未归档项目重新计算当前汇总。
3. upsert 当前本地日期快照。

这样可以避免页面展示项目已变更但今日快照未同步的状态。

## 页面与组件

### 快照操作区

展示：

- 今日快照是否存在。
- 保存或更新今日快照按钮。
- 历史日期输入。
- 补录按钮。

### 快照列表

展示：

- 快照日期。
- 总资产。
- 总负债。
- 净资产。
- 更新时间。
- 删除操作。

删除使用 AlertDialog 二次确认。

建议组件：

- `components/net-worth/snapshot-controls.tsx`
- `components/net-worth/snapshot-list.tsx`
- `components/net-worth/delete-snapshot-dialog.tsx`

这些组件需要交互时使用 `"use client"`。

## Zustand 使用

本阶段 Zustand 只用于：

- 删除确认弹窗状态。
- 当前选中的快照 ID。
- 快照列表筛选或排序 UI 状态。

不得使用 Zustand 保存快照列表本身。

## 日期处理

- 使用本机日期。
- 存储格式为 `YYYY-MM-DD`。
- 今日日期在服务端生成，避免客户端和服务端不一致。
- 历史补录日期由用户输入，但必须在服务端重新校验格式。

## 错误处理

- 日期格式错误时拒绝保存。
- 删除不存在的快照时返回错误。
- 数据库写入失败时显示通用错误提示。
- 重复日期保存时必须更新，不应报唯一约束错误。

## 验收验证

- 新增或编辑项目后，今日快照自动创建或更新。
- 归档项目后，今日快照自动更新。
- 同一日期只有一条快照。
- 可补录历史日期快照。
- 重复补录同一日期会覆盖已有快照。
- 快照列表按日期倒序展示。
- 删除快照需要二次确认。
- 删除快照不影响账户项目。
- 重启本地服务后快照仍存在。

## 验证命令

```bash
bun run typecheck
bun run lint
bun run build
```

