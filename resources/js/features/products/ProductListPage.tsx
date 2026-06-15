import { DownloadIcon, FileUpIcon, PlusIcon, PrinterIcon } from "lucide-react"

import { products } from "@/data/mock"
import { DataTable } from "@/components/data-table"
import { EmptyCreateButton, EmptyState } from "@/components/empty-state"
import { FilterBar } from "@/components/filter-bar"
import { MetricCard } from "@/components/metric-card"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { ProductFormDialog } from "@/features/products/ProductFormDialog"
import { UploadProductsDialog } from "@/features/products/UploadProductsDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ProductListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Management"
        description="Create products, upload official Excel templates, manage print counts, and queue mass print jobs."
        actions={<><ProductFormDialog /><UploadProductsDialog /><Button variant="outline"><DownloadIcon className="size-4" /> Download Template</Button><Button><PrinterIcon className="size-4" /> Mass Print</Button><Button variant="outline"><DownloadIcon className="size-4" /> Export</Button></>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Products" value="2.4M" />
        <MetricCard title="Printed" value="2.1M" />
        <MetricCard title="Pending" value="184K" />
        <MetricCard title="Reprinted" value="18K" />
        <MetricCard title="Failed" value="392" />
      </div>
      <FilterBar>
        <Select><SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger><SelectContent><SelectItem value="northstar">NorthStar Dairy</SelectItem></SelectContent></Select>
        <Select><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="printed">Printed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select>
        <Select><SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger><SelectContent><SelectItem value="a4">A4 Milk Carton</SelectItem></SelectContent></Select>
        <Input aria-label="Date range" type="date" />
        <Input aria-label="Search products" placeholder="Search product, SKU, lot" />
      </FilterBar>
      <DataTable
        data={products}
        getKey={(product) => product.id}
        empty={<EmptyState title="No products found" description="Create a product or upload the official Excel template." action={<EmptyCreateButton>Create Product</EmptyCreateButton>} />}
        columns={[
          { header: "Product ID", cell: (row) => <span className="text-xs font-medium tabular-nums">{row.id}</span> },
          { header: "Customer", cell: (row) => row.customer },
          { header: "SKU", cell: (row) => row.sku },
          { header: "Product Name", cell: (row) => <span className="font-medium">{row.name}</span> },
          { header: "Quantity", cell: (row) => row.quantity.toLocaleString() },
          { header: "Print Count", cell: (row) => row.prints },
          { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
          { header: "Created At", cell: (row) => row.createdAt },
        ]}
        actions={() => [{ label: "View" }, { label: "Edit" }, { label: "Print" }, { label: "Reprint" }, { label: "History" }, { label: "Delete" }]}
      />
    </div>
  )
}
