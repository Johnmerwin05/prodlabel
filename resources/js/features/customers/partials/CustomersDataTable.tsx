import * as React from "react";
import { RefreshCwIcon, SearchIcon, XIcon } from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { DataTableHeaderMultiFilter } from "@/components/data-table-header-filter";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useCan } from "@/features/auth/permissions";
import { Checkbox } from "@/components/ui/checkbox";
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

import { CustomerActions } from "./CustomerDialogs";
import {
    type ConfirmCustomerAction,
    type Customer,
    type CustomerColumnKey,
    type CustomerFilters,
    type PaginatedCustomers,
    customerStatusOptions,
    CustomerPresenter,
} from "./customer.model";

type CustomersDataTableProps = {
    customers: Customer[];
    meta: PaginatedCustomers["meta"] | undefined;
    filters: CustomerFilters;
    draftFilters: CustomerFilters;
    visibleColumns: Record<CustomerColumnKey, boolean>;
    selectedRows: Set<number>;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    allPageRowsSelected: boolean;
    somePageRowsSelected: boolean;
    selectedCount: number;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<CustomerFilters>>;
    onApplyFilters: () => void;
    onStatusFilterChange: (statuses: CustomerFilters["statuses"]) => void;
    onResetFilters: () => void;
    onFiltersChange: React.Dispatch<React.SetStateAction<CustomerFilters>>;
    onRefresh: () => void | Promise<unknown>;
    onToggleRowSelection: (customerId: number, selected: boolean) => void;
    onTogglePageSelection: (selected: boolean) => void;
    onCreate: () => void;
    onEdit: (customer: Customer) => void;
    onConfirm: (action: ConfirmCustomerAction) => void;
};

export function CustomersDataTable({
    customers,
    meta,
    filters,
    draftFilters,
    visibleColumns,
    selectedRows,
    isLoading,
    isError,
    isFetching,
    allPageRowsSelected,
    somePageRowsSelected,
    selectedCount,
    onDraftFiltersChange,
    onApplyFilters,
    onStatusFilterChange,
    onResetFilters,
    onFiltersChange,
    onRefresh,
    onToggleRowSelection,
    onTogglePageSelection,
    onCreate,
    onEdit,
    onConfirm,
}: CustomersDataTableProps) {
    const canCreate = useCan("customer.create");
    const isFiltered =
        draftFilters.search ||
        draftFilters.statuses.length > 0 ||
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
                    <CustomersTableSkeleton />
                ) : isError ? (
                    <EmptyState
                        title="Unable to load customers"
                        description="Please refresh the page or check your connection."
                        action={<Button onClick={onRefresh}>Retry</Button>}
                    />
                ) : customers.length === 0 ? (
                    <EmptyState
                        title="No customers found"
                        description="Create a customer or adjust your filters to find archived records."
                        action={
                            <Button disabled={!canCreate} onClick={onCreate}>Create Customer</Button>
                        }
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={
                                            allPageRowsSelected
                                                ? true
                                                : somePageRowsSelected
                                                  ? "indeterminate"
                                                  : false
                                        }
                                        aria-label="Select all"
                                        onCheckedChange={(checked) =>
                                            onTogglePageSelection(
                                                checked === true,
                                            )
                                        }
                                    />
                                </TableHead>
                                <TableHead className="min-w-70">
                                    Customer
                                </TableHead>
                                <TableHead>Customer Code</TableHead>
                                {visibleColumns.address ? (
                                    <TableHead>Address</TableHead>
                                ) : null}
                                {visibleColumns.status ? (
                                    <TableHead>
                                        <DataTableHeaderMultiFilter
                                            label="Status"
                                            values={draftFilters.statuses}
                                            options={customerStatusOptions
                                                .filter(({ value }) =>
                                                    customers.some(
                                                        (customer) =>
                                                            !customer.deleted_at &&
                                                            customer.status === value,
                                                    ),
                                                )
                                                .map(({ label, value }) => ({
                                                    label,
                                                    value,
                                                }))}
                                            onValuesChange={(statuses) =>
                                                onStatusFilterChange(
                                                    statuses as CustomerFilters["statuses"],
                                                )
                                            }
                                        />
                                    </TableHead>
                                ) : null}
                                {visibleColumns.updated_at ? (
                                    <TableHead>Updated</TableHead>
                                ) : null}
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow
                                    key={customer.id}
                                    data-state={
                                        selectedRows.has(customer.id)
                                            ? "selected"
                                            : undefined
                                    }
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRows.has(
                                                customer.id,
                                            )}
                                            aria-label={`Select ${customer.name}`}
                                            onCheckedChange={(checked) =>
                                                onToggleRowSelection(
                                                    customer.id,
                                                    checked === true,
                                                )
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xs font-semibold">
                                                {CustomerPresenter.getInitials(
                                                    customer.name,
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium">
                                                    {customer.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {customer.email ??
                                                        "No email"}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {customer.contact_number ??
                                                        "No contact number"}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium tabular-nums">
                                            {customer.customer_code ??
                                                customer.code}
                                        </span>
                                    </TableCell>
                                    {visibleColumns.address ? (
                                        <TableCell className="max-w-64 truncate text-muted-foreground">
                                            {customer.address ?? "No address"}
                                        </TableCell>
                                    ) : null}
                                    {visibleColumns.status ? (
                                        <TableCell>
                                            <StatusBadge
                                                status={
                                                    customer.deleted_at
                                                        ? "deleted"
                                                        : customer.status
                                                }
                                            />
                                        </TableCell>
                                    ) : null}
                                    {visibleColumns.updated_at ? (
                                        <TableCell className="text-muted-foreground">
                                            {CustomerPresenter.formatDate(
                                                customer.updated_at,
                                            )}
                                        </TableCell>
                                    ) : null}
                                    <TableCell className="text-right">
                                        <CustomerActions
                                            customer={customer}
                                            onEdit={() => onEdit(customer)}
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
                totalRows={customers.length}
                selectedCount={selectedCount}
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
    draftFilters: CustomerFilters;
    isFiltered: boolean;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<CustomerFilters>>;
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
                        placeholder="Filter customers..."
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

function CustomersTableSkeleton() {
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
