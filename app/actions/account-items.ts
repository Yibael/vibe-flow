"use server"

import { revalidatePath } from "next/cache"

import {
  archiveAccountItem,
  createAccountItem,
  updateAccountItem,
} from "@/lib/db/queries"
import { accountItemInputSchema, type ActionResult } from "@/lib/validations"

function revalidateBusinessRoutes() {
  revalidatePath("/")
  revalidatePath("/accounts")
  revalidatePath("/snapshots")
}

function parseAccountFormData(formData: FormData) {
  return accountItemInputSchema.safeParse({
    id: formData.get("id")?.toString(),
    name: formData.get("name")?.toString() ?? "",
    kind: formData.get("kind")?.toString() ?? "asset",
    category: formData.get("category")?.toString() ?? "",
    amount: formData.get("amount")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  })
}

export async function createAccountItemAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseAccountFormData(formData)

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查表单内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    createAccountItem({
      name: parsed.data.name,
      kind: parsed.data.kind,
      category: parsed.data.category,
      amountCents: parsed.data.amount,
      note: parsed.data.note,
    })
    revalidateBusinessRoutes()

    return { ok: true, message: "项目已新增", status: "created" }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "保存失败，请稍后重试" }
  }
}

export async function updateAccountItemAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseAccountFormData(formData)
  const id = formData.get("id")?.toString()

  if (!id) {
    return { ok: false, message: "项目不存在或已被归档" }
  }

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查表单内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const item = updateAccountItem(id, {
      name: parsed.data.name,
      kind: parsed.data.kind,
      category: parsed.data.category,
      amountCents: parsed.data.amount,
      note: parsed.data.note,
    })

    if (!item) {
      return { ok: false, message: "项目不存在或已被归档" }
    }

    revalidateBusinessRoutes()

    return { ok: true, message: "项目已更新", status: "updated" }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "保存失败，请稍后重试" }
  }
}

export async function archiveAccountItemAction(
  id: string
): Promise<ActionResult> {
  try {
    const item = archiveAccountItem(id)

    if (!item) {
      return { ok: false, message: "项目不存在或已被归档" }
    }

    revalidateBusinessRoutes()

    return { ok: true, message: "项目已归档", status: "archived" }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "归档失败，请稍后重试" }
  }
}
