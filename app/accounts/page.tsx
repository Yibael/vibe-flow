import { AccountsClient } from "@/components/net-worth/accounts-client"
import { AppShell } from "@/components/net-worth/app-shell"
import { SummaryCards } from "@/components/net-worth/summary-cards"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAllAccountItems, getCurrentSummary } from "@/lib/db/queries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default function AccountsPage() {
  const summary = getCurrentSummary()
  const items = getAllAccountItems()

  return (
    <AppShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">资产管理</h1>
          <p className="text-sm text-muted-foreground">
            维护资产和负债余额，当前净值会根据未归档项目实时计算
          </p>
        </div>
      </div>

      <SummaryCards
        totalAssetsCents={summary.totalAssetsCents}
        totalLiabilitiesCents={summary.totalLiabilitiesCents}
        netWorthCents={summary.netWorthCents}
      />

      <Card>
        <CardHeader>
          <CardTitle>资产负债项目</CardTitle>
          <CardDescription>新增、编辑和归档当前资产负债余额</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountsClient items={items} />
        </CardContent>
      </Card>
    </AppShell>
  )
}
