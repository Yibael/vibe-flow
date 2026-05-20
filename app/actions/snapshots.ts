"use server"

import { revalidatePath } from "next/cache"

import {
  deleteSnapshot,
  getSnapshotById,
  upsertSnapshot,
} from "@/lib/db/queries"
import { getLocalDateString } from "@/lib/domain/snapshots"
import { snapshotDateInputSchema, type ActionResult } from "@/lib/validations"

function revalidateBusinessRoutes() {
  revalidatePath("/")
  revalidatePath("/snapshots")
}

export async function saveTodaySnapshotAction(): Promise<ActionResult> {
  try {
    const result = upsertSnapshot(getLocalDateString())
    revalidateBusinessRoutes()

    return {
      ok: true,
      message: result.status === "created" ? "快照已保存" : "快照已更新",
      status: result.status,
    }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "快照保存失败，请稍后重试" }
  }
}

export async function backfillSnapshotAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = snapshotDateInputSchema.safeParse({
    snapshotDate: formData.get("snapshotDate")?.toString() ?? "",
  })

  if (!parsed.success) {
    return {
      ok: false,
      message: "请检查表单内容",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const result = upsertSnapshot(parsed.data.snapshotDate)
    revalidateBusinessRoutes()

    return {
      ok: true,
      message: result.status === "created" ? "快照已保存" : "快照已更新",
      status: result.status,
    }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "快照保存失败，请稍后重试" }
  }
}

export async function deleteSnapshotAction(
  id: string
): Promise<ActionResult> {
  try {
    const snapshot = getSnapshotById(id)

    if (!snapshot) {
      return { ok: false, message: "快照不存在或已被删除" }
    }

    const deleted = deleteSnapshot(id)

    if (!deleted) {
      return { ok: false, message: "快照不存在或已被删除" }
    }

    revalidateBusinessRoutes()

    return { ok: true, message: "快照已删除", status: "deleted" }
  } catch (error) {
    console.error(error)

    return { ok: false, message: "删除失败，请稍后重试" }
  }
}
