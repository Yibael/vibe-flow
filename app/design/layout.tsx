import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"

export default function DesignLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

