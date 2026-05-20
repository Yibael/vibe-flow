"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import {
  createAccountItemAction,
  updateAccountItemAction,
} from "@/app/actions/account-items"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  ACCOUNT_CATEGORY_LABELS,
  ACCOUNT_CATEGORY_OPTIONS,
  type AccountItem,
  type AccountKind,
  getDefaultCategory,
} from "@/lib/domain/account-items"
import { formatCentsInput } from "@/lib/format"
import type { ActionResult } from "@/lib/validations"

type AccountItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: AccountItem | null
}

export function AccountItemDialog({
  open,
  onOpenChange,
  item,
}: AccountItemDialogProps) {
  const initialKind = item?.kind ?? "asset"
  const [kind, setKind] = useState<AccountKind>(initialKind)
  const [category, setCategory] = useState(
    item?.category ?? getDefaultCategory(initialKind)
  )
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const mode = item ? "edit" : "create"

  const categories = useMemo(() => ACCOUNT_CATEGORY_OPTIONS[kind], [kind])

  function handleKindChange(value: string) {
    if (!value) {
      return
    }

    const nextKind = value as AccountKind
    setKind(nextKind)
    setCategory(getDefaultCategory(nextKind))
  }

  function handleSubmit(formData: FormData) {
    setErrors({})
    setMessage(null)
    formData.set("kind", kind)
    formData.set("category", category)
    if (item) {
      formData.set("id", item.id)
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAccountItemAction(formData)
          : await updateAccountItemAction(formData)

      handleResult(result)
    })
  }

  function handleResult(result: ActionResult) {
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      setMessage(result.message)
      return
    }

    toast.success(result.message)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增项目" : "编辑项目"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "录入一个资产或负债余额，用于计算当前净值"
              : "更新项目名称、类别、金额或备注"}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-6">
          <FieldGroup>
            <Field>
              <FieldLabel>项目类型</FieldLabel>
              <ToggleGroup
                type="single"
                value={kind}
                onValueChange={handleKindChange}
                variant="outline"
                spacing={0}
                className="w-full"
              >
                <ToggleGroupItem value="asset" className="flex-1">
                  资产
                </ToggleGroupItem>
                <ToggleGroupItem value="liability" className="flex-1">
                  负债
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field data-invalid={Boolean(errors.name?.length)}>
              <FieldLabel htmlFor="name">名称</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={item?.name ?? ""}
                placeholder={kind === "asset" ? "招商银行储蓄卡" : "住房贷款"}
                aria-invalid={Boolean(errors.name?.length)}
              />
              <FieldError errors={errors.name?.map((error) => ({ message: error }))} />
            </Field>

            <Field data-invalid={Boolean(errors.category?.length)}>
              <FieldLabel>类别</FieldLabel>
              <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                <SelectTrigger className="w-full" aria-invalid={Boolean(errors.category?.length)}>
                  <SelectValue placeholder="请选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ACCOUNT_CATEGORY_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={errors.category?.map((error) => ({ message: error }))} />
            </Field>

            <Field data-invalid={Boolean(errors.amount?.length)}>
              <FieldLabel htmlFor="amount">金额</FieldLabel>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                defaultValue={item ? formatCentsInput(item.amountCents) : ""}
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount?.length)}
              />
              <FieldDescription>请输入当前余额，负债也按正数录入</FieldDescription>
              <FieldError errors={errors.amount?.map((error) => ({ message: error }))} />
            </Field>

            <Field data-invalid={Boolean(errors.note?.length)}>
              <FieldLabel htmlFor="note">备注</FieldLabel>
              <Textarea
                id="note"
                name="note"
                defaultValue={item?.note ?? ""}
                placeholder="可选"
                aria-invalid={Boolean(errors.note?.length)}
              />
              <FieldError errors={errors.note?.map((error) => ({ message: error }))} />
            </Field>
          </FieldGroup>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : mode === "create" ? "保存项目" : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
