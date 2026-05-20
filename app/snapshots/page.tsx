import { AppShell } from "@/components/net-worth/app-shell"
import { SnapshotsClient } from "@/components/net-worth/snapshots-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getCurrentSummary,
  getSnapshotByDate,
  getSnapshotOverview,
  getSnapshotsDesc,
} from "@/lib/db/queries"
import { getLocalDateString } from "@/lib/domain/snapshots"
import { formatCurrency } from "@/lib/format"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default function SnapshotsPage() {
  const today = getLocalDateString()
  const summary = getCurrentSummary()
  const todaySnapshot = getSnapshotByDate(today)
  const snapshots = getSnapshotsDesc()
  const overview = getSnapshotOverview(snapshots)

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-normal">快照管理</h1>
        <p className="text-sm text-muted-foreground">
          保存每日净值快照，追踪净值随时间变化
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <OverviewCard label="快照总数" value={`${overview.count}`} />
        <OverviewCard label="最新快照日期" value={overview.latest?.snapshotDate ?? "暂无"} />
        <OverviewCard
          label="最新净资产"
          value={
            overview.latest ? formatCurrency(overview.latest.netWorthCents) : "暂无"
          }
        />
        <OverviewCard label="最早快照日期" value={overview.earliest?.snapshotDate ?? "暂无"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快照列表</CardTitle>
          <CardDescription>按快照日期倒序展示已保存快照</CardDescription>
        </CardHeader>
        <CardContent>
          <SnapshotsClient
            today={today}
            todaySnapshot={todaySnapshot}
            snapshots={snapshots}
            summary={summary}
          />
        </CardContent>
      </Card>
    </AppShell>
  )
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  )
}
