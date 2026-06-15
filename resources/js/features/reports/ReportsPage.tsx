import { DownloadIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { products, trendData } from "@/data/mock"
import { DataTable } from "@/components/data-table"
import { FilterBar } from "@/components/filter-bar"
import { MetricCard } from "@/components/metric-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analyze printing, customer, template, user activity, and reprint performance." actions={<Button><DownloadIcon className="size-4" /> Export</Button>} />
      <FilterBar>
        <Input type="date" aria-label="Start date" />
        <Input type="date" aria-label="End date" />
        <Select><SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger><SelectContent><SelectItem value="northstar">NorthStar Dairy</SelectItem></SelectContent></Select>
        <Select><SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger><SelectContent><SelectItem value="a4">A4 Milk Carton</SelectItem></SelectContent></Select>
        <Select><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="printed">Printed</SelectItem></SelectContent></Select>
      </FilterBar>
      <Tabs defaultValue="printing">
        <TabsList className="flex flex-wrap h-auto justify-start"><TabsTrigger value="printing">Printing Reports</TabsTrigger><TabsTrigger value="customers">Customer Reports</TabsTrigger><TabsTrigger value="templates">Template Reports</TabsTrigger><TabsTrigger value="users">User Activity</TabsTrigger><TabsTrigger value="reprints">Reprints</TabsTrigger></TabsList>
        <TabsContent value="printing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3"><MetricCard title="Printed" value="7,842" /><MetricCard title="Reprinted" value="184" /><MetricCard title="Failure Rate" value="0.4%" /></div>
          <Card><CardHeader><CardTitle>Print Volume</CardTitle><CardDescription>Daily print activity by status.</CardDescription></CardHeader><CardContent><ChartContainer config={{ printed: { label: "Printed", color: "var(--chart-2)" } }} className="h-72"><BarChart data={trendData}><CartesianGrid vertical={false} /><XAxis dataKey="day" /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="printed" fill="var(--color-printed)" radius={4} /></BarChart></ChartContainer></CardContent></Card>
          <DataTable data={products} getKey={(product) => product.id} columns={[{ header: "Product ID", cell: (row) => row.id }, { header: "Customer", cell: (row) => row.customer }, { header: "SKU", cell: (row) => row.sku }, { header: "Print Count", cell: (row) => row.prints }, { header: "Status", cell: (row) => row.status }]} />
        </TabsContent>
        {["customers", "templates", "users", "reprints"].map((tab) => <TabsContent key={tab} value={tab}><Card><CardHeader><CardTitle className="capitalize">{tab} Report</CardTitle><CardDescription>Filtered KPIs, charts, and exportable table for {tab}.</CardDescription></CardHeader><CardContent className="h-72 rounded-lg border bg-muted/20" /></Card></TabsContent>)}
      </Tabs>
    </div>
  )
}
