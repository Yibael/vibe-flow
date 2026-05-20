# AGENTS.md

## 项目目标

本项目是一个单人、本机运行的小型个人净值管理系统。

最终实现目标：

- 使用 SQLite 持久化资产、负债和净值快照。
- 实现真实业务路由：
  - `/`：净值看板。
  - `/accounts`：资产管理。
  - `/snapshots`：快照管理。
- 保留 `/design` 作为 UI/UX 原型参考，不把它作为真实业务数据源。

不在第一版实现：

- 登录。
- 云同步。
- 多用户或家庭共享。
- 多币种。
- 外部银行、券商、基金、汇率同步。
- 完整流水记账。
- 投资收益分析。

## 必读文档

开始实现前，必须按以下顺序阅读文档：

1. `docs/implementation/00-build-plan.md`
2. `docs/database/00-database-overview.md`
3. `docs/prd/01-current-net-worth.md`
4. `docs/prd/02-daily-snapshots.md`
5. `docs/prd/03-dashboard-analysis.md`
6. `docs/tech/00-technical-architecture.md`
7. `docs/page/01-dashboard-page.md`
8. `docs/page/02-accounts-page.md`
9. `docs/page/03-snapshots-page.md`
10. `docs/test/00-acceptance-checklist.md`

需要实现某个具体页面、弹窗或数据能力时，再读取对应编号文档。

## 文档事实来源优先级

如果文档之间出现冲突，按以下优先级判断：

1. 数据库结构以 `docs/database` 为准。
2. 实施顺序以 `docs/implementation/00-build-plan.md` 为准。
3. 产品范围以 `docs/prd` 为准。
4. 页面与交互以 `docs/page` 为准。
5. 技术路线以 `docs/tech` 为准。
6. 验收标准以 `docs/test/00-acceptance-checklist.md` 为准。
7. UI 视觉和交互原型参考 `app/design`。

`app/design` 只作为原型参考。不要把其中的 mock 数据、mock 状态或静态业务逻辑带入真实业务实现。

## 技术栈

必须使用：

- Next.js App Router。
- React。
- TypeScript。
- shadcn/ui。
- TailwindCSS v4。
- SQLite。
- better-sqlite3。
- Zod。
- Zustand。
- Recharts，通过 shadcn Chart 使用。

运行时要求：

- SQLite 访问必须运行在 Node.js runtime。
- 不使用 Edge Runtime 访问 SQLite。
- 不把数据库查询放入 Client Component。

## 数据库规则

数据库实现必须以 `docs/database` 为准。

核心表：

- `schema_migrations`
- `account_items`
- `net_worth_snapshots`
- `snapshot_category_breakdowns`

字段规则：

- 金额字段统一使用整数分，字段名使用 `_cents` 后缀。
- TypeScript 领域字段使用 `amountCents`、`totalAssetsCents`、`netWorthCents` 等命名。
- 不允许使用旧字段名 `_cny`。
- 不允许使用 `category_breakdown_json`。
- 快照分类汇总必须使用 `snapshot_category_breakdowns` 明细表。

存储规则：

- SQLite 文件路径：`data/net-worth.sqlite`。
- 应用首次访问数据库时自动创建 `data` 目录。
- 启用 `PRAGMA foreign_keys = ON`。
- 使用 `schema_migrations` 记录迁移。

业务规则：

- `account_items` 是当前净值唯一事实来源。
- 当前汇总只统计 `archived_at IS NULL` 的项目。
- 归档项目只设置 `archived_at`，不物理删除。
- 同一天只能有一条快照。
- 保存或更新快照时，必须删除并重建对应的 `snapshot_category_breakdowns`。
- 删除快照时，分类明细通过外键级联删除。
- 历史快照不随后续账户变更重算。

## 实现顺序

必须按 `docs/implementation/00-build-plan.md` 执行。

推荐顺序：

1. 安装最终实现依赖。
2. 建立数据库连接、迁移和查询层。
3. 建立领域模型、格式化和 Zod 校验。
4. 实现 Server Actions。
5. 实现真实业务页面。
6. 运行类型检查、lint、build。
7. 按验收清单手动检查。

## 目录规则

建议真实业务代码使用以下目录：

```text
app/
  page.tsx
  accounts/page.tsx
  snapshots/page.tsx
  actions/
    account-items.ts
    snapshots.ts
components/
  net-worth/
lib/
  db/
    index.ts
    migrations.ts
    queries.ts
    schema.ts
  domain/
    account-items.ts
    snapshots.ts
    summaries.ts
  stores/
  format.ts
  validations.ts
data/
  net-worth.sqlite
```

规则：

- 业务组件放在 `components/net-worth`。
- shadcn/ui 原组件放在 `components/ui`。
- 不要修改 `components/ui` 下的 shadcn 原组件。
- 如需新的基础 UI 组件，使用 shadcn CLI 安装。
- `/design` 目录可以保留，除非用户明确要求删除。

## shadcn/ui 与样式规则

必须尽可能使用 shadcn/ui 组件组合业务界面。

常用组件：

- 表单：`Field`、`Input`、`Textarea`、`Select`、`ToggleGroup`、`Switch`。
- 数据展示：`Card`、`Table`、`Badge`。
- 弹窗：`Dialog`、`AlertDialog`。
- 反馈：`sonner`、`Empty`、`Skeleton`。
- 图表：`Chart`。
- 分隔：`Separator`。

交互规则：

- Dialog 和 AlertDialog 必须包含标题。
- 表单必须使用 Field 体系组织。
- 删除、归档等破坏性操作必须使用 AlertDialog 确认。
- Button 中的 lucide 图标使用 `data-icon`。

样式规则：

- 使用 TailwindCSS v4。
- 使用语义变量，例如 `bg-background`、`text-foreground`、`text-muted-foreground`、`border-border`。
- 不硬编码颜色。
- 布局使用 `flex`、`grid`、`gap-*`。
- 不使用 `space-x-*` 或 `space-y-*`。
- 页面应是工具型界面，不做营销式 Hero。
- 移动端不得出现文字重叠或按钮溢出。

## Zustand 规则

Zustand 只能用于客户端 UI 临时状态，例如：

- 当前打开的弹窗。
- 当前编辑项目 ID。
- 筛选条件。
- 图表时间范围。

禁止用 Zustand 保存：

- 资产负债项目列表。
- 快照列表。
- 当前净值汇总。
- 任何需要持久化的财务数据。

SQLite 是唯一持久数据源。

## Server Actions 规则

写操作必须通过 Server Actions 实现。

账户项目 actions：

- 新增项目。
- 编辑项目。
- 归档项目。

快照 actions：

- 保存今日快照。
- 补录指定日期快照。
- 删除快照。

要求：

- 所有输入必须经过 Zod 校验。
- 写操作必须使用数据库事务。
- 账户新增、编辑、归档后自动 upsert 今日快照。
- mutation 后调用对应 `revalidatePath`。
- 返回结构化结果，供客户端展示错误。

## 验证要求

实现完成后必须运行：

```bash
bun run typecheck
bun run lint
bun run build
```

并按以下文档逐项验收：

```text
docs/test/00-acceptance-checklist.md
```

最低手动验收流程：

1. 新增资产。
2. 新增负债。
3. 编辑金额。
4. 归档项目。
5. 保存今日快照。
6. 补录历史快照。
7. 删除快照。
8. 查看首页趋势图、分类组成和最近更新项目。

## 禁止事项

- 不使用 localStorage 持久化财务数据。
- 不把数据库查询放进 Client Component。
- 不把业务数据放进 Zustand。
- 不使用 `_cny` 作为数据库金额字段后缀。
- 不使用 `category_breakdown_json`。
- 不修改 shadcn/ui 原组件。
- 不从 `/design` 复制 mock 数据作为真实业务数据。
- 不实现第一版范围外的登录、云同步、多用户、多币种或外部金融同步。
- 不执行破坏性 git 操作，除非用户明确要求。

