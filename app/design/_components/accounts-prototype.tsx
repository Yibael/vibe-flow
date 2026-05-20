"use client"

import { useMemo, useState } from "react"
import {
  ArchiveIcon,
  CircleDollarSignIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import { DesignShell } from "./design-shell"
import { formatCurrency } from "./format"
import {
  accountItems,
  AccountItem,
  AccountKind,
  getSummary,
} from "./mock-data"
import { MetricCard } from "./metric-card"

const assetCategories = ["现金", "银行账户", "投资", "房产", "车辆", "其他资产"]
const liabilityCategories = ["贷款", "信用卡", "其他负债"]

export function AccountsPrototype() {
  const [items, setItems] = useState<AccountItem[]>(accountItems)
  const [query, setQuery] = useState("")
  const [kindFilter, setKindFilter] = useState<"all" | AccountKind>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingItem, setEditingItem] = useState<AccountItem | null>(null)
  const [archivingItem, setArchivingItem] = useState<AccountItem | null>(null)

  const activeItems = items.filter((item) => !item.archived)
  const summary = getSummary(activeItems)
  const categoryOptions =
    kindFilter === "asset"
      ? assetCategories
      : kindFilter === "liability"
        ? liabilityCategories
        : [...assetCategories, ...liabilityCategories]

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!showArchived && item.archived) {
        return false
      }
      if (kindFilter !== "all" && item.kind !== kindFilter) {
        return false
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false
      }
      if (query && !item.name.includes(query.trim())) {
        return false
      }
      return true
    })
  }, [categoryFilter, items, kindFilter, query, showArchived])

  function openCreateModal() {
    setEditingItem(null)
    setModalMode("create")
  }

  function openEditModal(item: AccountItem) {
    setEditingItem(item)
    setModalMode("edit")
  }

  function handleSave(form: Omit<AccountItem, "id" | "updatedAt" | "archived">) {
    if (modalMode === "edit" && editingItem) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...form,
                updatedAt: "2026-05-21 10:18",
              }
            : item
        )
      )
      toast.success("项目已更新")
    } else {
      setItems((current) => [
        {
          id: `acc-${current.length + 1}`,
          ...form,
          updatedAt: "2026-05-21 10:18",
          archived: false,
        },
        ...current,
      ])
      toast.success("项目已新增")
    }
    setModalMode(null)
    setEditingItem(null)
  }

  function handleArchive() {
    if (!archivingItem) {
      return
    }
    setItems((current) =>
      current.map((item) =>
        item.id === archivingItem.id ? { ...item, archived: true } : item
      )
    )
    toast.success("项目已归档")
    setArchivingItem(null)
  }

  return (
    <DesignShell
      title="资产管理"
      description="维护资产和负债余额，当前净值会根据未归档项目实时计算。"
      actions={
        <Button onClick={openCreateModal}>
          <PlusIcon data-icon="inline-start" />
          新增项目
        </Button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="总资产"
          value={formatCurrency(summary.totalAssets)}
          description="未归档资产项目"
          icon={CircleDollarSignIcon}
        />
        <MetricCard
          title="总负债"
          value={formatCurrency(summary.totalLiabilities)}
          description="未归档负债项目"
          icon={ArchiveIcon}
        />
        <MetricCard
          title="净资产"
          value={formatCurrency(summary.netWorth)}
          description="总资产减总负债"
          badge="实时"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>筛选与搜索</CardTitle>
          <CardDescription>筛选仅影响当前表格展示，不修改原始数据</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto] lg:items-end">
          <Field>
            <FieldLabel htmlFor="account-search">搜索项目</FieldLabel>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="account-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="输入项目名称"
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>类型</FieldLabel>
            <ToggleGroup
              type="single"
              value={kindFilter}
              onValueChange={(value) => {
                if (!value) {
                  return
                }
                setKindFilter(value as "all" | AccountKind)
                setCategoryFilter("all")
              }}
            >
              <ToggleGroupItem value="all">全部</ToggleGroupItem>
              <ToggleGroupItem value="asset">资产</ToggleGroupItem>
              <ToggleGroupItem value="liability">负债</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>类别</FieldLabel>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full min-w-36">
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部类别</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal" className="rounded-lg border p-3">
            <FieldLabel htmlFor="show-archived">显示归档</FieldLabel>
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>资产负债项目</CardTitle>
          <CardDescription>负债金额按正数录入，由类型决定净值方向</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredItems.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无资产负债项目</EmptyTitle>
                <EmptyDescription>
                  新增第一个项目后即可开始计算净值。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openCreateModal}>新增第一个项目</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-40 font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.kind === "asset" ? "default" : "secondary"}>
                        {item.kind === "asset" ? "资产" : "负债"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="min-w-44 text-muted-foreground">
                      {item.note || "无"}
                    </TableCell>
                    <TableCell className="min-w-36 text-muted-foreground">
                      {item.updatedAt}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.archived ? "outline" : "secondary"}>
                        {item.archived ? "已归档" : "有效"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {!item.archived ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(item)}
                            >
                              <PencilIcon data-icon="inline-start" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setArchivingItem(item)}
                            >
                              归档
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            无操作
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AccountItemModal
        mode={modalMode}
        item={editingItem}
        onOpenChange={(open) => {
          if (!open) {
            setModalMode(null)
            setEditingItem(null)
          }
        }}
        onSave={handleSave}
      />

      <ArchiveAccountAlert
        item={archivingItem}
        onOpenChange={(open) => {
          if (!open) {
            setArchivingItem(null)
          }
        }}
        onConfirm={handleArchive}
      />
    </DesignShell>
  )
}

function AccountItemModal({
  mode,
  item,
  onOpenChange,
  onSave,
}: {
  mode: "create" | "edit" | null
  item: AccountItem | null
  onOpenChange: (open: boolean) => void
  onSave: (item: Omit<AccountItem, "id" | "updatedAt" | "archived">) => void
}) {
  const [kind, setKind] = useState<AccountKind>(item?.kind ?? "asset")
  const [name, setName] = useState(item?.name ?? "")
  const [category, setCategory] = useState(item?.category ?? assetCategories[0])
  const [amount, setAmount] = useState(String(item?.amount ?? ""))
  const [note, setNote] = useState(item?.note ?? "")
  const [error, setError] = useState("")

  const open = mode !== null
  const categories = kind === "asset" ? assetCategories : liabilityCategories

  function resetFromItem(nextOpen: boolean) {
    if (nextOpen && item) {
      setKind(item.kind)
      setName(item.name)
      setCategory(item.category)
      setAmount(String(item.amount))
      setNote(item.note)
      setError("")
    }
    if (nextOpen && !item) {
      setKind("asset")
      setName("")
      setCategory(assetCategories[0])
      setAmount("")
      setNote("")
      setError("")
    }
    onOpenChange(nextOpen)
  }

  function handleKindChange(value: string) {
    if (value !== "asset" && value !== "liability") {
      return
    }
    setKind(value)
    setCategory(value === "asset" ? assetCategories[0] : liabilityCategories[0])
  }

  function handleSubmit() {
    const trimmedName = name.trim()
    const parsedAmount = Number(amount)
    if (!trimmedName) {
      setError("请输入项目名称")
      return
    }
    if (!Number.isFinite(parsedAmount)) {
      setError("请输入有效金额")
      return
    }
    if (parsedAmount < 0) {
      setError("金额不能为负数")
      return
    }
    onSave({
      name: trimmedName,
      kind,
      category,
      amount: parsedAmount,
      note,
    })
  }

  return (
    <Dialog open={open} onOpenChange={resetFromItem}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "编辑项目" : "新增项目"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "更新项目名称、类别、金额或备注。"
              : "录入一个资产或负债余额，用于计算当前净值。"}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>项目类型</FieldLabel>
            <ToggleGroup
              type="single"
              value={kind}
              onValueChange={handleKindChange}
            >
              <ToggleGroupItem value="asset">资产</ToggleGroupItem>
              <ToggleGroupItem value="liability">负债</ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="account-name">名称</FieldLabel>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="招商银行储蓄卡"
            />
          </Field>
          <Field>
            <FieldLabel>类别</FieldLabel>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="account-amount">金额</FieldLabel>
            <Input
              id="account-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
            <FieldDescription>请输入当前余额，负债也按正数录入。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="account-note">备注</FieldLabel>
            <Textarea
              id="account-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="记录账户说明，不参与计算"
            />
          </Field>
          {error ? (
            <Field>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => resetFromItem(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "保存修改" : "保存项目"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ArchiveAccountAlert({
  item,
  onOpenChange,
  onConfirm,
}: {
  item: AccountItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={item !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认归档项目？</AlertDialogTitle>
          <AlertDialogDescription>
            归档后，该项目不会再计入当前总资产、总负债和净资产；项目记录仍会保留，已保存的历史快照不会被重算。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {item ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">{item.name}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-muted-foreground">
              <Badge variant="secondary">
                {item.kind === "asset" ? "资产" : "负债"}
              </Badge>
              <Badge variant="outline">{item.category}</Badge>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>确认归档</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

