import Link from "next/link"

import { ArrowRightIcon } from "lucide-react"

import { AppShell } from "@/components/net-worth/app-shell"
import { CategoryBreakdown } from "@/components/net-worth/category-breakdown"
import { RecentItemsTable } from "@/components/net-worth/recent-items-table"
import { SummaryCards } from "@/components/net-worth/summary-cards"
import { TrendChart } from "@/components/net-worth/trend-chart"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getActiveAccountItems,
  getCurrentSummary,
  getSnapshotsAsc,
  getSnapshotsDesc,
} from "@/lib/db/queries"
import { getSnapshotChange } from "@/lib/domain/summaries"
import { getLocalDateString } from "@/lib/domain/snapshots"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default function Page() {
  const summary = getCurrentSummary()
  const snapshotsAsc = getSnapshotsAsc()
  const snapshotsDesc = getSnapshotsDesc()
  const recentItems = getActiveAccountItems(8)
  const change = getSnapshotChange(
    summary.netWorthCents,
    snapshotsDesc,
    getLocalDateString()
  )

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">净值看板</h1>
          <p className="text-sm text-muted-foreground">
            查看当前净值、历史趋势和资产负债结构
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/accounts">
              管理资产
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/snapshots">
              管理快照
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>

      <SummaryCards
        totalAssetsCents={summary.totalAssetsCents}
        totalLiabilitiesCents={summary.totalLiabilitiesCents}
        netWorthCents={summary.netWorthCents}
        changeCents={change.amountCents}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>净值趋势</CardTitle>
            <CardDescription>基于已保存快照按日期升序展示</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={snapshotsAsc.map((snapshot) => ({
                snapshotDate: snapshot.snapshotDate,
                netWorthCents: snapshot.netWorthCents,
              }))}
            />
          </CardContent>
        </Card>
        <CategoryBreakdown
          summaries={summary.categorySummaries}
          totalAssetsCents={summary.totalAssetsCents}
          totalLiabilitiesCents={summary.totalLiabilitiesCents}
        />
      </div>

      <RecentItemsTable items={recentItems} />
    </AppShell>
  )
}
