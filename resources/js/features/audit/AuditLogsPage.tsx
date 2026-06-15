import { activities } from "@/data/mock"
import { DataTable } from "@/components/data-table"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Immutable tracking for user, customer, product, template, print, reprint, and login actions." />
      <FilterBar>
        <Input placeholder="User" aria-label="Filter by user" />
        <Select><SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger><SelectContent><SelectItem value="products">Products</SelectItem><SelectItem value="printing">Printing</SelectItem></SelectContent></Select>
        <Input type="date" aria-label="Date" />
        <Input placeholder="Action" aria-label="Action" />
      </FilterBar>
      <DataTable data={activities} getKey={(activity) => `${activity.user}-${activity.createdAt}`} columns={[{ header: "User", cell: (row) => row.user }, { header: "Action", cell: (row) => row.action }, { header: "Module", cell: (row) => row.module }, { header: "Description", cell: (row) => row.description }, { header: "IP Address", cell: (row) => row.ip }, { header: "Created At", cell: (row) => row.createdAt }]} />
    </div>
  )
}
