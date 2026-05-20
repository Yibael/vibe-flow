"use client"

import { create } from "zustand"

import type { AccountKind } from "@/lib/domain/account-items"

type AccountFilterKind = "all" | AccountKind

type UiState = {
  accountSearch: string
  accountKindFilter: AccountFilterKind
  accountCategoryFilter: string
  showArchived: boolean
  setAccountSearch: (value: string) => void
  setAccountKindFilter: (value: AccountFilterKind) => void
  setAccountCategoryFilter: (value: string) => void
  setShowArchived: (value: boolean) => void
  resetAccountFilters: () => void
}

export const useUiStore = create<UiState>((set) => ({
  accountSearch: "",
  accountKindFilter: "all",
  accountCategoryFilter: "all",
  showArchived: false,
  setAccountSearch: (value) => set({ accountSearch: value }),
  setAccountKindFilter: (value) =>
    set({ accountKindFilter: value, accountCategoryFilter: "all" }),
  setAccountCategoryFilter: (value) => set({ accountCategoryFilter: value }),
  setShowArchived: (value) => set({ showArchived: value }),
  resetAccountFilters: () =>
    set({
      accountSearch: "",
      accountKindFilter: "all",
      accountCategoryFilter: "all",
      showArchived: false,
    }),
}))
