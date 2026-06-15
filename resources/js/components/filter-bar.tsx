import type * as React from "react"

import { Card, CardContent } from "@/components/ui/card"

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{children}</CardContent>
    </Card>
  )
}
