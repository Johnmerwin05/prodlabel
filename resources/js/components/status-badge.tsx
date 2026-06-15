import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status.toLowerCase() === "active" || status.toLowerCase() === "printed"
      ? "default"
      : status.toLowerCase() === "failed" || status.toLowerCase() === "locked"
        ? "destructive"
        : "secondary"

  return <Badge variant={tone}>{status}</Badge>
}
