const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2,
})

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100)
}

export function formatCentsInput(cents: number) {
  if (cents === 0) {
    return "0"
  }

  return (cents / 100).toFixed(2).replace(/\.?0+$/, "")
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "暂无"
  }

  return dateTimeFormatter.format(new Date(value))
}

export function parseYuanToCents(value: string) {
  const normalized = value.trim()

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const [yuan, cents = ""] = normalized.split(".")

  return Number(yuan) * 100 + Number(cents.padEnd(2, "0"))
}
