import { PrinterIcon } from "lucide-react"

import { products } from "@/data/mock"
import { DataTable } from "@/components/data-table"
import { FilterBar } from "@/components/filter-bar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MassPrintingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mass Printing" description="Select customer, products, and template before queueing a non-blocking print batch." actions={<Button><PrinterIcon className="size-4" /> Queue Print Job</Button>} />
      <FilterBar>
        <Select><SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger><SelectContent><SelectItem value="northstar">NorthStar Dairy</SelectItem></SelectContent></Select>
        <Select><SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger><SelectContent><SelectItem value="a4">A4 Milk Carton</SelectItem></SelectContent></Select>
        <Button variant="secondary">Load Products</Button>
      </FilterBar>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataTable data={products} getKey={(product) => product.id} columns={[
          { header: "", cell: () => <Checkbox aria-label="Select product" /> },
          { header: "Product ID", cell: (row) => row.id },
          { header: "SKU", cell: (row) => row.sku },
          { header: "Name", cell: (row) => row.name },
        ]} />
        <Card>
          <CardHeader><CardTitle>Print Queue Summary</CardTitle><CardDescription>Preview selection before dispatching to Redis queue.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[3/2] rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">Print preview canvas</div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span>Selected Products</span><strong>4</strong></div>
              <div className="flex justify-between"><span>Labels Per Page</span><strong>12</strong></div>
              <div className="flex justify-between"><span>Estimated Pages</span><strong>1</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
