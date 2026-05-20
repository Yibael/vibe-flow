"use client"

import Link from "next/link"
import {
  ArrowUpRightIcon,
  BanknoteIcon,
  LandmarkIcon,
  PlusIcon,
  ScaleIcon,
  WalletCardsIcon,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DesignShell } from "./design-shell"
import { formatCurrency, formatPercent } from "./format"
import {
  getActiveAccounts,
  getBreakdown,
  getSummary,
  snapshots,
} from "./mock-data"
import { MetricCard } from "./metric-card"

const chartConfig = {
  netWorth: {
    label: "净资产",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function DashboardPrototype() {
  const accounts = getActiveAccounts()
  const summary = getSummary(accounts)
  const previousSnapshot = snapshots.at(-2)
  const delta =
    previousSnapshot === undefined
      ? null
      : summary.netWorth - previousSnapshot.netWorth
  const assetBreakdown = getBreakdown("asset", accounts)
  const liabilityBreakdown = getBreakdown("liability", accounts)
  const recentItems = accounts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)

  return (
    <DesignShell
      title="净值看板"
      description="查看当前净值、历史趋势和资产负债结构。原型使用静态数据展示最终交互形态。"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/design/accounts">
              <PlusIcon data-icon="inline-start" />
              管理资产
            </Link>
          </Button>
          <Button asChild>
            <Link href="/design/snapshots">
              <ArrowUpRightIcon data-icon="inline-end" />
              管理快照
            </Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="当前净资产"
          value={formatCurrency(summary.netWorth)}
          description="按未归档项目实时汇总"
          badge="当前"
          icon={ScaleIcon}
        />
        <MetricCard
          title="总资产"
          value={formatCurrency(summary.totalAssets)}
          description="现金、投资、房产等资产"
          icon={BanknoteIcon}
        />
        <MetricCard
          title="总负债"
          value={formatCurrency(summary.totalLiabilities)}
          description="贷款与信用卡待还"
          badge="有负债"
          icon={WalletCardsIcon}
        />
        <MetricCard
          title="较上一快照"
          value={delta === null ? "暂无对比" : formatCurrency(delta)}
          description={delta === null ? "需要至少两条快照" : "基于上一条历史快照"}
          badge={delta === null ? "暂无" : delta >= 0 ? "上升" : "下降"}
          icon={LandmarkIcon}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>净值趋势</CardTitle>
            <CardDescription>
              最近 7 条快照，日期不连续时按已有快照连接
            </CardDescription>
          </CardHeader>
          <CardContent>
            {snapshots.length < 2 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>快照数据不足</EmptyTitle>
                  <EmptyDescription>
                    至少需要两条快照才能形成趋势。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="h-[280px] w-full"
                initialDimension={{ width: 640, height: 280 }}
              >
                <AreaChart data={snapshots} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(Number(value) / 10000)}万`}
                    width={48}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `日期 ${value}`}
                        formatter={(value) => (
                          <span className="font-medium">
                            {formatCurrency(Number(value))}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    dataKey="netWorth"
                    type="monotone"
                    fill="url(#netWorthFill)"
                    stroke="var(--color-netWorth)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分类组成</CardTitle>
            <CardDescription>资产与负债分开计算占比</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <BreakdownList title="资产组成" items={assetBreakdown} />
            <BreakdownList title="负债组成" items={liabilityBreakdown} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>最近更新项目</CardTitle>
            <CardDescription>默认展示最近更新的未归档项目</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/design/accounts">查看全部</Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recentItems.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无资产负债项目</EmptyTitle>
                <EmptyDescription>添加项目后即可在看板中查看。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/design/accounts">去添加</Link>
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
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>更新时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-40 font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <KindBadge kind={item.kind} />
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="min-w-36 text-muted-foreground">
                      {item.updatedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DesignShell>
  )
}

function BreakdownList({
  title,
  items,
}: {
  title: string
  items: Array<{ category: string; amount: number; percent: number | null }>
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <Badge variant="secondary">{items.length} 类</Badge>
      </div>
      {items.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>暂无数据</EmptyTitle>
            <EmptyDescription>没有可展示的分类。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{item.category}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatCurrency(item.amount)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 min-w-0 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(6, (item.percent ?? 0) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                  {formatPercent(item.percent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function KindBadge({ kind }: { kind: "asset" | "liability" }) {
  return (
    <Badge variant={kind === "asset" ? "default" : "secondary"}>
      {kind === "asset" ? "资产" : "负债"}
    </Badge>
  )
}

