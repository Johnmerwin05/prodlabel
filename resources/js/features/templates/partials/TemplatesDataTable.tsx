import * as React from "react";
import { RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import {
    DataTableHeaderFilter,
    DataTableHeaderMultiFilter,
} from "@/components/data-table-header-filter";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCan } from "@/features/auth/permissions";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { TemplateActions } from "./TemplateDialogs";
import {
    type ConfirmTemplateAction,
    type PaginatedTemplates,
    type Template,
    type TemplateFilters,
    templateStatusOptions,
    TemplatePresenter,
} from "./template.model";

type TemplatesDataTableProps = {
    templates: Template[];
    meta: PaginatedTemplates["meta"] | undefined;
    filters: TemplateFilters;
    draftFilters: TemplateFilters;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<TemplateFilters>>;
    onApplyFilters: () => void;
    onCustomerFilterChange: (customerId: string) => void;
    onStatusFilterChange: (statuses: TemplateFilters["statuses"]) => void;
    onResetFilters: () => void;
    onFiltersChange: React.Dispatch<React.SetStateAction<TemplateFilters>>;
    onRefresh: () => void | Promise<unknown>;
    onCreate: () => void;
    onEdit: (template: Template) => void;
    onPreview: (template: Template) => void;
    onDuplicate: (template: Template) => void;
    onConfirm: (action: ConfirmTemplateAction) => void;
};

export function TemplatesDataTable({
    templates,
    meta,
    filters,
    draftFilters,
    isLoading,
    isError,
    isFetching,
    onDraftFiltersChange,
    onApplyFilters,
    onCustomerFilterChange,
    onStatusFilterChange,
    onResetFilters,
    onFiltersChange,
    onRefresh,
    onCreate,
    onEdit,
    onPreview,
    onDuplicate,
    onConfirm,
}: TemplatesDataTableProps) {
    const canManage = useCan("template.manage");
    const isFiltered =
        draftFilters.search ||
        draftFilters.statuses.length > 0 ||
        draftFilters.customerId !== "all" ||
        draftFilters.withTrashed;

    return (
        <div className="space-y-0">
            <div className="mb-4">
                <DataTableToolbar
                    draftFilters={draftFilters}
                    isFiltered={Boolean(isFiltered)}
                    isFetching={isFetching}
                    onDraftFiltersChange={onDraftFiltersChange}
                    onApplyFilters={onApplyFilters}
                    onResetFilters={onResetFilters}
                    onRefresh={onRefresh}
                />
            </div>

            <DataTableSurface>
                {isLoading ? (
                    <TemplatesTableSkeleton />
                ) : isError ? (
                    <EmptyState
                        title="Unable to load templates"
                        description="Please refresh the page or check your connection."
                        action={<Button onClick={onRefresh}>Retry</Button>}
                    />
                ) : templates.length === 0 ? (
                    <EmptyState
                        title="No templates found"
                        description="Create a template or adjust your filters to find archived records."
                        action={
                            <Button disabled={!canManage} onClick={onCreate}>Create Template</Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-70">
                                    Template Name
                                </TableHead>
                                <TableHead>
                                    <DataTableHeaderFilter
                                        label="Customer"
                                        allLabel="All customers"
                                        searchable
                                        batchSize={50}
                                        value={draftFilters.customerId}
                                        options={Array.from(
                                            new Map(
                                                templates.flatMap((template) =>
                                                    template.customers.map(
                                                        (customer) => [
                                                            String(customer.id),
                                                            {
                                                                label: customer.name,
                                                                value: String(customer.id),
                                                                description: customer.code,
                                                            },
                                                        ] as const,
                                                    ),
                                                ),
                                            ).values(),
                                        )}
                                        onValueChange={onCustomerFilterChange}
                                    />
                                </TableHead>
                                <TableHead>Paper Size</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Date Created</TableHead>
                                <TableHead>
                                    <DataTableHeaderMultiFilter
                                        label="Status"
                                        values={draftFilters.statuses}
                                        options={templateStatusOptions
                                            .filter(({ value }) =>
                                                templates.some((template) =>
                                                    template.deleted_at
                                                        ? value === "archived"
                                                        : template.status === value,
                                                ),
                                            )
                                            .map(({ label, value }) => ({ label, value }))}
                                        onValuesChange={(statuses) =>
                                            onStatusFilterChange(
                                                statuses as TemplateFilters["statuses"],
                                            )
                                        }
                                    />
                                </TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates.map((template) => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">
                                                {template.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Version{" "}
                                                {template.current_version}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex max-w-64 flex-wrap gap-1">
                                            {template.customers?.length ? (
                                                template.customers
                                                    .slice(0, 2)
                                                    .map((customer) => (
                                                        <Badge
                                                            key={customer.id}
                                                            variant="secondary"
                                                            className="rounded-sm"
                                                        >
                                                            {customer.name}
                                                        </Badge>
                                                    ))
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Unassigned
                                                </span>
                                            )}
                                            {(template.customers?.length ?? 0) >
                                            2 ? (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-sm"
                                                >
                                                    +
                                                    {template.customers.length -
                                                        2}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {TemplatePresenter.paperLabel(template)}
                                    </TableCell>
                                    <TableCell>
                                        {template.created_by?.name ??
                                            template.created_by?.username ??
                                            "System"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {TemplatePresenter.formatDate(
                                            template.created_at,
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            status={
                                                template.deleted_at
                                                    ? "deleted"
                                                    : template.status
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TemplateActions
                                            template={template}
                                            onEdit={() => onEdit(template)}
                                            onPreview={() =>
                                                onPreview(template)
                                            }
                                            onDuplicate={() =>
                                                onDuplicate(template)
                                            }
                                            onConfirm={onConfirm}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataTableSurface>

            <DataTablePagination
                meta={meta}
                totalRows={templates.length}
                selectedCount={0}
                pageSizeOptions={[10, 25, 50, 100]}
                onPageChange={(page) =>
                    onFiltersChange((current) => ({ ...current, page }))
                }
                onPageSizeChange={(perPage) =>
                    onFiltersChange((current) => ({
                        ...current,
                        page: 1,
                        perPage,
                    }))
                }
            />
        </div>
    );
}

function DataTableToolbar({
    draftFilters,
    isFiltered,
    isFetching,
    onDraftFiltersChange,
    onApplyFilters,
    onResetFilters,
    onRefresh,
}: {
    draftFilters: TemplateFilters;
    isFiltered: boolean;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<TemplateFilters>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onRefresh: () => void | Promise<unknown>;
}) {
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    async function handleRefresh() {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setIsRefreshing(false);
        }
    }

    return (
        <form
            className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
            onSubmit={(event) => {
                event.preventDefault();
                onApplyFilters();
            }}
        >
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:w-72">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={draftFilters.search}
                        onChange={(event) =>
                            onDraftFiltersChange((current) => ({
                                ...current,
                                search: event.target.value,
                            }))
                        }
                        className="pl-8"
                        placeholder="Filter templates..."
                    />
                </div>
                <Button type="submit">Apply</Button>
                {isFiltered ? (
                    <Button
                        type="button"
                        variant="ghost"
                        className="px-3"
                        onClick={onResetFilters}
                    >
                        Reset
                        <XIcon className="size-4" />
                    </Button>
                ) : null}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        onDraftFiltersChange((current) => ({
                            ...current,
                            withTrashed: !current.withTrashed,
                        }))
                    }
                >
                    {draftFilters.withTrashed
                        ? "Hide archived"
                        : "Show archived"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isFetching || isRefreshing}
                >
                    <RefreshCwIcon
                        className={`size-4 ${
                            isFetching || isRefreshing ? "animate-spin" : ""
                        }`}
                    />
                    {isFetching || isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
            </div>
        </form>
    );
}

function TemplatesTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_32px]"
                >
                    {Array.from({ length: 6 }).map((__, column) => (
                        <Skeleton key={column} className="h-10" />
                    ))}
                </div>
            ))}
        </div>
    );
}
