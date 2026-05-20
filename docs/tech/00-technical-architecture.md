# 技术文档 00：总体技术架构

## 目标

本文档定义个人净值管理系统的总体技术路线。系统是单人、本机运行、本地持久化的小型 Web 应用，使用 Next.js App Router 构建界面和服务端逻辑，使用 SQLite 保存财务数据。

本技术总纲服务于所有阶段，但各阶段技术文档仍应可以独立实施。

## 技术栈

- Next.js 16 App Router。
- React 19。
- TypeScript。
- shadcn/ui。
- TailwindCSS v4。
- Zustand。
- SQLite。
- better-sqlite3。
- Zod。
- Recharts，通过 shadcn chart 使用。

## 架构原则

- SQLite 是唯一持久数据源。
- Server Components 优先负责读取数据和渲染首屏。
- Server Actions 负责所有写操作。
- Zustand 只管理客户端 UI 临时状态，不保存财务业务数据。
- 所有金额以人民币 CNY 存储和展示。
- 运行时使用 Node.js，不使用 Edge Runtime。
- 不引入登录、云同步、多用户或外部金融数据同步。

## 推荐目录结构

```text
app/
  page.tsx
  actions/
    account-items.ts
    snapshots.ts
components/
  net-worth/
    account-item-form.tsx
    account-items-table.tsx
    dashboard.tsx
    snapshot-list.tsx
    trend-chart.tsx
  ui/
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
    ui-store.ts
  format.ts
  validations.ts
data/
  net-worth.sqlite
```

`data/net-worth.sqlite` 为本地数据库文件。`data` 目录可在首次启动时自动创建。

## 数据库方案

使用 `better-sqlite3` 直接访问 SQLite。

选择原因：

- 依赖少，适合小型本地工具。
- 同步 API 简单，适合 Server Actions 中的短事务。
- 可以直接控制 SQL、唯一约束和事务。

### 连接策略

- 在 `lib/db/index.ts` 中创建数据库单例。
- 数据库连接只在服务端代码中使用。
- 所有数据库文件和 `better-sqlite3` 导入不得进入 Client Component。
- 初始化时执行 `PRAGMA foreign_keys = ON`。
- 写操作使用事务，避免资产变更和快照更新不一致。

### 迁移策略

使用轻量迁移表：

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

每个迁移使用固定 ID。应用启动或第一次数据库访问时检查并执行未应用迁移。

## 核心数据表

### account_items

```sql
CREATE TABLE account_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

金额使用整数分存储，字段名为 `amount_cents`，单位为“分”。展示时格式化为人民币元。

### net_worth_snapshots

```sql
CREATE TABLE net_worth_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_date TEXT NOT NULL UNIQUE,
  total_assets_cents INTEGER NOT NULL CHECK (total_assets_cents >= 0),
  total_liabilities_cents INTEGER NOT NULL CHECK (total_liabilities_cents >= 0),
  net_worth_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`snapshot_date` 使用本地日期字符串，格式为 `YYYY-MM-DD`。

### snapshot_category_breakdowns

```sql
CREATE TABLE snapshot_category_breakdowns (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('asset', 'liability')),
  category TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (snapshot_id)
    REFERENCES net_worth_snapshots(id)
    ON DELETE CASCADE,
  UNIQUE (snapshot_id, kind, category)
);
```

快照分类汇总使用明细表保存，不使用 JSON 字段。保存或更新某日快照时，先 upsert `net_worth_snapshots`，再删除并重建该快照的 `snapshot_category_breakdowns`。

## Next.js 实现约定

### Server Components

- 页面默认使用 Server Component。
- 首页和看板数据在服务端读取 SQLite 后传入子组件。
- 不在客户端重复请求首屏必须数据。

### Client Components

以下组件需要 `"use client"`：

- 表单组件。
- Dialog、AlertDialog、Popover 等交互组件的包装层。
- 图表组件。
- 使用 Zustand 的组件。

### Server Actions

- 写操作集中在 `app/actions`。
- 每个 action 负责校验输入、执行数据库事务、返回操作结果。
- mutation 完成后使用 `revalidatePath("/")` 刷新页面数据。
- 业务校验使用 Zod，数据库约束作为兜底。

## Zustand 使用边界

Zustand 只用于客户端 UI 状态，例如：

- 当前打开的弹窗类型。
- 正在编辑的项目 ID。
- 表格筛选条件。
- 图表时间范围。

不得使用 Zustand 保存：

- 资产负债项目列表。
- 快照列表。
- 净值汇总。
- 任何需要持久化的财务数据。

原因是 SQLite 是唯一事实来源。服务端数据应通过 Server Components 和 Server Actions 驱动刷新。

## shadcn/ui 使用规范

项目已启用 shadcn/ui，配置位于 `components.json`：

- RSC：启用。
- UI 目录：`components/ui`。
- 工具函数别名：`@/lib/utils`。
- 图标库：lucide。
- TailwindCSS 文件：`app/globals.css`。

安装组件时使用：

```bash
bunx --bun shadcn@latest add <component>
```

实现时优先使用现有组件和 shadcn CLI 安装组件，不手写基础组件。

推荐组件：

- 表单：`field`、`input`、`textarea`、`select`。
- 数据展示：`card`、`table`、`badge`。
- 弹窗：`dialog`、`alert-dialog`。
- 反馈：`sonner`、`empty`、`skeleton`。
- 图表：`chart`。
- 分隔与布局：`separator`、`tabs`。

组件规则：

- Button 内图标使用 lucide，并设置 `data-icon`。
- 表单使用 Field 体系组织，不用裸 `div` 拼表单。
- Dialog、AlertDialog 等必须有 Title。
- Empty、Badge、Separator 等优先用 shadcn 组件。

## TailwindCSS 使用规范

- 使用 TailwindCSS v4。
- 全局主题变量维护在 `app/globals.css`。
- 使用语义 token，例如 `bg-background`、`text-muted-foreground`、`border-border`。
- 避免硬编码颜色。
- 布局使用 `flex`、`grid`、`gap-*`。
- 不使用 `space-x-*` 或 `space-y-*`。
- 卡片圆角保持克制，除非组件默认样式要求更大圆角。

## 依赖计划

需要新增依赖：

```bash
bun add better-sqlite3 zustand zod
bun add -d @types/better-sqlite3
```

如安装 shadcn chart 后未自动引入 Recharts，则执行：

```bash
bun add recharts
```

## 验证命令

每个阶段实现后至少执行：

```bash
bun run typecheck
bun run lint
bun run build
```

## 技术边界

- 不支持 Edge Runtime。
- 不支持浏览器 localStorage 作为财务数据存储。
- 不支持多端并发写入。
- 不支持自动备份。
- 不支持外部金融账户连接。
- 不支持多币种。

## 参考资料

- Next.js Server / Client Components：https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Mutating Data / Server Actions：https://nextjs.org/docs/app/getting-started/mutating-data
- Zustand Next.js 指南：https://zustand.docs.pmnd.rs/learn/guides/nextjs
- Zustand TypeScript 指南：https://zustand.docs.pmnd.rs/learn/guides/beginner-typescript
- better-sqlite3 API：https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
