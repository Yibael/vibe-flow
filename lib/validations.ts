import { z } from "zod"

import {
  ACCOUNT_CATEGORIES,
  ACCOUNT_KINDS,
  categoryMatchesKind,
} from "@/lib/domain/account-items"
import { parseYuanToCents } from "@/lib/format"
import { isDateString } from "@/lib/domain/snapshots"

export const accountItemInputSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(1, "请输入项目名称")
      .max(80, "名称不能超过 80 个字符"),
    kind: z.enum(ACCOUNT_KINDS),
    category: z.enum(ACCOUNT_CATEGORIES, {
      message: "请选择类别",
    }),
    amount: z
      .string()
      .trim()
      .min(1, "请输入有效金额")
      .transform((value, context) => {
        const cents = parseYuanToCents(value)

        if (cents === null) {
          context.addIssue({
            code: "custom",
            message: value.startsWith("-") ? "金额不能为负数" : "请输入有效金额",
          })

          return z.NEVER
        }

        return cents
      }),
    note: z.string().trim().max(500, "备注不能超过 500 个字符").optional(),
  })
  .refine((value) => categoryMatchesKind(value.kind, value.category), {
    path: ["category"],
    message: "类别与项目类型不匹配",
  })

export const snapshotDateInputSchema = z.object({
  snapshotDate: z.string().refine(isDateString, "请输入有效日期"),
})

export type AccountItemInput = z.infer<typeof accountItemInputSchema>
export type SnapshotDateInput = z.infer<typeof snapshotDateInputSchema>

export type ActionResult =
  | {
      ok: true
      message: string
      status?: "created" | "updated" | "deleted" | "archived"
    }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[] | undefined>
    }
