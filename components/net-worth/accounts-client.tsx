"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { ArchiveIcon, EditIcon, PlusIcon, RotateCcwIcon } from "lucide-react"

import { archiveAccountItemAction } from "@/app/actions/account-items"
import { AccountItemDialog } from "@/components/net-worth/account-item-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  ACCOUNT_CATEGORY_LABELS,
  ACCOUNT_CATEGORY_OPTIONS,
  ACCOUNT_KIND_LABELS,
  type AccountItem,
  type AccountKind,
} from "@/lib/domain/account-items"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { useUiStore } from "@/lib/stores/ui-store"

type AccountsClientProps = {
  items: AccountItem[]
}

export function AccountsClient({ items }: AccountsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AccountItem | null>(null)
  const [archiveItem, setArchiveItem] = useState<AccountItem | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const {
    accountSearch,
    accountKindFilter,
    accountCategoryFilter,
    showArchived,
    setAccountSearch,
    setAccountKindFilter,
    setAccountCategoryFilter,
    setShowArchived,
    resetAccountFilters,
  } = useUiStore()

  const categoryOptions = useMemo(() => {
    if (accountKindFilter === "asset" || accountKindFilter === "liability") {
      return ACCOUNT_CATEGORY_OPTIONS[accountKindFilter]
    }

    return [
      ...ACCOUNT_CATEGORY_OPTIONS.asset,
      ...ACCOUNT_CATEGORY_OPTIONS.liability,
    ]
  }, [accountKindFilter])

  const filteredItems = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase()

    return items.filter((item) => {
      if (!showArchived && item.archivedAt) {
        return false
      }

      if (accountKindFilter !== "all" && item.kind !== accountKindFilter) {
        return false
      }

      if (
        accountCategoryFilter !== "all" &&
        item.category !== accountCategoryFilter
      ) {
        return false
      }

      if (keyword && !item.name.toLowerCase().includes(keyword)) {
        return false
      }

      return true
    })
  }, [
    accountCategoryFilter,
    accountKindFilter,
    accountSearch,
    items,
    showArchived,
  ])

  function openCreateDialog() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function openEditDialog(item: AccountItem) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  function handleArchive() {
    if (!archiveItem) {
      return
    }

    setArchiveError(null)
    startTransition(async () => {
      const result = await archiveAccountItemAction(archiveItem.id)

      if (!result.ok) {
        setArchiveError(result.message)
        return
      }

      toast.success(result.message)
      setArchiveItem(null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreateDialog}>
          <PlusIcon data-icon="inline-start" />
          新增项目
        </Button>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="search">搜索</FieldLabel>
            <Input
              id="search"
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
              placeholder="按项目名称过滤"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel>类型</FieldLabel>
              <ToggleGroup
                type="single"
                value={accountKindFilter}
                onValueChange={(value) =>
                  value && setAccountKindFilter(value as "all" | AccountKind)
                }
                variant="outline"
                spacing={0}
                className="w-full"
              >
                <ToggleGroupItem value="all" className="flex-1">
                  全部
                </ToggleGroupItem>
                <ToggleGroupItem value="asset" className="flex-1">
                  资产
                </ToggleGroupItem>
                <ToggleGroupItem value="liability" className="flex-1">
                  负债
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>类别</FieldLabel>
              <Select
                value={accountCategoryFilter}
                onValueChange={setAccountCategoryFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部类别</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {ACCOUNT_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Switch
                checked={showArchived}
                onCheckedChange={setShowArchived}
                id="show-archived"
              />
              <FieldContent>
                <FieldLabel htmlFor="show-archived">显示已归档</FieldLabel>
                <FieldDescription>默认只显示有效项目</FieldDescription>
              </FieldContent>
            </Field>
          </div>
        </FieldGroup>
      </div>

      {items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无资产负债项目</EmptyTitle>
            <EmptyDescription>新增第一个项目后即可查看当前净值</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={openCreateDialog}>
              <PlusIcon data-icon="inline-start" />
              新增第一个项目
            </Button>
          </EmptyContent>
        </Empty>
      ) : filteredItems.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>没有符合条件的项目</EmptyTitle>
            <EmptyDescription>调整筛选条件或清空筛选后重试</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={resetAccountFilters}>
              <RotateCcwIcon data-icon="inline-start" />
              清空筛选
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>类别</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ACCOUNT_KIND_LABELS[item.kind]}</Badge>
                </TableCell>
                <TableCell>{ACCOUNT_CATEGORY_LABELS[item.category]}</TableCell>
                <TableCell>{formatCurrency(item.amountCents)}</TableCell>
                <TableCell className="max-w-64 whitespace-normal text-muted-foreground">
                  {item.note || "无"}
                </TableCell>
                <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                <TableCell>
                  <Badge variant={item.archivedAt ? "outline" : "secondary"}>
                    {item.archivedAt ? "已归档" : "有效"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {!item.archivedAt ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <EditIcon data-icon="inline-start" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setArchiveError(null)
                            setArchiveItem(item)
                          }}
                        >
                          <ArchiveIcon data-icon="inline-start" />
                          归档
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">无操作</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AccountItemDialog
        key={editingItem?.id ?? "create"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
      />

      <AlertDialog open={Boolean(archiveItem)} onOpenChange={(open) => !open && setArchiveItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认归档项目？</AlertDialogTitle>
            <AlertDialogDescription>
              归档后，该项目不会再计入当前总资产、总负债和净资产。项目记录仍会保留，已保存的历史快照不会被重算。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiveItem ? (
            <div className="grid gap-2 rounded-2xl bg-muted p-4 text-sm">
              <div className="font-medium">{archiveItem.name}</div>
              <div className="text-muted-foreground">
                {ACCOUNT_KIND_LABELS[archiveItem.kind]} ·{" "}
                {ACCOUNT_CATEGORY_LABELS[archiveItem.category]} ·{" "}
                {formatCurrency(archiveItem.amountCents)}
              </div>
            </div>
          ) : null}
          {archiveError ? (
            <p className="text-sm text-destructive">{archiveError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleArchive}
            >
              {isPending ? "归档中..." : "确认归档"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
