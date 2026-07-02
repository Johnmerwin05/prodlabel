import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    EyeIcon,
    FileClockIcon,
    RefreshCwIcon,
    SearchIcon,
    XIcon,
} from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { DataTableHeaderFilter } from "@/components/data-table-header-filter";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/shared/services/api";

type AuditUser = {
    id: number;
    name: string;
    username: string | null;
    email: string | null;
};

type AuditLog = {
    id: string;
    source: "audit" | "activity";
    action: string;
    module: string;
    description: string;
    user: AuditUser | null;
    subject: { type: string; id: number } | null;
    old_values: Record<string, unknown>;
    new_values: Record<string, unknown>;
    properties: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
};

type AuditFilters = {
    search: string;
    module: string;
    action: string;
    date_from: string;
    date_to: string;
    page: number;
    per_page: number;
};

type AuditResponse = {
    data: AuditLog[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: { modules: string[] };
};

const defaultFilters: AuditFilters = {
    search: "",
    module: "",
    action: "",
    date_from: "",
    date_to: "",
    page: 1,
    per_page: 10,
};

export function AuditLogsPage() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = React.useState<AuditFilters>(defaultFilters);
    const [draftFilters, setDraftFilters] =
        React.useState<AuditFilters>(defaultFilters);
    const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

    const logsQuery = useQuery({
        queryKey: ["audit-logs", filters],
        queryFn: async () => {
            const response = await api.get<AuditResponse>("/audit-logs", {
                params: withoutEmptyFilters(filters),
            });
            return response.data;
        },
    });

    const logs = logsQuery.data?.data ?? [];
    const isFiltered = Boolean(
        draftFilters.search ||
        draftFilters.module ||
        draftFilters.action ||
        draftFilters.date_from ||
        draftFilters.date_to,
    );

    function applyFilters(event?: React.FormEvent) {
        event?.preventDefault();
        setFilters({ ...draftFilters, page: 1 });
    }

    function resetFilters() {
        setDraftFilters(defaultFilters);
        setFilters(defaultFilters);
    }

    function applyColumnFilters(next: Partial<AuditFilters>) {
        const updated = { ...draftFilters, ...next, page: 1 };
        setDraftFilters(updated);
        setFilters(updated);
    }

    async function refreshLogs() {
        await queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
        await logsQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Audit Logs"
                description="Review user actions, record changes, access details, and production activity across the system."
            />

            <div className="space-y-0">
                <form
                    className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
                    onSubmit={applyFilters}
                >
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
                        <div className="relative w-full shrink-0 sm:w-72">
                            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={draftFilters.search}
                                className="pl-9"
                                placeholder="Search user, action, or IP..."
                                aria-label="Search audit logs"
                                onChange={(event) =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        search: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="w-full shrink-0 sm:w-48">
                            <DatePicker
                                value={draftFilters.date_from}
                                placeholder="From date"
                                onChange={(date) =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        date_from: date,
                                    }))
                                }
                            />
                        </div>
                        <div className="w-full shrink-0 sm:w-48">
                            <DatePicker
                                value={draftFilters.date_to}
                                placeholder="To date"
                                onChange={(date) =>
                                    setDraftFilters((current) => ({
                                        ...current,
                                        date_to: date,
                                    }))
                                }
                            />
                        </div>
                        <Button type="submit">Apply</Button>
                        {isFiltered ? (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-3"
                                onClick={resetFilters}
                            >
                                Reset
                                <XIcon className="size-4" />
                            </Button>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={logsQuery.isFetching}
                        onClick={refreshLogs}
                    >
                        <RefreshCwIcon
                            className={`size-4 ${logsQuery.isFetching ? "animate-spin" : ""}`}
                        />
                        {logsQuery.isFetching ? "Refreshing..." : "Refresh"}
                    </Button>
                </form>

                <DataTableSurface>
                    {logsQuery.isLoading ? (
                        <AuditTableSkeleton />
                    ) : logsQuery.isError ? (
                        <EmptyState
                            title="Unable to load audit logs"
                            description="You may not have permission, or the server could not complete the request."
                            action={
                                <Button onClick={refreshLogs}>Retry</Button>
                            }
                        />
                    ) : logs.length === 0 ? (
                        <EmptyState
                            title="No audit logs found"
                            description="User actions will appear here as they occur. Adjust the filters if needed."
                        />
                    ) : (
                        <AuditTable
                            logs={logs}
                            modules={Array.from(
                                new Set(logs.map((log) => log.module)),
                            )}
                            actions={Array.from(
                                new Set(logs.map((log) => log.action)),
                            )}
                            module={draftFilters.module}
                            action={draftFilters.action}
                            onModuleChange={(module) =>
                                applyColumnFilters({
                                    module: module === "all" ? "" : module,
                                })
                            }
                            onActionChange={(action) =>
                                applyColumnFilters({
                                    action: action === "all" ? "" : action,
                                })
                            }
                            onView={setSelectedLog}
                        />
                    )}
                </DataTableSurface>
                {logsQuery.data ? (
                    <DataTablePagination
                        meta={logsQuery.data.meta}
                        selectedCount={0}
                        totalRows={logs.length}
                        onPageChange={(page) =>
                            setFilters((current) => ({ ...current, page }))
                        }
                        onPageSizeChange={(per_page) => {
                            setDraftFilters((current) => ({
                                ...current,
                                per_page,
                            }));
                            setFilters((current) => ({
                                ...current,
                                page: 1,
                                per_page,
                            }));
                        }}
                    />
                ) : null}
            </div>

            <AuditDetailSheet
                log={selectedLog}
                onOpenChange={(open) => {
                    if (!open) setSelectedLog(null);
                }}
            />
        </div>
    );
}

function AuditTable({
    logs,
    modules,
    actions,
    module,
    action,
    onModuleChange,
    onActionChange,
    onView,
}: {
    logs: AuditLog[];
    modules: string[];
    actions: string[];
    module: string;
    action: string;
    onModuleChange: (module: string) => void;
    onActionChange: (action: string) => void;
    onView: (log: AuditLog) => void;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-56">User</TableHead>
                    <TableHead className="min-w-44">
                        <DataTableHeaderFilter
                            label="Action"
                            value={action || "all"}
                            options={actions.map((value) => ({
                                label: formatAction(value),
                                value,
                            }))}
                            onValueChange={onActionChange}
                        />
                    </TableHead>
                    <TableHead>
                        <DataTableHeaderFilter
                            label="Module"
                            searchable
                            value={module || "all"}
                            options={modules.map((value) => ({
                                label: toTitleCase(value),
                                value,
                            }))}
                            onValueChange={onModuleChange}
                        />
                    </TableHead>
                    <TableHead className="min-w-72">Details</TableHead>
                    <TableHead className="min-w-44">Date & Time</TableHead>
                    <TableHead className="w-12" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log.id}>
                        <TableCell>
                            <div className="font-medium">
                                {log.user?.name ?? "System"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {log.user?.username ?? "Automated activity"}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">
                                {formatAction(log.action)}
                            </div>
                            <Badge
                                variant={
                                    log.source === "audit"
                                        ? "secondary"
                                        : "outline"
                                }
                                className="mt-1 rounded-sm"
                            >
                                {log.source === "audit"
                                    ? "Record change"
                                    : "User activity"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">
                                {log.module}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <p className="max-w-md line-clamp-2 text-sm text-muted-foreground">
                                {log.description}
                            </p>
                            {log.subject ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {log.subject.type} #{log.subject.id}
                                </p>
                            ) : null}
                        </TableCell>
                        <TableCell>
                            <div>{formatDate(log.created_at)}</div>
                            <div className="text-xs text-muted-foreground">
                                {formatTime(log.created_at)}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`View ${formatAction(log.action)} details`}
                                onClick={() => onView(log)}
                            >
                                <EyeIcon className="size-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function AuditDetailSheet({
    log,
    onOpenChange,
}: {
    log: AuditLog | null;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Sheet open={Boolean(log)} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(46rem,92vw)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <div className="flex items-center gap-2">
                        <FileClockIcon className="size-5 text-primary" />
                        <SheetTitle>Audit Log Details</SheetTitle>
                    </div>
                    <SheetDescription>
                        Complete context captured for this system event.
                    </SheetDescription>
                </SheetHeader>
                {log ? (
                    <ScrollArea className="min-h-0 flex-1 px-4">
                        <div className="space-y-6 px-2 pb-6">
                            <section className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                                <Detail
                                    label="Action"
                                    value={formatAction(log.action)}
                                />
                                <Detail
                                    label="Module"
                                    value={toTitleCase(log.module)}
                                />
                                <Detail
                                    label="User"
                                    value={log.user?.name ?? "System"}
                                    secondary={log.user?.email ?? undefined}
                                />
                                <Detail
                                    label="Date & Time"
                                    value={`${formatDate(log.created_at)} ${formatTime(log.created_at)}`}
                                />
                                <Detail
                                    label="IP Address"
                                    value={log.ip_address ?? "Not captured"}
                                />
                                <Detail
                                    label="Subject"
                                    value={
                                        log.subject
                                            ? `${log.subject.type} #${log.subject.id}`
                                            : "Request activity"
                                    }
                                />
                            </section>

                            <section>
                                <h3 className="font-medium">Description</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {log.description}
                                </p>
                            </section>

                            {log.source === "audit" ? (
                                <ChangeDetails
                                    oldValues={log.old_values}
                                    newValues={log.new_values}
                                />
                            ) : (
                                <JsonDetails
                                    title="Request Details"
                                    value={log.properties}
                                />
                            )}

                            <Separator />
                            <section>
                                <h3 className="font-medium">
                                    Device / User Agent
                                </h3>
                                <p className="mt-2 break-words rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                                    {log.user_agent ?? "Not captured"}
                                </p>
                            </section>
                        </div>
                    </ScrollArea>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function ChangeDetails({
    oldValues,
    newValues,
}: {
    oldValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
}) {
    const keys = Array.from(
        new Set([...Object.keys(oldValues), ...Object.keys(newValues)]),
    );

    return (
        <section className="space-y-3">
            <div>
                <h3 className="font-medium">Record Changes</h3>
                <p className="text-sm text-muted-foreground">
                    Values before and after the action.
                </p>
            </div>
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Before</TableHead>
                            <TableHead>After</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {keys.map((key) => (
                            <TableRow key={key}>
                                <TableCell className="font-medium">
                                    {toTitleCase(key)}
                                </TableCell>
                                <TableCell className="max-w-52 break-words text-xs text-muted-foreground">
                                    {displayValue(oldValues[key])}
                                </TableCell>
                                <TableCell className="max-w-52 break-words text-xs">
                                    {displayValue(newValues[key])}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
}

function JsonDetails({ title, value }: { title: string; value: unknown }) {
    return (
        <section>
            <h3 className="font-medium">{title}</h3>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-5">
                {JSON.stringify(value, null, 2)}
            </pre>
        </section>
    );
}

function Detail({
    label,
    value,
    secondary,
}: {
    label: string;
    value: string;
    secondary?: string;
}) {
    return (
        <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 break-words font-medium">{value}</div>
            {secondary ? (
                <div className="truncate text-xs text-muted-foreground">
                    {secondary}
                </div>
            ) : null}
        </div>
    );
}

function AuditTableSkeleton() {
    return (
        <div className="space-y-3 p-5">
            {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
            ))}
        </div>
    );
}

function withoutEmptyFilters(filters: AuditFilters) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
    );
}

function formatAction(action: string) {
    return toTitleCase(action.split(".").pop() ?? action);
}

function toTitleCase(value: string) {
    return value
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(value));
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(value));
}

function displayValue(value: unknown) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
}
