import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ACCOUNT_CATEGORY_LABELS,
  ACCOUNT_KIND_LABELS,
  type AccountItem,
} from "@/lib/domain/account-items"
import { formatCurrency, formatDateTime } from "@/lib/format"

export function RecentItemsTable({ items }: { items: AccountItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近更新项目</CardTitle>
        <CardDescription>按更新时间倒序展示未归档项目</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/accounts">查看全部</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无资产负债项目</EmptyTitle>
              <EmptyDescription>新增项目后会显示最近更新记录</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/accounts">去添加</Link>
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
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ACCOUNT_KIND_LABELS[item.kind]}</Badge>
                  </TableCell>
                  <TableCell>{ACCOUNT_CATEGORY_LABELS[item.category]}</TableCell>
                  <TableCell>{formatCurrency(item.amountCents)}</TableCell>
                  <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
