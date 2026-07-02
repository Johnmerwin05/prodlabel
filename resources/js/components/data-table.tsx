import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";
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
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    MoreHorizontal,
} from "lucide-react";

type Column<T> = {
    header: string;
    cell: (row: T) => React.ReactNode;
    className?: string;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    getKey: (row: T) => string;
    empty?: React.ReactNode;
    actions?: (row: T) => { label: string; onClick?: () => void }[];
};

export function DataTable<T>({
    columns,
    data,
    getKey,
    empty,
    actions,
}: DataTableProps<T>) {
    if (!data.length && empty) return <>{empty}</>;

    return (
        <Card>
            <CardContent className="p-0">
                <DataTableSurface>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead
                                        key={column.header}
                                        className={column.className}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                                {actions ? (
                                    <TableHead className="w-12 text-right">
                                        Actions
                                    </TableHead>
                                ) : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row) => (
                                <TableRow key={getKey(row)}>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.header}
                                            className={column.className}
                                        >
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                    {actions ? (
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label="Open row actions"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {actions(row).map(
                                                        (action) => (
                                                            <DropdownMenuItem
                                                                key={
                                                                    action.label
                                                                }
                                                                onClick={
                                                                    action.onClick
                                                                }
                                                            >
                                                                {action.label}
                                                            </DropdownMenuItem>
                                                        ),
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DataTableSurface>
            </CardContent>
        </Card>
    );
}

export function DataTableSurface({ children }: { children: React.ReactNode }) {
    return <div className="overflow-hidden bg-background">{children}</div>;
}

export type DataTablePaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type DataTablePaginationProps = {
    meta?: DataTablePaginationMeta;
    selectedCount: number;
    totalRows: number;
    summary?: React.ReactNode;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
};

export function DataTablePagination({
    meta,
    selectedCount,
    totalRows,
    summary,
    pageSizeOptions = [10, 25, 50, 100],
    onPageChange,
    onPageSizeChange,
}: DataTablePaginationProps) {
    const currentPage = meta?.current_page ?? 1;
    const lastPage = meta?.last_page ?? 1;
    const pageSize = String(meta?.per_page ?? pageSizeOptions[0] ?? 10);
    const rowCount = meta?.total ?? totalRows;

    return (
        <div className="flex min-h-18 flex-col gap-4 bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
                {summary ?? `${selectedCount} of ${rowCount} row(s) selected.`}
            </div>
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                    <Select
                        value={pageSize}
                        onValueChange={(value) =>
                            onPageSizeChange?.(Number(value))
                        }
                        disabled={!onPageSizeChange}
                    >
                        <SelectTrigger className="h-10 w-20 rounded-lg">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((option) => (
                                <SelectItem key={option} value={String(option)}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-w-24 text-center text-sm font-medium">
                    Page {currentPage} of {lastPage}
                </div>
                <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent className="gap-2">
                        <DataTablePaginationButton
                            label="Go to first page"
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(1)}
                        >
                            <ChevronsLeftIcon className="size-4" />
                        </DataTablePaginationButton>
                        <DataTablePaginationButton
                            label="Go to previous page"
                            disabled={currentPage <= 1}
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </DataTablePaginationButton>
                        <DataTablePaginationButton
                            label="Go to next page"
                            disabled={currentPage >= lastPage}
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            <ChevronRightIcon className="size-4" />
                        </DataTablePaginationButton>
                        <DataTablePaginationButton
                            label="Go to last page"
                            disabled={currentPage >= lastPage}
                            onClick={() => onPageChange(lastPage)}
                        >
                            <ChevronsRightIcon className="size-4" />
                        </DataTablePaginationButton>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

function DataTablePaginationButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <PaginationItem>
            <PaginationLink
                href="#"
                size="icon-lg"
                aria-label={label}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : undefined}
                className={`border bg-background ${disabled ? "pointer-events-none opacity-50" : ""}`}
                onClick={(event) => {
                    event.preventDefault();
                    if (!disabled) onClick();
                }}
            >
                <span className="sr-only">{label}</span>
                {children}
            </PaginationLink>
        </PaginationItem>
    );
}
