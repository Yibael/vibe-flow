import type { ComponentType } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MetricCard({
  title,
  value,
  description,
  badge,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  badge?: string
  icon?: ComponentType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 truncate text-xl md:text-2xl">
            {value}
          </CardTitle>
        </div>
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted-foreground">{description}</p>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </CardContent>
    </Card>
  )
}

