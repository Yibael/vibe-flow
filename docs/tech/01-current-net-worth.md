# 技术文档 01：当前净值管理

## 对应 PRD

对应 `docs/prd/01-current-net-worth.md`。

本阶段交付当前资产负债项目管理、当前净值汇总和分类汇总。文档可独立实施，不依赖其他阶段技术文档。

## 交付目标

- 使用 SQLite 保存资产负债项目。
- 支持新增、编辑、归档资产负债项目。
- 展示总资产、总负债、净资产。
- 展示资产和负债的分类汇总。
- 使用 shadcn/ui 和 TailwindCSS 构建可用界面。

## 依赖与组件

需要安装依赖：

```bash
bun add better-sqlite3 zod
bun add -d @types/better-sqlite3
```

需要通过 shadcn CLI 安装组件：

```bash
bunx --bun shadcn@latest add card table dialog input textarea select field badge empty separator
```

如果已有组件存在，不重复安装；安装后读取新增组件文件，确认导入路径符合 `components.json`。

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

金额以整数分存储。页面输入人民币元，Server Action 转换为分后入库。

## 类型定义

```ts
type AccountKind = "asset" | "liability"

type AccountItemCategory =
  | "cash"
  | "bank_account"
  | "investment"
  | "real_estate"
  | "vehicle"
  | "other_asset"
  | "loan"
  | "credit_card"
  | "other_liability"

type AccountItem = {
  id: string
  name: string
  category: AccountItemCategory
  kind: AccountKind
  amountCny: number
  note: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}
```

`amountCny` 在 TypeScript 领域模型中表示“分”，格式化展示时转换为元。

## 服务端查询

建议在 `lib/db/queries.ts` 提供：

- `listActiveAccountItems()`：按更新时间倒序返回未归档项目。
- `listArchivedAccountItems()`：返回已归档项目，供后续扩展。
- `getAccountItem(id)`：获取单个项目。
- `createAccountItem(input)`：新增项目。
- `updateAccountItem(id, input)`：编辑项目。
- `archiveAccountItem(id)`：设置归档时间。
- `getCurrentSummary()`：汇总未归档项目。
- `getCategoryBreakdown()`：按类型和类别汇总。

汇总 SQL 应只统计 `archived_at IS NULL` 的记录。

## Server Actions

建议在 `app/actions/account-items.ts` 提供：

- `createAccountItemAction(formData)`。
- `updateAccountItemAction(id, formData)`。
- `archiveAccountItemAction(id)`。

每个 action 必须：

- 使用 Zod 校验输入。
- 拒绝空名称。
- 拒绝负数金额。
- 校验类别与类型匹配。
- 写入数据库。
- 调用 `revalidatePath("/")`。
- 返回结构化结果，供客户端展示错误或成功状态。

类别与类型匹配规则：

- `asset` 只能使用现金、银行账户、投资、房产、车辆、其他资产。
- `liability` 只能使用贷款、信用卡、其他负债。

## 页面与组件

### 页面

`app/page.tsx` 可作为当前净值管理首页。

Server Component 负责读取：

- 当前汇总。
- 分类汇总。
- 未归档项目列表。

然后传入客户端表单和表格组件。

### 组件

建议组件：

- `components/net-worth/summary-cards.tsx`
- `components/net-worth/category-breakdown.tsx`
- `components/net-worth/account-items-table.tsx`
- `components/net-worth/account-item-form.tsx`
- `components/net-worth/archive-account-item-dialog.tsx`

表单、弹窗和归档确认组件使用 `"use client"`。

## Zustand 使用

本阶段 Zustand 只用于：

- 控制新增/编辑 Dialog 打开状态。
- 记录当前编辑的项目 ID。
- 控制项目类型筛选。

不得使用 Zustand 保存项目列表或汇总数据。

## UI 实现规范

- 当前净值、总资产、总负债使用 Card 展示。
- 项目列表使用 Table 展示。
- 项目类型和类别使用 Badge 展示。
- 空列表使用 Empty 展示。
- 表单使用 Field、Input、Select、Textarea。
- 归档确认使用 Dialog 或 AlertDialog；若使用 AlertDialog，需要通过 shadcn CLI 安装。
- 样式使用语义 token 和 Tailwind layout class。

## 错误处理

- 表单校验错误显示在对应 Field 下。
- 数据库写入失败显示通用错误提示。
- 归档不存在的项目时返回错误。
- 金额解析失败时返回“请输入有效金额”。

## 验收验证

- 新增资产后，总资产增加，净资产增加。
- 新增负债后，总负债增加，净资产减少。
- 编辑金额后，汇总重新计算。
- 归档项目后，列表和汇总不再包含该项目。
- 金额为 0 可以保存。
- 负数金额不能保存。
- 空名称不能保存。
- 重启本地服务后数据仍存在。

## 验证命令

```bash
bun run typecheck
bun run lint
bun run build
```

