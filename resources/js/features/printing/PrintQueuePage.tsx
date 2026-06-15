import { PrinterIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const jobs = [
  { id: "PRN-20260610-001", current: "PRD-1002", total: 120, completed: 92, failed: 2 },
  { id: "PRN-20260610-002", current: "VIAL-A12", total: 500, completed: 500, failed: 0 },
]

export function PrintQueuePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Print Queue" description="Realtime print status, current product, completion, failure, and remaining counts via Reverb." />
      <div className="grid gap-4 xl:grid-cols-2">
        {jobs.map((job) => {
          const value = Math.round((job.completed / job.total) * 100)
          return (
            <Card key={job.id}>
              <CardHeader><CardTitle className="flex items-center gap-2"><PrinterIcon className="size-4" /> {job.id}</CardTitle><CardDescription>Current product: {job.current}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <Progress value={value} />
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div><div className="text-muted-foreground">Completed</div><div className="font-semibold">{job.completed}</div></div>
                  <div><div className="text-muted-foreground">Failed</div><div className="font-semibold">{job.failed}</div></div>
                  <div><div className="text-muted-foreground">Remaining</div><div className="font-semibold">{job.total - job.completed}</div></div>
                  <div><div className="text-muted-foreground">Progress</div><div className="font-semibold">{value}%</div></div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
