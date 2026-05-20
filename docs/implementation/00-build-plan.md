# 实施计划 00：最终项目生成顺序

## 目标

本文档用于指导最终项目生成。实现应以以下文档为事实来源：

- 产品范围：`docs/prd`
- 技术路线：`docs/tech`
- 页面结构：`docs/page`
- 数据结构：`docs/database`
- UI 原型：`app/design`

其中数据库字段和 SQL 以 `docs/database` 为准。

## 阶段 1：依赖与基础设施

安装最终实现依赖：

```bash
bun add better-sqlite3 zod zustand
bun add -d @types/better-sqlite3
```

确认 shadcn/ui 组件已存在：

- `button`
- `card`
- `table`
- `badge`
- `input`
- `textarea`
- `select`
- `dialog`
- `alert-dialog`
- `field`
- `toggle-group`
- `switch`
- `separator`
- `chart`
- `sonner`
- `empty`
- `skeleton`

## 阶段 2：数据库层

创建：

- `lib/db/index.ts`
- `lib/db/migrations.ts`
- `lib/db/schema.ts`
- `lib/db/queries.ts`

要求：

- SQLite 文件放在 `data/net-worth.sqlite`。
- 首次访问数据库时自动创建 `data` 目录。
- 启用 `PRAGMA foreign_keys = ON`。
- 迁移表使用 `schema_migrations`。
- 建表 SQL 使用 `docs/database/00-database-overview.md`。

数据库表：

- `schema_migrations`
- `account_items`
- `net_worth_snapshots`
- `snapshot_category_breakdowns`

## 阶段 3：领域模型与校验

创建：

- `lib/domain/account-items.ts`
- `lib/domain/snapshots.ts`
- `lib/domain/summaries.ts`
- `lib/format.ts`
- `lib/validations.ts`

要求：

- 金额页面输入为元，数据库存储为分。
- 领域模型字段使用 `amountCents`、`totalAssetsCents` 等命名。
- 使用 Zod 校验表单输入。
- 类别与类型必须匹配。
- 日期使用本地 `YYYY-MM-DD`。

## 阶段 4：Server Actions

创建：

- `app/actions/account-items.ts`
- `app/actions/snapshots.ts`

账户 actions：

- 新增项目。
- 编辑项目。
- 归档项目。

快照 actions：

- 保存今日快照。
- 补录指定日期快照。
- 删除快照。

要求：

- 写操作必须使用事务。
- 账户新增、编辑、归档后自动 upsert 今日快照。
- 快照 upsert 时删除并重建分类明细。
- mutation 后调用对应 `revalidatePath`。
- 返回结构化结果，供客户端展示错误。

## 阶段 5：真实页面

实现真实业务路由：

- `/`：净值看板。
- `/accounts`：资产管理。
- `/snapshots`：快照管理。

实现可参考 `app/design` 原型，但真实页面必须读取 SQLite，并通过 Server Actions 写入。

建议业务组件目录：

- `components/net-worth`

保留或删除 `app/design` 由最终清理策略决定。第一轮实现可保留，方便对照。

## 阶段 6：验证

每个阶段完成后运行：

```bash
bun run typecheck
bun run lint
bun run build
```

最终手动验证：

- 新增资产。
- 新增负债。
- 编辑金额。
- 归档项目。
- 保存今日快照。
- 补录历史快照。
- 删除快照。
- 查看趋势图和分类组成。

## 注意事项

- 不要把 SQLite 查询放入 Client Component。
- 不要使用 Zustand 保存财务业务数据。
- 不要使用浏览器 localStorage 持久化资产或快照。
- 不要修改 `components/ui` 下的 shadcn 原组件。
- 不要把 `/design` 当作真实业务数据源。

