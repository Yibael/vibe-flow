import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type SummaryCardsProps = {
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
  changeCents?: number | null
}

export function SummaryCards({
  totalAssetsCents,
  totalLiabilitiesCents,
  netWorthCents,
  changeCents,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "当前净资产",
      value: netWorthCents,
      description: "未归档资产减未归档负债",
      badge: "净值",
    },
    {
      title: "总资产",
      value: totalAssetsCents,
      description: "所有有效资产项目合计",
      badge: "资产",
    },
    {
      title: "总负债",
      value: totalLiabilitiesCents,
      description: totalLiabilitiesCents === 0 ? "当前无负债" : "所有有效负债项目合计",
      badge: "负债",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{card.title}</span>
              <Badge variant="secondary">{card.badge}</Badge>
            </CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-normal">
              {formatCurrency(card.value)}
            </div>
          </CardContent>
        </Card>
      ))}
      {changeCents !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>较上一快照变化</span>
              <Badge variant="secondary">
                {changeCents === null ? "暂无对比" : changeCents >= 0 ? "上升" : "下降"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {changeCents === null ? "还没有可比较的历史快照" : "当前净值与上一快照对比"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-normal">
              {changeCents === null ? "暂无对比" : formatCurrency(changeCents)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
