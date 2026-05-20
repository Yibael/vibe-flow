import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import {
  ACCOUNT_CATEGORY_LABELS,
  type AccountKind,
} from "@/lib/domain/account-items"
import type { CategorySummary } from "@/lib/domain/summaries"
import { formatCurrency, formatPercent } from "@/lib/format"

type CategoryBreakdownProps = {
  summaries: CategorySummary[]
  totalAssetsCents: number
  totalLiabilitiesCents: number
}

export function CategoryBreakdown({
  summaries,
  totalAssetsCents,
  totalLiabilitiesCents,
}: CategoryBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>分类组成</CardTitle>
        <CardDescription>资产和负债按类别分开展示</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <CategorySection
          title="资产组成"
          kind="asset"
          totalCents={totalAssetsCents}
          summaries={summaries}
          emptyTitle="暂无资产"
          emptyDescription="新增资产项目后可查看资产类别分布"
        />
        <Separator />
        <CategorySection
          title="负债组成"
          kind="liability"
          totalCents={totalLiabilitiesCents}
          summaries={summaries}
          emptyTitle="当前无负债"
          emptyDescription="新增负债项目后可查看负债类别分布"
        />
      </CardContent>
    </Card>
  )
}

function CategorySection({
  title,
  kind,
  totalCents,
  summaries,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  kind: AccountKind
  totalCents: number
  summaries: CategorySummary[]
  emptyTitle: string
  emptyDescription: string
}) {
  const items = summaries.filter((summary) => summary.kind === kind)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <Badge variant="outline">{formatCurrency(totalCents)}</Badge>
      </div>
      {items.length === 0 || totalCents === 0 ? (
        <Empty className="min-h-36 p-6">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const percent = (item.amountCents / totalCents) * 100

            return (
              <div key={`${item.kind}-${item.category}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{ACCOUNT_CATEGORY_LABELS[item.category]}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.amountCents)} · {formatPercent(percent)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-4xl bg-muted">
                  <div
                    className="h-full rounded-4xl bg-primary"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
