import type * as React from "react"
import { FileSearch } from "lucide-react"

import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
        <FileSearch className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function EmptyCreateButton({ children }: { children: React.ReactNode }) {
  return <Button type="button">{children}</Button>
}
