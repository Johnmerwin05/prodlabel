import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    RadialBar,
    RadialBarChart,
    XAxis,
    YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { DataTablePagination } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/shared/services/api";
import { useToastStore } from "@/stores/toastStore";
import { useCan } from "@/features/auth/permissions";

type ReportSummary = {
    total_products: number;
    total_customers: number;
    printed_count: number;
    printed_requests: number;
};

type DailyPrinted = {
    date: string;
    printed: number;
};

type TopPrinted = {
    name: string;
    printed: number;
};

type PrintedProductRow = {
    request_id: number;
    job_uuid: string;
    production_date: string;
    customer_name: string;
    customer_code: string | null;
    product_code: string | null;
    product_name: string;
    part_number: string | null;
    pi_number: string | null;
    template_name: string | null;
    serial_number: string;
    label_quantity: number | null;
};

type PrintingReport = {
    data: {
        can_export: boolean;
        range: {
            start_date: string;
            end_date: string;
        };
        summary: ReportSummary;
        daily_printed: DailyPrinted[];
        top_products: TopPrinted[];
        top_customers: TopPrinted[];
        printed_products: PrintedProductRow[];
    };
};

const today = new Date();
const currentYear = today.getFullYear();
const months = Array.from({ length: 12 }, (_, month) => ({
    value: String(month + 1),
    label: new Intl.DateTimeFormat("en", { month: "long" }).format(
        new Date(2000, month, 1),
    ),
}));
const years = Array.from({ length: 11 }, (_, index) => currentYear - index);

export function ReportsPage() {
    const canExport = useCan("report.export");
    const notify = useToastStore((state) => state.notify);
    const [selectedMonth, setSelectedMonth] = React.useState(() =>
        String(today.getMonth() + 1),
    );
    const [selectedYear, setSelectedYear] = React.useState(() =>
        String(currentYear),
    );
    const [printedProductsPage, setPrintedProductsPage] = React.useState(1);
    const [printedProductsPerPage, setPrintedProductsPerPage] =
        React.useState(10);
    const { startDate, endDate } = React.useMemo(
        () => monthRange(Number(selectedYear), Number(selectedMonth)),
        [selectedMonth, selectedYear],
    );
    const printVolumeRef = React.useRef<HTMLDivElement>(null);
    const topProductsRef = React.useRef<HTMLDivElement>(null);
    const topCustomersRef = React.useRef<HTMLDivElement>(null);

    const reportQuery = useQuery({
        queryKey: ["printing-report", startDate, endDate],
        queryFn: async () => {
            const response = await api.get<PrintingReport>(
                "/reports/printing",
                {
                    params: {
                        start_date: startDate || undefined,
                        end_date: endDate || undefined,
                    },
                },
            );

            return response.data.data;
        },
    });

    const report = reportQuery.data;
    const printedProducts = report?.printed_products ?? [];
    const printedProductsLastPage = Math.max(
        1,
        Math.ceil(printedProducts.length / printedProductsPerPage),
    );
    const currentPrintedProductsPage = Math.min(
        printedProductsPage,
        printedProductsLastPage,
    );
    const printedProductsFrom =
        printedProducts.length === 0
            ? 0
            : (currentPrintedProductsPage - 1) * printedProductsPerPage + 1;
    const printedProductsTo = Math.min(
        currentPrintedProductsPage * printedProductsPerPage,
        printedProducts.length,
    );
    const visiblePrintedProducts = printedProducts.slice(
        printedProductsFrom > 0 ? printedProductsFrom - 1 : 0,
        printedProductsTo,
    );

    React.useEffect(() => {
        setPrintedProductsPage(1);
    }, [startDate, endDate]);

    async function exportReport() {
        if (!report) return;

        try {
            const chartImages = {
                printVolume: chartSvgDataUri(printVolumeRef.current),
                topProducts: chartSvgDataUri(topProductsRef.current),
                topCustomers: chartSvgDataUri(topCustomersRef.current),
            };
            downloadExcelReport(report, chartImages);
        } catch {
            notify({
                variant: "error",
                title: "Export failed",
                description: "Unable to generate the Excel report.",
            });
        }
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Dashboard"
                description="Analyze product printing volume, customer activity, and serial output by production date range."
                actions={
                    <>
                        <Button
                            variant="outline"
                            disabled={reportQuery.isFetching}
                            onClick={() => reportQuery.refetch()}
                        >
                            <RefreshCwIcon className="size-4" />
                            Refresh
                        </Button>
                        {report?.can_export ? (
                            <Button
                                disabled={reportQuery.isFetching || !canExport}
                                onClick={exportReport}
                            >
                                <DownloadIcon className="size-4" />
                                Export Excel
                            </Button>
                        ) : null}
                    </>
                }
            />

            <Card size="sm">
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
                    <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                    >
                        <SelectTrigger aria-label="Report month">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem
                                    key={month.value}
                                    value={month.value}
                                >
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                    >
                        <SelectTrigger aria-label="Report year">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {reportQuery.isError ? (
                <EmptyState
                    title="Unable to load reports"
                    description="Please refresh the page or adjust the selected date range."
                    action={
                        <Button onClick={() => reportQuery.refetch()}>
                            Retry
                        </Button>
                    }
                />
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-4">
                        <MetricCard
                            title="Total Products"
                            value={formatNumber(
                                report?.summary.total_products ?? 0,
                            )}
                            description="Current product master records"
                        />
                        <MetricCard
                            title="Total Customers"
                            value={formatNumber(
                                report?.summary.total_customers ?? 0,
                            )}
                            description="Current customer master records"
                        />
                        <MetricCard
                            title="Printed Labels"
                            value={formatNumber(
                                report?.summary.printed_count ?? 0,
                            )}
                            description="Serial labels in selected range"
                        />
                        <MetricCard
                            title="Print Requests"
                            value={formatNumber(
                                report?.summary.printed_requests ?? 0,
                            )}
                            description="Completed requests in selected range"
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Printed Labels Over Time</CardTitle>
                            <CardDescription>
                                Daily printed serial labels by production date.
                            </CardDescription>
                        </CardHeader>
                        <CardContent
                            ref={printVolumeRef}
                            className="min-w-0 overflow-x-auto"
                        >
                            <ChartContainer
                                config={{
                                    printed: {
                                        label: "Printed Labels",
                                        color: "var(--chart-2)",
                                    },
                                }}
                                className="h-80 min-w-[760px] w-full aspect-auto"
                            >
                                <AreaChart data={report?.daily_printed ?? []}>
                                    <defs>
                                        <linearGradient
                                            id="printedFill"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="var(--color-printed)"
                                                stopOpacity={0.6}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="var(--color-printed)"
                                                stopOpacity={0.08}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        interval={0}
                                        tickFormatter={formatDayLabel}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={36}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(_, payload) =>
                                                    formatTooltipDate(
                                                        String(
                                                            payload[0]?.payload
                                                                ?.date ?? "",
                                                        ),
                                                    )
                                                }
                                            />
                                        }
                                    />
                                    <Area
                                        dataKey="printed"
                                        type="monotone"
                                        fill="url(#printedFill)"
                                        stroke="var(--color-printed)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <TopFiveChart
                            title="Top 5 Printed Products"
                            description="Products with the highest printed label count."
                            data={report?.top_products ?? []}
                            variant="radar"
                            ref={topProductsRef}
                        />
                        <TopCustomersRadialChart
                            title="Top 5 Customers"
                            description="Customers with the highest printed label count."
                            data={report?.top_customers ?? []}
                            ref={topCustomersRef}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Printed Products</CardTitle>
                            <CardDescription>
                                Real serial-level printed product data for the
                                selected date range.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                Production Date
                                            </TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Serial Number</TableHead>
                                            <TableHead>Label Qty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {printedProducts.length ? (
                                            visiblePrintedProducts.map(
                                                (row, index) => (
                                                    <TableRow
                                                        key={`${row.job_uuid}-${row.serial_number}-${index}`}
                                                    >
                                                        <TableCell>
                                                            {
                                                                row.production_date
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {
                                                                    row.product_name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                PN{" "}
                                                                {row.part_number ??
                                                                    "-"}{" "}
                                                                · PI{" "}
                                                                {row.pi_number ??
                                                                    "-"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                {
                                                                    row.customer_name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {row.customer_code ??
                                                                    "-"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium tabular-nums">
                                                            {row.serial_number}
                                                        </TableCell>
                                                        <TableCell className="tabular-nums">
                                                            {row.label_quantity ??
                                                                "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-28 text-center text-muted-foreground"
                                                >
                                                    No printed products found
                                                    for this range.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <DataTablePagination
                            meta={{
                                current_page: currentPrintedProductsPage,
                                last_page: printedProductsLastPage,
                                per_page: printedProductsPerPage,
                                total: printedProducts.length,
                            }}
                            selectedCount={0}
                            totalRows={printedProducts.length}
                            summary={`Showing ${printedProductsFrom}–${printedProductsTo} of ${printedProducts.length} rows`}
                            onPageChange={setPrintedProductsPage}
                            onPageSizeChange={(pageSize) => {
                                setPrintedProductsPerPage(pageSize);
                                setPrintedProductsPage(1);
                            }}
                        />
                    </Card>
                </>
            )}
        </div>
    );
}

const TopFiveChart = React.forwardRef<
    HTMLDivElement,
    {
        title: string;
        description: string;
        data: TopPrinted[];
        variant?: "bar" | "radar";
    }
>(function TopFiveChart({ title, description, data, variant = "bar" }, ref) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent ref={ref}>
                <ChartContainer
                    config={{
                        printed: {
                            label: "Printed Labels",
                            color: "var(--chart-3)",
                        },
                    }}
                    className="h-80"
                >
                    {variant === "radar" ? (
                        <RadarChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 36,
                                bottom: 20,
                                left: 36,
                            }}
                        >
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent />}
                            />
                            <PolarAngleAxis
                                dataKey="name"
                                tick={{
                                    fontSize: 11,
                                    fill: "var(--muted-foreground)",
                                }}
                                tickLine={false}
                            />
                            <PolarGrid radialLines={false} />
                            <Radar
                                dataKey="printed"
                                fill="var(--color-printed)"
                                fillOpacity={0.55}
                                stroke="var(--color-printed)"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "var(--color-printed)" }}
                            />
                        </RadarChart>
                    ) : (
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ left: 8 }}
                        >
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={120}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="printed"
                                fill="var(--color-printed)"
                                radius={4}
                            />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
});

const customerChartColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
];

const TopCustomersRadialChart = React.forwardRef<
    HTMLDivElement,
    {
        title: string;
        description: string;
        data: TopPrinted[];
    }
>(function TopCustomersRadialChart({ title, description, data }, ref) {
    const chartData = data.slice(0, 5).map((customer, index) => ({
        ...customer,
        fill: customerChartColors[index],
    }));
    const totalPrinted = chartData.reduce(
        (total, customer) => total + customer.printed,
        0,
    );
    const maxPrinted = Math.max(
        ...chartData.map((customer) => customer.printed),
        1,
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent ref={ref}>
                {chartData.length === 0 ? (
                    <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                        No customer printing data for this range.
                    </div>
                ) : (
                    <div className="grid min-h-80 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.72fr)]">
                        <ChartContainer
                            config={{
                                printed: {
                                    label: "Printed Labels",
                                    color: "var(--chart-1)",
                                },
                            }}
                            className="mx-auto aspect-square max-h-72 w-full"
                        >
                            <RadialBarChart
                                data={chartData}
                                innerRadius="30%"
                                outerRadius="92%"
                                startAngle={90}
                                endAngle={-270}
                            >
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            nameKey="name"
                                            formatter={(value) => (
                                                <div className="flex min-w-32 items-center justify-between gap-3">
                                                    <span className="text-muted-foreground">
                                                        Printed labels
                                                    </span>
                                                    <span className="font-mono font-medium tabular-nums text-foreground">
                                                        {formatNumber(
                                                            Number(value),
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <PolarGrid
                                    gridType="circle"
                                    radialLines={false}
                                    stroke="none"
                                />
                                <RadialBar
                                    dataKey="printed"
                                    background={{ fill: "var(--muted)" }}
                                    cornerRadius={8}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[0, maxPrinted]}
                                    tick={false}
                                    tickLine={false}
                                    axisLine={false}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (
                                                !viewBox ||
                                                !("cx" in viewBox) ||
                                                !("cy" in viewBox)
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-2xl font-bold"
                                                    >
                                                        {formatNumber(
                                                            totalPrinted,
                                                        )}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={
                                                            (viewBox.cy ?? 0) +
                                                            22
                                                        }
                                                        className="fill-muted-foreground text-xs"
                                                    >
                                                        Printed
                                                    </tspan>
                                                </text>
                                            );
                                        }}
                                    />
                                </PolarRadiusAxis>
                            </RadialBarChart>
                        </ChartContainer>

                        <div className="space-y-2.5">
                            {chartData.map((customer, index) => (
                                <div
                                    key={`${customer.name}-${index}`}
                                    className="flex items-center gap-2.5"
                                >
                                    <span
                                        className="size-2.5 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: customer.fill,
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">
                                            {index + 1}. {customer.name}
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs font-medium tabular-nums">
                                        {formatNumber(customer.printed)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

function monthRange(year: number, month: number) {
    const paddedMonth = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();

    return {
        startDate: `${year}-${paddedMonth}-01`,
        endDate: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
    };
}

function formatDayLabel(date: string) {
    return String(Number(date.slice(-2)));
}

function formatTooltipDate(date: string) {
    if (!date) return "";

    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(year, month - 1, day));
}

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
}

function chartSvgDataUri(container: HTMLElement | null) {
    const svg = container?.querySelector("svg");
    if (!svg) return "";

    const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
    clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSvg.style.setProperty("--color-printed", "#2563eb");
    const serialized = new XMLSerializer().serializeToString(clonedSvg);

    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(serialized)))}`;
}

function downloadExcelReport(
    report: PrintingReport["data"],
    chartImages: Record<string, string>,
) {
    const html = `
        <html>
            <head>
                <meta charset="UTF-8" />
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #d9d9d9; padding: 6px; }
                    th { background: #f2f2f2; font-weight: 700; }
                    .section { margin-top: 18px; font-size: 16px; font-weight: 700; }
                    img { width: 720px; max-width: 720px; }
                </style>
            </head>
            <body>
                <h1>Production Label Report</h1>
                <p>Date Range: ${escapeHtml(report.range.start_date)} to ${escapeHtml(report.range.end_date)}</p>
                <table>
                    <tr>
                        <th>Total Products</th>
                        <th>Total Customers</th>
                        <th>Printed Labels</th>
                        <th>Print Requests</th>
                    </tr>
                    <tr>
                        <td>${report.summary.total_products}</td>
                        <td>${report.summary.total_customers}</td>
                        <td>${report.summary.printed_count}</td>
                        <td>${report.summary.printed_requests}</td>
                    </tr>
                </table>

                <div class="section">Printed Labels Over Time</div>
                ${chartImages.printVolume ? `<img src="${chartImages.printVolume}" />` : ""}
                <div class="section">Top 5 Printed Products</div>
                ${chartImages.topProducts ? `<img src="${chartImages.topProducts}" />` : ""}
                <div class="section">Top 5 Customers</div>
                ${chartImages.topCustomers ? `<img src="${chartImages.topCustomers}" />` : ""}

                <div class="section">Printed Products</div>
                <table>
                    <tr>
                        <th>Production Date</th>
                        <th>Product</th>
                        <th>Part Number</th>
                        <th>PI Number</th>
                        <th>Customer</th>
                        <th>Template</th>
                        <th>Serial Number</th>
                        <th>Label Quantity</th>
                        <th>Job UUID</th>
                    </tr>
                    ${report.printed_products
                        .map(
                            (row) => `
                                <tr>
                                    <td>${escapeHtml(row.production_date)}</td>
                                    <td>${escapeHtml(row.product_name)}</td>
                                    <td>${escapeHtml(row.part_number ?? "")}</td>
                                    <td>${escapeHtml(row.pi_number ?? "")}</td>
                                    <td>${escapeHtml(row.customer_name)}</td>
                                    <td>${escapeHtml(row.template_name ?? "")}</td>
                                    <td>${escapeHtml(row.serial_number)}</td>
                                    <td>${row.label_quantity ?? ""}</td>
                                    <td>${escapeHtml(row.job_uuid)}</td>
                                </tr>
                            `,
                        )
                        .join("")}
                </table>
            </body>
        </html>
    `;

    const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `production-label-report-${report.range.start_date}-to-${report.range.end_date}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
