import { BarChart3Icon, BoxesIcon, Building2Icon, PrinterIcon, RefreshCwIcon, Repeat2Icon, TagsIcon, UsersIcon } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts"

import { activities, trendData, usageData } from "@/data/mock"
import { MetricCard } from "@/components/metric-card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Operational health, print throughput, usage trends, and recent production activity."
        actions={<Button variant="outline"><RefreshCwIcon className="size-4" /> Refresh</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Total Customers" value="128" description="+4 this month" icon={<Building2Icon className="size-4" />} />
        <MetricCard title="Total Products" value="2.4M" description="Across active customers" icon={<BoxesIcon className="size-4" />} />
        <MetricCard title="Total Templates" value="86" description="14 versioned this week" icon={<TagsIcon className="size-4" />} />
        <MetricCard title="Products Printed Today" value="7,842" description="96.8% success rate" icon={<PrinterIcon className="size-4" />} />
        <MetricCard title="Products Reprinted Today" value="184" description="2.3% of volume" icon={<Repeat2Icon className="size-4" />} />
        <MetricCard title="Active Users" value="42" description="8 currently online" icon={<UsersIcon className="size-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Printing Trend</CardTitle>
            <CardDescription>Printed and reprinted labels over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ printed: { label: "Printed", color: "var(--chart-2)" }, reprinted: { label: "Reprinted", color: "var(--chart-4)" } }} className="h-72">
              <AreaChart data={trendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="printed" type="monotone" fill="var(--color-printed)" stroke="var(--color-printed)" fillOpacity={0.18} />
                <Area dataKey="reprinted" type="monotone" fill="var(--color-reprinted)" stroke="var(--color-reprinted)" fillOpacity={0.12} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Usage</CardTitle>
            <CardDescription>Share of print volume by customer group.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_220px]">
            <ChartContainer config={{ value: { label: "Usage", color: "var(--chart-3)" } }} className="h-72">
              <PieChart>
                <Pie data={usageData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92}>
                  {usageData.map((_, index) => <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-3 self-center">
              {usageData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <Badge variant="secondary">{item.value}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Daily Printing Activity</CardTitle>
            <CardDescription>Failed counts are monitored for queue health and template issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ printed: { label: "Printed", color: "var(--chart-2)" }, failed: { label: "Failed", color: "var(--destructive)" } }} className="h-64">
              <BarChart data={trendData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="printed" fill="var(--color-printed)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Prints, reprints, customer updates, and user actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={`${activity.user}-${activity.createdAt}`}>
                    <TableCell>
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">{activity.description}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{activity.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
