"use client"

import { useMemo, useState } from "react"
import { CalendarPlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DesignShell } from "./design-shell"
import { formatCurrency } from "./format"
import { getSummary, Snapshot, snapshots } from "./mock-data"
import { MetricCard } from "./metric-card"

export function SnapshotsPrototype() {
  const [items, setItems] = useState<Snapshot[]>(snapshots)
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [deletingSnapshot, setDeletingSnapshot] = useState<Snapshot | null>(null)
  const currentSummary = getSummary()
  const today = "2026-05-21"
  const todaySnapshot = items.find((item) => item.date === today)

  const sortedSnapshots = useMemo(
    () => items.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [items]
  )
  const latest = sortedSnapshots[0]
  const earliest = sortedSnapshots.at(-1)

  function saveTodaySnapshot() {
    setItems((current) => {
      const nextSnapshot: Snapshot = {
        id: todaySnapshot?.id ?? `snap-${current.length + 1}`,
        date: today,
        totalAssets: currentSummary.totalAssets,
        totalLiabilities: currentSummary.totalLiabilities,
        netWorth: currentSummary.netWorth,
        updatedAt: "2026-05-21 10:24",
      }
      if (todaySnapshot) {
        return current.map((item) =>
          item.date === today ? nextSnapshot : item
        )
      }
      return [...current, nextSnapshot]
    })
    toast.success(todaySnapshot ? "今日快照已更新" : "今日快照已保存")
  }

  function saveBackfill(date: string) {
    setItems((current) => {
      const existing = current.find((item) => item.date === date)
      const nextSnapshot: Snapshot = {
        id: existing?.id ?? `snap-${current.length + 1}`,
        date,
        totalAssets: currentSummary.totalAssets,
        totalLiabilities: currentSummary.totalLiabilities,
        netWorth: currentSummary.netWorth,
        updatedAt: "2026-05-21 10:24",
      }
      if (existing) {
        return current.map((item) => (item.date === date ? nextSnapshot : item))
      }
      return [...current, nextSnapshot]
    })
    toast.success(items.some((item) => item.date === date) ? "快照已更新" : "快照已保存")
    setBackfillOpen(false)
  }

  function deleteSnapshot() {
    if (!deletingSnapshot) {
      return
    }
    setItems((current) =>
      current.filter((item) => item.id !== deletingSnapshot.id)
    )
    toast.success("快照已删除")
    setDeletingSnapshot(null)
  }

  return (
    <DesignShell
      title="快照管理"
      description="保存每日净值快照，追踪净值随时间变化。"
      actions={
        <Button onClick={() => setBackfillOpen(true)}>
          <CalendarPlusIcon data-icon="inline-start" />
          补录快照
        </Button>
      }
    >
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>今日快照</CardTitle>
            <CardDescription>
              当前本地日期为 {today}，保存时会覆盖同日已有快照
            </CardDescription>
          </div>
          <Badge variant={todaySnapshot ? "secondary" : "outline"}>
            {todaySnapshot ? "今日已保存" : "今日未保存"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">总资产</div>
              <div className="mt-1 font-medium">
                {formatCurrency(currentSummary.totalAssets)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">总负债</div>
              <div className="mt-1 font-medium">
                {formatCurrency(currentSummary.totalLiabilities)}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm text-muted-foreground">净资产</div>
              <div className="mt-1 font-medium">
                {formatCurrency(currentSummary.netWorth)}
              </div>
            </div>
          </div>
          <Button onClick={saveTodaySnapshot}>
            <SaveIcon data-icon="inline-start" />
            {todaySnapshot ? "更新今日快照" : "保存今日快照"}
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="快照总数"
          value={`${items.length}`}
          description="已保存日期数量"
        />
        <MetricCard
          title="最新快照"
          value={latest?.date ?? "暂无"}
          description={latest ? formatCurrency(latest.netWorth) : "暂无数据"}
        />
        <MetricCard
          title="最早快照"
          value={earliest?.date ?? "暂无"}
          description="趋势起点"
        />
        <MetricCard
          title="今日状态"
          value={todaySnapshot ? "已保存" : "未保存"}
          description={todaySnapshot?.updatedAt ?? "等待保存"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>快照列表</CardTitle>
          <CardDescription>默认按快照日期倒序排列</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {sortedSnapshots.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无净值快照</EmptyTitle>
                <EmptyDescription>
                  保存今日快照或补录历史快照后，可在看板查看趋势。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex flex-wrap justify-center gap-2">
                <Button onClick={saveTodaySnapshot}>保存今日快照</Button>
                <Button variant="outline" onClick={() => setBackfillOpen(true)}>
                  补录历史快照
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>快照日期</TableHead>
                  <TableHead className="text-right">总资产</TableHead>
                  <TableHead className="text-right">总负债</TableHead>
                  <TableHead className="text-right">净资产</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell className="min-w-32 font-medium">
                      {snapshot.date}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(snapshot.totalAssets)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(snapshot.totalLiabilities)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(snapshot.netWorth)}
                    </TableCell>
                    <TableCell className="min-w-36 text-muted-foreground">
                      {snapshot.updatedAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingSnapshot(snapshot)}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BackfillSnapshotModal
        open={backfillOpen}
        onOpenChange={setBackfillOpen}
        onSave={saveBackfill}
        existingDates={items.map((item) => item.date)}
      />
      <DeleteSnapshotAlert
        snapshot={deletingSnapshot}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSnapshot(null)
          }
        }}
        onConfirm={deleteSnapshot}
      />
    </DesignShell>
  )
}

function BackfillSnapshotModal({
  open,
  onOpenChange,
  onSave,
  existingDates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (date: string) => void
  existingDates: string[]
}) {
  const [date, setDate] = useState("2026-05-14")
  const [error, setError] = useState("")
  const summary = getSummary()
  const exists = existingDates.includes(date)

  function handleSave() {
    if (!date) {
      setError("请选择快照日期")
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("请输入有效日期")
      return
    }
    setError("")
    onSave(date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>补录历史快照</DialogTitle>
          <DialogDescription>
            补录快照会使用当前录入的资产负债余额；系统不会通过流水反推过去余额。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="snapshot-date">快照日期</FieldLabel>
            <Input
              id="snapshot-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <FieldDescription>
              如果所选日期已有快照，本次保存会覆盖原记录。
            </FieldDescription>
          </Field>
          {exists ? (
            <Badge variant="secondary" className="w-fit">
              该日期已有快照，保存后将覆盖原记录
            </Badge>
          ) : null}
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">总资产</div>
              <div className="font-medium">
                {formatCurrency(summary.totalAssets)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">总负债</div>
              <div className="font-medium">
                {formatCurrency(summary.totalLiabilities)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">净资产</div>
              <div className="font-medium">
                {formatCurrency(summary.netWorth)}
              </div>
            </div>
          </div>
          {error ? <FieldError>{error}</FieldError> : null}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存快照</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteSnapshotAlert({
  snapshot,
  onOpenChange,
  onConfirm,
}: {
  snapshot: Snapshot | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={snapshot !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除快照？</AlertDialogTitle>
          <AlertDialogDescription>
            删除后，该日期不会再出现在净值趋势中；删除不会影响当前资产负债项目或其他日期快照。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {snapshot ? (
          <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">{snapshot.date}</div>
            <div className="grid gap-1 text-muted-foreground sm:grid-cols-3">
              <span>总资产 {formatCurrency(snapshot.totalAssets)}</span>
              <span>总负债 {formatCurrency(snapshot.totalLiabilities)}</span>
              <span>净资产 {formatCurrency(snapshot.netWorth)}</span>
            </div>
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>确认删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

