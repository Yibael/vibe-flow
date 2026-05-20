"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatCurrency } from "@/lib/format"

type TrendPoint = {
  snapshotDate: string
  netWorthCents: number
}

const chartConfig = {
  netWorthCents: {
    label: "净资产",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function TrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <Empty className="min-h-72">
        <EmptyHeader>
          <EmptyTitle>{data.length === 0 ? "暂无快照数据" : "趋势数据不足"}</EmptyTitle>
          <EmptyDescription>
            {data.length === 0
              ? "保存今日快照或补录历史快照后，可在这里查看趋势"
              : "至少需要两条快照才能形成趋势"}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-72 w-full">
      <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="snapshotDate"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatCurrency(Number(value))}
          width={92}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => String(label)}
              formatter={(value) => formatCurrency(Number(value))}
            />
          }
        />
        <Line
          dataKey="netWorthCents"
          type="monotone"
          stroke="var(--color-netWorthCents)"
          strokeWidth={2}
          dot
        />
      </LineChart>
    </ChartContainer>
  )
}
