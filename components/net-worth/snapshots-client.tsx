"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { CalendarPlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import {
  backfillSnapshotAction,
  deleteSnapshotAction,
  saveTodaySnapshotAction,
} from "@/app/actions/snapshots"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
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
import type { CurrentSummary } from "@/lib/domain/summaries"
import type { NetWorthSnapshot } from "@/lib/domain/snapshots"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { ActionResult } from "@/lib/validations"

type SnapshotsClientProps = {
  today: string
  todaySnapshot: NetWorthSnapshot | null
  snapshots: NetWorthSnapshot[]
  summary: CurrentSummary
}

export function SnapshotsClient({
  today,
  todaySnapshot,
  snapshots,
  summary,
}: SnapshotsClientProps) {
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<NetWorthSnapshot | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [isPending, startTransition] = useTransition()

  const existingDates = useMemo(
    () => new Set(snapshots.map((snapshot) => snapshot.snapshotDate)),
    [snapshots]
  )
  const willOverwrite = existingDates.has(selectedDate)

  function handleActionResult(result: ActionResult, close?: () => void) {
    if (!result.ok) {
      setFormErrors(result.fieldErrors ?? {})
      setFormMessage(result.message)
      return
    }

    toast.success(result.message)
    close?.()
  }

  function handleSaveToday() {
    startTransition(async () => {
      const result = await saveTodaySnapshotAction()
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
    })
  }

  function handleBackfill(formData: FormData) {
    setFormErrors({})
    setFormMessage(null)
    startTransition(async () => {
      const result = await backfillSnapshotAction(formData)
      handleActionResult(result, () => setBackfillOpen(false))
    })
  }

  function handleDelete() {
    if (!deleteTarget) {
      return
    }

    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteSnapshotAction(deleteTarget.id)

      if (!result.ok) {
        setDeleteError(result.message)
        return
      }

      toast.success(result.message)
      setDeleteTarget(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={() => setBackfillOpen(true)}>
          <CalendarPlusIcon data-icon="inline-start" />
          补录快照
        </Button>
      </div>

      <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-medium">今日快照</h2>
              <Badge variant={todaySnapshot ? "secondary" : "outline"}>
                {todaySnapshot ? "今日已保存" : "今日未保存"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {today} ·{" "}
              {todaySnapshot
                ? `最后更新 ${formatDateTime(todaySnapshot.updatedAt)}`
                : "可基于当前未归档项目保存"}
            </p>
          </div>
          <Button type="button" onClick={handleSaveToday} disabled={isPending}>
            <SaveIcon data-icon="inline-start" />
            {isPending
              ? "保存中..."
              : todaySnapshot
                ? "更新今日快照"
                : "保存今日快照"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SnapshotMetric label="今日总资产" value={summary.totalAssetsCents} />
          <SnapshotMetric label="今日总负债" value={summary.totalLiabilitiesCents} />
          <SnapshotMetric label="今日净资产" value={summary.netWorthCents} />
        </div>
      </div>

      {snapshots.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无净值快照</EmptyTitle>
            <EmptyDescription>
              保存今日快照或补录历史快照后，可在看板查看趋势
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={handleSaveToday} disabled={isPending}>
                <SaveIcon data-icon="inline-start" />
                保存今日快照
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBackfillOpen(true)}
              >
                <CalendarPlusIcon data-icon="inline-start" />
                补录历史快照
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>快照日期</TableHead>
              <TableHead>总资产</TableHead>
              <TableHead>总负债</TableHead>
              <TableHead>净资产</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map((snapshot) => (
              <TableRow key={snapshot.id}>
                <TableCell className="font-medium">{snapshot.snapshotDate}</TableCell>
                <TableCell>{formatCurrency(snapshot.totalAssetsCents)}</TableCell>
                <TableCell>{formatCurrency(snapshot.totalLiabilitiesCents)}</TableCell>
                <TableCell>{formatCurrency(snapshot.netWorthCents)}</TableCell>
                <TableCell>{formatDateTime(snapshot.updatedAt)}</TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteTarget(snapshot)
                    }}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={backfillOpen} onOpenChange={setBackfillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>补录历史快照</DialogTitle>
            <DialogDescription>
              补录快照会使用当前录入的资产负债余额；系统不会通过流水反推过去余额。
            </DialogDescription>
          </DialogHeader>
          <form action={handleBackfill} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={Boolean(formErrors.snapshotDate?.length)}>
                <FieldLabel htmlFor="snapshotDate">快照日期</FieldLabel>
                <Input
                  id="snapshotDate"
                  name="snapshotDate"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  aria-invalid={Boolean(formErrors.snapshotDate?.length)}
                />
                <FieldDescription>
                  如果所选日期已有快照，本次保存会覆盖原记录。
                </FieldDescription>
                <FieldError
                  errors={formErrors.snapshotDate?.map((error) => ({
                    message: error,
                  }))}
                />
              </Field>
            </FieldGroup>
            <div className="grid gap-3 rounded-2xl bg-muted p-4 text-sm sm:grid-cols-3">
              <SnapshotMetric label="总资产" value={summary.totalAssetsCents} />
              <SnapshotMetric label="总负债" value={summary.totalLiabilitiesCents} />
              <SnapshotMetric label="净资产" value={summary.netWorthCents} />
            </div>
            {willOverwrite ? (
              <Badge variant="secondary" className="w-fit">
                该日期已有快照，保存后将覆盖原记录
              </Badge>
            ) : null}
            {formMessage ? (
              <p className="text-sm text-destructive">{formMessage}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBackfillOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存快照"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除快照？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，该日期不会再出现在净值趋势中。删除不会影响当前资产负债项目，也不会影响其他日期快照。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget ? (
            <div className="grid gap-2 rounded-2xl bg-muted p-4 text-sm">
              <div className="font-medium">{deleteTarget.snapshotDate}</div>
              <div className="text-muted-foreground">
                总资产 {formatCurrency(deleteTarget.totalAssetsCents)} · 总负债{" "}
                {formatCurrency(deleteTarget.totalLiabilitiesCents)} · 净资产{" "}
                {formatCurrency(deleteTarget.netWorthCents)}
              </div>
            </div>
          ) : null}
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "删除中..." : "确认删除"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SnapshotMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{formatCurrency(value)}</span>
    </div>
  )
}
