import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import {
    CheckCircle2Icon,
    ChevronsUpDownIcon,
    ClockIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PrinterIcon,
    RefreshCwIcon,
    RotateCcwIcon,
    SaveIcon,
    SearchIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SearchableSelect } from "@/components/searchable-select";
import { StatusBadge } from "@/components/status-badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputNumber } from "@/components/ui/input-number";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    type PaginatedProducts,
    type Product,
} from "@/features/products/partials/product.model";
import { type Customer } from "@/features/customers/partials/customer.model";
import { TemplatePreview } from "@/features/templates/partials/TemplatePreview";
import {
    type CanvasSettings,
    type PaperSize,
    type TemplateElement,
    TemplatePresenter,
} from "@/features/templates/partials/template.model";
import { api } from "@/shared/services/api";
import { useCan } from "@/features/auth/permissions";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

type PrintStatus =
    | "queued"
    | "processing"
    | "completed"
    | "completed_with_errors"
    | "failed";

type ProductPrint = {
    id: number;
    job_uuid: string;
    customer: { id: number; name: string; code: string } | null;
    template: { id: number; name: string } | null;
    products?: Array<{
        id: number;
        name: string;
        part_number: string | null;
        pi_number: string | null;
    }>;
    status: PrintStatus;
    production_date: string | null;
    print_quantity: number | null;
    print_count: number;
    serial_numbers?: string[];
    total_products: number;
    completed_products: number;
    failed_products: number;
    created_at: string | null;
    started_at: string | null;
    completed_at: string | null;
};

type PaginatedPrints = {
    data: ProductPrint[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
};

type PrintPreviewLabel = {
    print_id: number;
    item_id: number;
    page_index?: number;
    production_date: string;
    print_quantity: number;
    serial_number: string | null;
    serial_numbers: string[];
    label_quantities: number[];
    job_uuid: string;
    template_name: string | null;
    customer_name: string | null;
    product_name: string | null;
    settings: Partial<CanvasSettings>;
    elements: TemplateElement[];
    repeat_instances?: TemplateElement[][] | null;
    is_reprint?: boolean;
};

type AssignedPrintTemplate = {
    id: number;
    name: string;
};

type PrintFilters = {
    search: string;
    customerId: string;
    statuses: PrintStatus[];
    page: number;
    perPage: number;
};

const defaultPrintFilters: PrintFilters = {
    search: "",
    customerId: "all",
    statuses: [],
    page: 1,
    perPage: 10,
};

const printStatusOptions: Array<{
    label: string;
    value: PrintStatus;
    icon: React.ReactNode;
}> = [
    {
        label: "Queued",
        value: "queued",
        icon: <ClockIcon className="size-4" />,
    },
    {
        label: "Processing",
        value: "processing",
        icon: <PrinterIcon className="size-4 text-primary" />,
    },
    {
        label: "Printed",
        value: "completed",
        icon: <CheckCircle2Icon className="size-4 text-emerald-600" />,
    },
    {
        label: "Printed with errors",
        value: "completed_with_errors",
        icon: <ClockIcon className="size-4 text-amber-600" />,
    },
    {
        label: "Failed",
        value: "failed",
        icon: <XIcon className="size-4 text-destructive" />,
    },
];

export function PrintRequestPage() {
    const canUpdatePrinting = useCan("printing.update");
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] =
        React.useState<PrintFilters>(defaultPrintFilters);
    const [draftFilters, setDraftFilters] =
        React.useState<PrintFilters>(defaultPrintFilters);
    const [isRequestOpen, setIsRequestOpen] = React.useState(false);
    const [selectedPrints, setSelectedPrints] = React.useState<Set<number>>(
        () => new Set(),
    );
    const [deletingPrint, setDeletingPrint] =
        React.useState<ProductPrint | null>(null);
    const [editingPrint, setEditingPrint] = React.useState<ProductPrint | null>(
        null,
    );
    const [previewLabels, setPreviewLabels] = React.useState<
        PrintPreviewLabel[]
    >([]);
    const [isPrintConfirmOpen, setIsPrintConfirmOpen] = React.useState(false);
    const [reprintConfirmationId, setReprintConfirmationId] = React.useState<
        number | null
    >(null);
    const previewCacheRef = React.useRef(
        new Map<string, PrintPreviewLabel[]>(),
    );

    const printsQuery = useQuery({
        queryKey: ["prints", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedPrints>("/prints", {
                params: buildPrintIndexParams(filters),
            });
            return response.data;
        },
    });

    const prints = printsQuery.data?.data ?? [];
    const meta = printsQuery.data?.meta;
    const printablePrints = prints.filter(isDispatchablePrint);
    const allPageRowsSelected =
        printablePrints.length > 0 &&
        printablePrints.every((print) => selectedPrints.has(print.id));
    const somePageRowsSelected =
        printablePrints.some((print) => selectedPrints.has(print.id)) &&
        !allPageRowsSelected;
    const stats = React.useMemo(() => getPrintStats(prints), [prints]);

    React.useEffect(() => {
        setSelectedPrints(new Set());
    }, [filters]);

    const previewPrints = useMutation({
        mutationFn: async ({
            cacheKey,
            printIds,
        }: {
            cacheKey: string;
            printIds: number[];
        }) => {
            const cachedLabels = previewCacheRef.current.get(cacheKey);
            if (cachedLabels) return cachedLabels;

            const response = await api.post<{ data: PrintPreviewLabel[] }>(
                "/prints/preview",
                {
                    print_ids: printIds,
                },
            );
            previewCacheRef.current.set(cacheKey, response.data.data);
            return response.data.data;
        },
        onSuccess: (labels) => {
            setPreviewLabels(labels);
        },
        onError: (error) => showApiError(error, notify),
    });

    const finalizePrints = useMutation({
        mutationFn: async (labels: PrintPreviewLabel[]) => {
            const response = await api.post<{ data: ProductPrint[] }>(
                "/prints/finalize",
                {
                    production_date: labels[0]?.production_date,
                    print_quantity: labels[0]?.print_quantity,
                    labels: labels.map((label) => ({
                        print_id: label.print_id,
                        item_id: label.item_id,
                        page_index: label.page_index ?? 0,
                        serial_numbers: label.serial_numbers,
                        label_quantities: label.label_quantities,
                    })),
                },
            );
            return response.data.data;
        },
        onSuccess: (updatedPrints) => {
            updateVisiblePrints(updatedPrints);
            notify({ variant: "success", title: "Print serials saved" });
            previewCacheRef.current.clear();
            setIsPrintConfirmOpen(false);
            setPreviewLabels([]);
            setSelectedPrints(new Set());
            void queryClient.invalidateQueries({ queryKey: ["prints"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    const deletePrint = useMutation({
        mutationFn: async (print: ProductPrint) => {
            await api.delete(`/prints/${print.id}`);
        },
        onSuccess: async () => {
            notify({ variant: "success", title: "Print request deleted" });
            setDeletingPrint(null);
            setSelectedPrints(new Set());
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["prints"] }),
                queryClient.invalidateQueries({
                    queryKey: ["print-filter-customers"],
                }),
            ]);
        },
        onError: (error) => showApiError(error, notify),
    });

    const updatePrint = useMutation({
        mutationFn: async ({
            print,
            productionDate,
            printQuantity,
        }: {
            print: ProductPrint;
            productionDate: string;
            printQuantity: number;
        }) => {
            const response = await api.put(`/prints/${print.id}`, {
                production_date: productionDate,
                print_quantity: printQuantity,
            });
            return response.data;
        },
        onSuccess: async () => {
            notify({ variant: "success", title: "Print request updated" });
            setEditingPrint(null);
            previewCacheRef.current.clear();
            await queryClient.invalidateQueries({ queryKey: ["prints"] });
        },
        onError: (error) => showApiError(error, notify),
    });

    const reprintPrint = useMutation({
        mutationFn: async (print: ProductPrint) => {
            const response = await api.post<{ data: PrintPreviewLabel[] }>(
                `/prints/${print.id}/reprint-preview`,
            );
            return response.data.data;
        },
        onSuccess: (labels) => {
            setPreviewLabels(labels);
        },
        onError: (error) => showApiError(error, notify),
    });

    const completeReprint = useMutation({
        mutationFn: async (printId: number) => {
            const response = await api.post<{ data: ProductPrint }>(
                `/prints/${printId}/reprint-complete`,
            );
            return response.data.data;
        },
        onSuccess: (updatedPrint) => {
            updateVisiblePrints([updatedPrint]);
            notify({ variant: "success", title: "Reprint completed" });
            setReprintConfirmationId(null);
            setPreviewLabels([]);
        },
        onError: (error) => {
            showApiError(error, notify);
        },
    });

    async function refreshPrints() {
        await queryClient.invalidateQueries({ queryKey: ["prints"] });
        await printsQuery.refetch();
    }

    function applyFilters() {
        setFilters({ ...draftFilters, page: 1 });
    }

    function updateVisiblePrints(
        changedPrints: ProductPrint[],
        prepend = false,
    ) {
        queryClient.setQueryData<PaginatedPrints>(
            ["prints", filters],
            (current) => {
                if (!current || changedPrints.length === 0) return current;

                const changedById = new Map(
                    changedPrints.map((print) => [print.id, print]),
                );
                const existingIds = new Set(
                    current.data.map((print) => print.id),
                );
                const updatedRows = current.data.map(
                    (print) => changedById.get(print.id) ?? print,
                );
                const newRows = prepend
                    ? changedPrints.filter(
                          (print) => !existingIds.has(print.id),
                      )
                    : [];

                return {
                    ...current,
                    data:
                        prepend && current.meta.current_page === 1
                            ? [...newRows, ...updatedRows].slice(
                                  0,
                                  current.meta.per_page,
                              )
                            : updatedRows,
                    meta: {
                        ...current.meta,
                        total: current.meta.total + newRows.length,
                    },
                };
            },
        );
    }

    function resetFilters() {
        setDraftFilters(defaultPrintFilters);
        setFilters(defaultPrintFilters);
    }

    function applyColumnFilters(partialFilters: Partial<PrintFilters>) {
        const nextFilters = {
            ...draftFilters,
            ...partialFilters,
            page: 1,
        };

        setDraftFilters(nextFilters);
        setFilters(nextFilters);
    }

    function togglePrintSelection(printId: number, selected: boolean) {
        const print = prints.find((row) => row.id === printId);
        if (!print || !isDispatchablePrint(print)) return;

        setSelectedPrints((current) => {
            const next = new Set(current);
            if (selected) next.add(printId);
            else next.delete(printId);
            return next;
        });
    }

    function togglePageSelection(selected: boolean) {
        setSelectedPrints((current) => {
            const next = new Set(current);
            printablePrints.forEach((print) => {
                if (selected) next.add(print.id);
                else next.delete(print.id);
            });
            return next;
        });
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Print Request"
                description="Manage print requests, review queue status, and submit product batches for printing."
                actions={
                    <>
                        <Button
                            variant="outline"
                            disabled={
                                selectedPrints.size === 0 ||
                                previewPrints.isPending ||
                                !canUpdatePrinting
                            }
                            onClick={() => {
                                const printIds = Array.from(selectedPrints);
                                previewPrints.mutate({
                                    cacheKey: buildPreviewCacheKey(printIds),
                                    printIds,
                                });
                            }}
                        >
                            <PrinterIcon className="size-4" />
                            {previewPrints.isPending
                                ? "Preparing..."
                                : "Print Selected"}
                        </Button>
                        <Button
                            disabled={!canUpdatePrinting}
                            onClick={() => setIsRequestOpen(true)}
                        >
                            <PrinterIcon className="size-4" />
                            Request for Print
                        </Button>
                    </>
                }
            />

            <PrintStats stats={stats} />

            <div className="space-y-0">
                <div className="mb-4">
                    <PrintToolbar
                        draftFilters={draftFilters}
                        isFetching={printsQuery.isFetching}
                        onDraftFiltersChange={setDraftFilters}
                        onApplyFilters={applyFilters}
                        onResetFilters={resetFilters}
                        onRefresh={refreshPrints}
                    />
                </div>

                <DataTableSurface>
                    {printsQuery.isLoading ? (
                        <PrintsTableSkeleton />
                    ) : printsQuery.isError ? (
                        <EmptyState
                            title="Unable to load print requests"
                            description="Please refresh the page or check your connection."
                            action={
                                <Button onClick={refreshPrints}>Retry</Button>
                            }
                        />
                    ) : prints.length === 0 ? (
                        <EmptyState
                            title="No print requests found"
                            description="Create a request to queue products for printing."
                            action={
                                <Button
                                    disabled={!canUpdatePrinting}
                                    onClick={() => setIsRequestOpen(true)}
                                >
                                    Request for Print
                                </Button>
                            }
                        />
                    ) : (
                        <PrintsTable
                            prints={prints}
                            selectedPrints={selectedPrints}
                            allPageRowsSelected={allPageRowsSelected}
                            somePageRowsSelected={somePageRowsSelected}
                            filters={draftFilters}
                            onTogglePrintSelection={togglePrintSelection}
                            onTogglePageSelection={togglePageSelection}
                            onCustomerFilterChange={(customerId) =>
                                applyColumnFilters({ customerId })
                            }
                            onStatusFilterChange={(statuses) =>
                                applyColumnFilters({ statuses })
                            }
                            onReprint={(print) => reprintPrint.mutate(print)}
                            onEdit={setEditingPrint}
                            onDelete={setDeletingPrint}
                        />
                    )}
                </DataTableSurface>

                <DataTablePagination
                    meta={meta}
                    totalRows={prints.length}
                    selectedCount={selectedPrints.size}
                    onPageChange={(page) =>
                        setFilters((current) => ({ ...current, page }))
                    }
                    onPageSizeChange={(perPage) =>
                        setFilters((current) => ({
                            ...current,
                            page: 1,
                            perPage,
                        }))
                    }
                />
            </div>

            <RequestForPrintSheet
                open={isRequestOpen}
                onOpenChange={setIsRequestOpen}
                onQueued={(createdPrints) => {
                    updateVisiblePrints(createdPrints, true);
                    setIsRequestOpen(false);
                    void queryClient.invalidateQueries({
                        queryKey: ["prints"],
                    });
                    void queryClient.invalidateQueries({
                        queryKey: ["print-filter-customers"],
                    });
                }}
            />
            <PrintPreviewDialog
                labels={previewLabels}
                open={previewLabels.length > 0}
                isFinalizing={
                    finalizePrints.isPending || completeReprint.isPending
                }
                onOpenChange={(open) => {
                    if (!open) setPreviewLabels([]);
                }}
                onPrintDialogClosed={() => {
                    if (previewLabels.every((label) => label.is_reprint)) {
                        const printId = previewLabels[0]?.print_id;
                        setPreviewLabels([]);
                        if (printId) setReprintConfirmationId(printId);
                        return;
                    }

                    setIsPrintConfirmOpen(true);
                }}
            />
            <DeletePrintDialog
                print={deletingPrint}
                isDeleting={deletePrint.isPending}
                onOpenChange={(open) => {
                    if (!open) setDeletingPrint(null);
                }}
                onConfirm={() => {
                    if (deletingPrint) deletePrint.mutate(deletingPrint);
                }}
            />
            <EditPrintDialog
                print={editingPrint}
                isSaving={updatePrint.isPending}
                onOpenChange={(open) => {
                    if (!open) setEditingPrint(null);
                }}
                onSave={(productionDate, printQuantity) => {
                    if (!editingPrint) return;

                    updatePrint.mutate({
                        print: editingPrint,
                        productionDate,
                        printQuantity,
                    });
                }}
            />
            <PrintFinalizeDialog
                open={isPrintConfirmOpen}
                isFinalizing={finalizePrints.isPending}
                onOpenChange={setIsPrintConfirmOpen}
                onCancel={() => setIsPrintConfirmOpen(false)}
                onConfirm={() => finalizePrints.mutate(previewLabels)}
            />
            <ReprintConfirmationDialog
                open={reprintConfirmationId !== null}
                isSaving={completeReprint.isPending}
                onOpenChange={(open) => {
                    if (!open && !completeReprint.isPending) {
                        setReprintConfirmationId(null);
                    }
                }}
                onNo={() => setReprintConfirmationId(null)}
                onYes={() => {
                    if (reprintConfirmationId !== null) {
                        completeReprint.mutate(reprintConfirmationId);
                    }
                }}
            />
        </div>
    );
}

function RequestForPrintSheet({
    open,
    onOpenChange,
    onQueued,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onQueued: (prints: ProductPrint[]) => void;
}) {
    const notify = useToastStore((state) => state.notify);
    const queryClient = useQueryClient();
    const [partNumber, setPartNumber] = React.useState("");
    const [piNumber, setPiNumber] = React.useState("");
    const [productionDate, setProductionDate] = React.useState(() =>
        new Date().toISOString().slice(0, 10),
    );
    const [printQuantity, setPrintQuantity] = React.useState(1);
    const [productPage, setProductPage] = React.useState(1);
    const [productsPerPage, setProductsPerPage] = React.useState(10);
    const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
        () => new Set(),
    );

    const productsQuery = useQuery({
        queryKey: ["request-print-products"],
        enabled: open,
        queryFn: async () => {
            const response = await api.get<PaginatedProducts>("/products", {
                params: {
                    per_page: 1000,
                },
            });
            return response.data.data;
        },
    });

    const productOptions = productsQuery.data ?? [];
    const partNumberOptions = React.useMemo(
        () =>
            Array.from(
                new Set(
                    productOptions
                        .map((product) => product.part_number)
                        .filter((value): value is string => Boolean(value)),
                ),
            ).map((value) => ({ label: value, value })),
        [productOptions],
    );
    const piNumberOptions = React.useMemo(
        () =>
            Array.from(
                new Set(
                    productOptions
                        .filter(
                            (product) =>
                                !partNumber ||
                                product.part_number === partNumber,
                        )
                        .map((product) => product.pi_number)
                        .filter((value): value is string => Boolean(value)),
                ),
            ).map((value) => ({ label: value, value })),
        [productOptions, partNumber],
    );
    const products = React.useMemo(
        () =>
            productOptions.filter((product) => {
                const matchesPartNumber =
                    !partNumber || product.part_number === partNumber;
                const matchesPiNumber =
                    !piNumber || product.pi_number === piNumber;

                return matchesPartNumber && matchesPiNumber;
            }),
        [productOptions, partNumber, piNumber],
    );
    const productLastPage = Math.max(
        1,
        Math.ceil(products.length / productsPerPage),
    );
    const currentProductPage = Math.min(productPage, productLastPage);
    const visibleProducts = React.useMemo(
        () =>
            products.slice(
                (currentProductPage - 1) * productsPerPage,
                currentProductPage * productsPerPage,
            ),
        [currentProductPage, products, productsPerPage],
    );
    const hasProductLookup = Boolean(partNumber || piNumber);
    const selectedProducts = React.useMemo(
        () => productOptions.filter((product) => selectedRows.has(product.id)),
        [productOptions, selectedRows],
    );
    const selectedCustomerIds = React.useMemo(
        () =>
            new Set(
                selectedProducts
                    .map((product) => product.customer?.id)
                    .filter((value): value is number => Boolean(value)),
            ),
        [selectedProducts],
    );
    const selectedCustomerId =
        selectedCustomerIds.size === 1
            ? Array.from(selectedCustomerIds)[0]
            : null;
    const selectedAreas = React.useMemo(
        () =>
            new Set(
                selectedProducts.map((product) => product.area).filter(Boolean),
            ),
        [selectedProducts],
    );
    const selectedArea =
        selectedAreas.size === 1 ? Array.from(selectedAreas)[0] : null;
    const assignedTemplateQuery = useQuery({
        queryKey: [
            "request-print-customer-template",
            selectedCustomerId,
            selectedArea,
        ],
        enabled:
            open &&
            Boolean(selectedCustomerId) &&
            selectedCustomerIds.size === 1 &&
            Boolean(selectedArea) &&
            selectedAreas.size === 1,
        queryFn: async () => {
            const response = await api.get<{
                data: AssignedPrintTemplate | null;
            }>(`/prints/customers/${selectedCustomerId}/template`, {
                params: { area: selectedArea },
            });
            return response.data.data;
        },
    });
    const canQueue =
        selectedRows.size > 0 &&
        selectedCustomerIds.size === 1 &&
        selectedAreas.size === 1 &&
        Boolean(productionDate) &&
        printQuantity >= 1 &&
        !assignedTemplateQuery.isFetching &&
        Boolean(assignedTemplateQuery.data);

    React.useEffect(() => {
        if (
            piNumber &&
            !piNumberOptions.some((option) => option.value === piNumber)
        ) {
            setPiNumber("");
        }
    }, [piNumber, piNumberOptions]);

    React.useEffect(() => {
        setSelectedRows(new Set());
        setProductPage(1);
    }, [partNumber, piNumber]);

    React.useEffect(() => {
        setProductPage((current) => Math.min(current, productLastPage));
    }, [productLastPage]);

    React.useEffect(() => {
        if (!open) {
            setPartNumber("");
            setPiNumber("");
            setProductionDate(new Date().toISOString().slice(0, 10));
            setPrintQuantity(1);
            setProductPage(1);
            setProductsPerPage(10);
            setSelectedRows(new Set());
        }
    }, [open]);

    const queuePrint = useMutation({
        mutationFn: async () => {
            if (!selectedCustomerId) {
                throw new Error("Select products from one customer to print.");
            }
            if (!assignedTemplateQuery.data) {
                throw new Error(
                    "No published template is assigned to this product customer and area.",
                );
            }

            const response = await api.post<{ data: ProductPrint[] }>(
                "/prints",
                {
                    customer_id: selectedCustomerId,
                    production_date: productionDate,
                    print_quantity: printQuantity,
                    product_ids: Array.from(selectedRows),
                },
            );
            return response.data.data;
        },
        onSuccess: (createdPrints) => {
            notify({
                variant: "success",
                title: `${selectedRows.size} print ${selectedRows.size === 1 ? "request" : "requests"} created`,
            });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onQueued(createdPrints);
        },
        onError: (error) => showApiError(error, notify),
    });

    function toggleRowSelection(productId: number, selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            if (selected) next.add(productId);
            else next.delete(productId);
            return next;
        });
    }

    function toggleAllProducts(selected: boolean) {
        setSelectedRows((current) => {
            const next = new Set(current);
            visibleProducts.forEach((product) => {
                if (selected) next.add(product.id);
                else next.delete(product.id);
            });
            return next;
        });
    }

    const allSelected =
        visibleProducts.length > 0 &&
        visibleProducts.every((product) => selectedRows.has(product.id));
    const someSelected =
        visibleProducts.some((product) => selectedRows.has(product.id)) &&
        !allSelected;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(58vw,88rem)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>Request for Print</SheetTitle>
                    <SheetDescription>
                        Search by PI number or part number, then choose the
                        products to print.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col">
                    <ScrollArea className="min-h-0 flex-1 px-4">
                        <div className="space-y-5 px-2 pb-4">
                            <section className="space-y-3">
                                <div className="grid gap-3 lg:grid-cols-2">
                                    <Field label="Part Number">
                                        <SearchableSelect
                                            value={partNumber || undefined}
                                            options={partNumberOptions}
                                            placeholder="Select part number"
                                            searchPlaceholder="Search part number..."
                                            emptyMessage="No part numbers found."
                                            onValueChange={setPartNumber}
                                            onClear={() => setPartNumber("")}
                                        />
                                    </Field>
                                    <Field label="PI Number">
                                        <SearchableSelect
                                            value={piNumber || undefined}
                                            options={piNumberOptions}
                                            placeholder="Select PI number"
                                            searchPlaceholder="Search PI number..."
                                            emptyMessage="No PI numbers found."
                                            onValueChange={setPiNumber}
                                            onClear={() => setPiNumber("")}
                                        />
                                    </Field>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-2">
                                    <Field label="Production Date">
                                        <DatePicker
                                            value={productionDate}
                                            placeholder="Select production date"
                                            onChange={(date) =>
                                                setProductionDate(date)
                                            }
                                        />
                                    </Field>
                                    <Field label="Quantity">
                                        <InputNumber
                                            value={printQuantity}
                                            min={1}
                                            allowDecimal={false}
                                            onValueChange={setPrintQuantity}
                                        />
                                    </Field>
                                </div>
                                <DataTableSurface>
                                    {!hasProductLookup ? (
                                        <EmptyState
                                            title="Search products"
                                            description="Choose a PI number or part number to display product details."
                                        />
                                    ) : productsQuery.isLoading ? (
                                        <RequestProductsSkeleton />
                                    ) : products.length === 0 ? (
                                        <EmptyState
                                            title="No printable products found"
                                            description="Create ready products or adjust the search."
                                        />
                                    ) : (
                                        <>
                                            <RequestProductsTable
                                                products={visibleProducts}
                                                selectedRows={selectedRows}
                                                allSelected={allSelected}
                                                someSelected={someSelected}
                                                onToggleRowSelection={
                                                    toggleRowSelection
                                                }
                                                onToggleAll={toggleAllProducts}
                                            />
                                            <DataTablePagination
                                                meta={{
                                                    current_page:
                                                        currentProductPage,
                                                    last_page: productLastPage,
                                                    per_page: productsPerPage,
                                                    total: products.length,
                                                }}
                                                selectedCount={
                                                    selectedRows.size
                                                }
                                                totalRows={products.length}
                                                summary={`${visibleProducts.length} of ${products.length} product(s) shown. ${selectedRows.size} selected.`}
                                                onPageChange={setProductPage}
                                                onPageSizeChange={(
                                                    pageSize,
                                                ) => {
                                                    setProductsPerPage(
                                                        pageSize,
                                                    );
                                                    setProductPage(1);
                                                }}
                                            />
                                        </>
                                    )}
                                </DataTableSurface>
                                {selectedRows.size > 0 &&
                                selectedCustomerIds.size !== 1 ? (
                                    <p className="text-sm text-destructive">
                                        Select products from one customer only
                                        before printing.
                                    </p>
                                ) : null}
                                {selectedRows.size > 0 &&
                                selectedCustomerIds.size === 1 &&
                                selectedAreas.size !== 1 ? (
                                    <p className="text-sm text-destructive">
                                        Select products from one area only
                                        before printing.
                                    </p>
                                ) : null}
                                {selectedRows.size > 0 &&
                                selectedCustomerIds.size === 1 &&
                                selectedAreas.size === 1 ? (
                                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                        <div className="text-xs text-muted-foreground">
                                            Customer Template
                                        </div>
                                        <div className="mt-1 font-medium">
                                            {assignedTemplateQuery.isFetching
                                                ? "Checking template..."
                                                : (assignedTemplateQuery.data
                                                      ?.name ??
                                                  "No published template assigned")}
                                        </div>
                                        {!assignedTemplateQuery.isFetching &&
                                        !assignedTemplateQuery.data ? (
                                            <p className="mt-1 text-destructive">
                                                Publish a template and assign it
                                                to this customer and area before
                                                printing.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </section>
                        </div>
                    </ScrollArea>
                    <SheetFooter className="border-t">
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={!canQueue || queuePrint.isPending}
                                onClick={() => queuePrint.mutate()}
                            >
                                <SaveIcon className="size-4" />
                                {queuePrint.isPending
                                    ? "Creating..."
                                    : "Create"}
                            </Button>
                        </div>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function PrintPreviewDialog({
    labels,
    open,
    isFinalizing,
    onOpenChange,
    onPrintDialogClosed,
}: {
    labels: PrintPreviewLabel[];
    open: boolean;
    isFinalizing: boolean;
    onOpenChange: (open: boolean) => void;
    onPrintDialogClosed: () => void;
}) {
    const printRef = React.useRef<HTMLDivElement>(null);
    const printPageStyle = React.useMemo(
        () => buildPrintPageStyle(labels),
        [labels],
    );
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Print Labels",
        pageStyle: printPageStyle,
        onBeforePrint: async () => {
            await new Promise<void>((resolve) => {
                window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => resolve());
                });
            });

            await waitForImages(printRef.current);
        },
        onAfterPrint: onPrintDialogClosed,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="print-preview-dialog max-w-[calc(100%-2rem)] sm:max-w-6xl">
                <DialogHeader className="print:hidden">
                    <DialogTitle>Print Preview</DialogTitle>
                    <DialogDescription>
                        Review the rendered customer template before opening the
                        browser print dialog.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="print-preview-scroll h-[72vh] rounded-md border bg-slate-200 p-6 print:h-auto print:border-0 print:bg-white print:p-0">
                    <div
                        ref={printRef}
                        className="print-preview-document flex flex-col items-center gap-8 print:items-start print:gap-0"
                    >
                        {labels.map((label, index) => (
                            <div
                                key={`${label.print_id}-${index}`}
                                className="print-preview-label bg-white shadow-lg ring-1 ring-slate-300 print:break-after-page print:shadow-none print:ring-0"
                            >
                                <TemplatePreview
                                    settings={{
                                        ...TemplatePresenter.normalizeSettings(
                                            label.settings,
                                        ),
                                        showGrid: false,
                                        showRulers: false,
                                        zoom: 1,
                                    }}
                                    elements={label.elements}
                                    repeatInstances={
                                        label.repeat_instances ?? undefined
                                    }
                                    renderMode="print"
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <DialogFooter className="print:hidden">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        disabled={isFinalizing}
                        onClick={handlePrint}
                    >
                        <PrinterIcon className="size-4" />
                        {isFinalizing ? "Saving..." : "Print"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PrintFinalizeDialog({
    open,
    isFinalizing,
    onOpenChange,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    isFinalizing: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Save Printed Serials?</DialogTitle>
                    <DialogDescription>
                        Confirm only after the labels were printed. Cancel keeps
                        these preview serials pending.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isFinalizing}
                        onClick={onCancel}
                    >
                        Not Printed
                    </Button>
                    <Button
                        type="button"
                        disabled={isFinalizing}
                        onClick={onConfirm}
                    >
                        {isFinalizing ? "Saving..." : "Save Serials"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReprintConfirmationDialog({
    open,
    isSaving,
    onOpenChange,
    onNo,
    onYes,
}: {
    open: boolean;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onNo: () => void;
    onYes: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Was the reprint successful?</DialogTitle>
                    <DialogDescription>
                        Select Yes only if the labels printed successfully. The
                        request print count will remain unchanged if you select
                        No.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={onNo}
                    >
                        No
                    </Button>
                    <Button type="button" disabled={isSaving} onClick={onYes}>
                        {isSaving ? "Updating..." : "Yes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function buildPrintPageStyle(labels: PrintPreviewLabel[]) {
    const settings = TemplatePresenter.normalizeSettings(labels[0]?.settings);
    const pageSize = getPrintPageSize(settings);

    return `
        @page {
            size: ${pageSize};
            margin: 0;
        }

        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .print-preview-document {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
        }

        .print-preview-label {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always;
            break-after: page;
        }

        .print-preview-label:last-child {
            page-break-after: auto;
            break-after: auto;
        }
    `;
}

function getPrintPageSize(settings: CanvasSettings) {
    if (settings.paperSize === "Custom") {
        const canvas = TemplatePresenter.getCanvasSize(settings);

        return `${formatMm(canvas.width)}mm ${formatMm(canvas.height)}mm`;
    }

    return `${settings.paperSize} ${settings.orientation}` satisfies `${Exclude<PaperSize, "Custom">} ${CanvasSettings["orientation"]}`;
}

function formatMm(value: number) {
    return Number(value.toFixed(3)).toString();
}

async function waitForImages(container: HTMLElement | null) {
    if (!container) return;

    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
        images.map(
            (image) =>
                new Promise<void>((resolve) => {
                    if (image.complete) {
                        resolve();
                        return;
                    }

                    image.addEventListener("load", () => resolve(), {
                        once: true,
                    });
                    image.addEventListener("error", () => resolve(), {
                        once: true,
                    });
                }),
        ),
    );
}

function PrintsTable({
    prints,
    selectedPrints,
    allPageRowsSelected,
    somePageRowsSelected,
    filters,
    onTogglePrintSelection,
    onTogglePageSelection,
    onCustomerFilterChange,
    onStatusFilterChange,
    onReprint,
    onEdit,
    onDelete,
}: {
    prints: ProductPrint[];
    selectedPrints: Set<number>;
    allPageRowsSelected: boolean;
    somePageRowsSelected: boolean;
    filters: PrintFilters;
    onTogglePrintSelection: (printId: number, selected: boolean) => void;
    onTogglePageSelection: (selected: boolean) => void;
    onCustomerFilterChange: (customerId: string) => void;
    onStatusFilterChange: (statuses: PrintStatus[]) => void;
    onReprint: (print: ProductPrint) => void;
    onEdit: (print: ProductPrint) => void;
    onDelete: (print: ProductPrint) => void;
}) {
    const customerOptions = React.useMemo(
        () =>
            Array.from(
                new Map(
                    prints.flatMap((print) =>
                        print.customer
                            ? [
                                  [
                                      String(print.customer.id),
                                      {
                                          label: print.customer.name,
                                          value: String(print.customer.id),
                                          description: print.customer.code,
                                      },
                                  ] as const,
                              ]
                            : [],
                    ),
                ).values(),
            ),
        [prints],
    );

    return (
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
                            aria-label="Select all print requests"
                            onCheckedChange={(checked) =>
                                onTogglePageSelection(checked === true)
                            }
                        />
                    </TableHead>
                    <TableHead className="min-w-72">Request</TableHead>
                    <TableHead className="min-w-56">
                        <CustomerHeaderFilter
                            options={customerOptions}
                            value={filters.customerId}
                            onValueChange={onCustomerFilterChange}
                        />
                    </TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead className="text-center">Count</TableHead>
                    <TableHead className="min-w-48">
                        <StatusHeaderFilter
                            options={printStatusOptions.filter(({ value }) =>
                                prints.some((print) => print.status === value),
                            )}
                            values={filters.statuses}
                            onValuesChange={onStatusFilterChange}
                        />
                    </TableHead>
                    <TableHead className="w-12" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {prints.map((print) => {
                    const isDispatchable = isDispatchablePrint(print);

                    return (
                        <TableRow
                            key={print.id}
                            data-state={
                                selectedPrints.has(print.id)
                                    ? "selected"
                                    : undefined
                            }
                        >
                            <TableCell>
                                <Checkbox
                                    checked={selectedPrints.has(print.id)}
                                    disabled={!isDispatchable}
                                    aria-label={`Select print request ${print.job_uuid}`}
                                    onCheckedChange={(checked) =>
                                        onTogglePrintSelection(
                                            print.id,
                                            checked === true,
                                        )
                                    }
                                />
                            </TableCell>
                            <TableCell>
                                <PrintRequestProducts
                                    products={print.products ?? []}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">
                                    {print.customer?.name ?? "No customer"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {print.customer?.code ?? "-"}
                                </div>
                            </TableCell>
                            <TableCell>
                                <SerialNumberCell
                                    serialNumbers={print.serial_numbers ?? []}
                                />
                            </TableCell>
                            <TableCell className="text-center font-medium tabular-nums">
                                {print.print_count}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={printStatusLabel(print)} />
                            </TableCell>
                            <TableCell className="text-right">
                                <PrintActions
                                    print={print}
                                    onReprint={() => onReprint(print)}
                                    onEdit={() => onEdit(print)}
                                    onDelete={() => onDelete(print)}
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function RequestProductsTable({
    products,
    selectedRows,
    allSelected,
    someSelected,
    onToggleRowSelection,
    onToggleAll,
}: {
    products: Product[];
    selectedRows: Set<number>;
    allSelected: boolean;
    someSelected: boolean;
    onToggleRowSelection: (productId: number, selected: boolean) => void;
    onToggleAll: (selected: boolean) => void;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                        <Checkbox
                            checked={
                                allSelected
                                    ? true
                                    : someSelected
                                      ? "indeterminate"
                                      : false
                            }
                            aria-label="Select all products"
                            onCheckedChange={(checked) =>
                                onToggleAll(checked === true)
                            }
                        />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Part / PI Number</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow
                        key={product.id}
                        data-state={
                            selectedRows.has(product.id)
                                ? "selected"
                                : undefined
                        }
                    >
                        <TableCell>
                            <Checkbox
                                checked={selectedRows.has(product.id)}
                                aria-label={`Select ${product.name}`}
                                onCheckedChange={(checked) =>
                                    onToggleRowSelection(
                                        product.id,
                                        checked === true,
                                    )
                                }
                            />
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {product.lot_number ?? "No lot"}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div>{product.customer?.name ?? "-"}</div>
                            <div className="text-xs text-muted-foreground">
                                {product.customer?.code ?? ""}
                            </div>
                        </TableCell>
                        <TableCell className="grid gap-y-1">
                            <div className="font-medium">
                                {product.part_number ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                PI: {product.pi_number ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Area: {product.area ?? "-"}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function CustomerHeaderFilter({
    options,
    value,
    onValueChange,
}: {
    options: Array<{ label: string; value: string; description?: string }>;
    value: string;
    onValueChange: (value: string) => void;
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 p-0 text-left font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                >
                    Customer
                    <ChevronsUpDownIcon className="size-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-0">
                <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="All customers"
                                data-checked={value === "all"}
                                onSelect={() => {
                                    onValueChange("all");
                                    setOpen(false);
                                }}
                            >
                                All customers
                            </CommandItem>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    data-checked={value === option.value}
                                    onSelect={() => {
                                        onValueChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">
                                            {option.label}
                                        </span>
                                        {option.description ? (
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {option.description}
                                            </span>
                                        ) : null}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function StatusHeaderFilter({
    options,
    values,
    onValuesChange,
}: {
    options: typeof printStatusOptions;
    values: PrintStatus[];
    onValuesChange: (values: PrintStatus[]) => void;
}) {
    function toggleStatus(status: PrintStatus) {
        onValuesChange(
            values.includes(status)
                ? values.filter((value) => value !== status)
                : [...values, status],
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 p-0 text-left font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                >
                    Status
                    <ChevronsUpDownIcon className="size-3.5" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            <CommandItem
                                value="All statuses"
                                data-checked={values.length === 0}
                                onSelect={() => onValuesChange([])}
                            >
                                All statuses
                            </CommandItem>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    data-checked={values.includes(option.value)}
                                    onSelect={() => toggleStatus(option.value)}
                                >
                                    {option.icon}
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function PrintRequestProducts({
    products,
}: {
    products: NonNullable<ProductPrint["products"]>;
}) {
    const firstProduct = products[0];

    if (!firstProduct) {
        return <span className="text-muted-foreground">No product</span>;
    }

    return (
        <div className="min-w-0">
            <div className="truncate font-medium">{firstProduct.name}</div>
            <div className="text-xs text-muted-foreground">
                Part: {firstProduct.part_number ?? "-"} | PI:{" "}
                {firstProduct.pi_number ?? "-"}
            </div>
            {products.length > 1 ? (
                <div className="text-xs text-muted-foreground">
                    +{products.length - 1} more product
                    {products.length === 2 ? "" : "s"}
                </div>
            ) : null}
        </div>
    );
}

function SerialNumberCell({ serialNumbers }: { serialNumbers: string[] }) {
    const firstSerial = serialNumbers[0];

    if (!firstSerial) {
        return <span className="text-muted-foreground">Not printed</span>;
    }

    return (
        <div>
            <div className="font-medium tabular-nums">{firstSerial}</div>
            {serialNumbers.length > 1 ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                            aria-label={`Show all ${serialNumbers.length} serial numbers`}
                        >
                            +{serialNumbers.length - 1} more
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        align="start"
                        className="max-h-64 max-w-sm items-start overflow-y-auto"
                    >
                        <div className="space-y-1">
                            <div className="font-medium">
                                All serial numbers ({serialNumbers.length})
                            </div>
                            <div className="space-y-0.5 font-mono tabular-nums">
                                {serialNumbers.map((serialNumber, index) => (
                                    <div key={`${serialNumber}-${index}`}>
                                        {serialNumber}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}

function PrintActions({
    print,
    onReprint,
    onEdit,
    onDelete,
}: {
    print: ProductPrint;
    onReprint: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const canUpdatePrinting = useCan("printing.update");
    const canReprint = (print.serial_numbers?.length ?? 0) > 0;
    const canEdit = !canReprint && ["queued", "failed"].includes(print.status);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${print.job_uuid}`}
                >
                    <MoreHorizontalIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                    disabled={!canUpdatePrinting || !canEdit}
                    onClick={onEdit}
                >
                    <PencilIcon className="size-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={!canUpdatePrinting || !canReprint}
                    onClick={onReprint}
                >
                    <RotateCcwIcon className="size-4" />
                    Reprint
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    disabled={!canUpdatePrinting}
                    variant="destructive"
                    onClick={onDelete}
                >
                    <Trash2Icon className="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function DeletePrintDialog({
    print,
    isDeleting,
    onOpenChange,
    onConfirm,
}: {
    print: ProductPrint | null;
    isDeleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={Boolean(print)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete print request?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {print?.job_uuid ?? "This print request"} will be
                        removed from the print queue. Existing serial history
                        for deleted requests will no longer appear in this list.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={isDeleting}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function EditPrintDialog({
    print,
    isSaving,
    onOpenChange,
    onSave,
}: {
    print: ProductPrint | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (productionDate: string, printQuantity: number) => void;
}) {
    const [productionDate, setProductionDate] = React.useState("");
    const [printQuantity, setPrintQuantity] = React.useState(1);

    React.useEffect(() => {
        if (!print) return;

        setProductionDate(
            print.production_date ?? new Date().toISOString().slice(0, 10),
        );
        setPrintQuantity(print.print_quantity ?? 1);
    }, [print]);

    return (
        <Dialog open={Boolean(print)} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit print request</DialogTitle>
                    <DialogDescription>
                        Update the production date and quantity before printing.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <Field label="Production Date">
                        <DatePicker
                            value={productionDate}
                            placeholder="Select production date"
                            onChange={setProductionDate}
                        />
                    </Field>
                    <Field label="Quantity">
                        <InputNumber
                            value={printQuantity}
                            min={1}
                            allowDecimal={false}
                            onValueChange={setPrintQuantity}
                        />
                    </Field>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={
                            !productionDate || printQuantity < 1 || isSaving
                        }
                        onClick={() => onSave(productionDate, printQuantity)}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PrintToolbar({
    draftFilters,
    isFetching,
    onDraftFiltersChange,
    onApplyFilters,
    onResetFilters,
    onRefresh,
}: {
    draftFilters: PrintFilters;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<PrintFilters>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onRefresh: () => void | Promise<unknown>;
}) {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const isFiltered =
        draftFilters.search ||
        draftFilters.customerId !== "all" ||
        draftFilters.statuses.length > 0;

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
                <div className="relative w-full sm:w-80 lg:w-96">
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
                        placeholder="Search product, part number, PI number, request..."
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
            <div className="flex flex-wrap items-center gap-2">
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

function PrintStats({ stats }: { stats: ReturnType<typeof getPrintStats> }) {
    const cards = [
        { key: "total", label: "Requests", icon: PrinterIcon },
        { key: "queued", label: "Queued", icon: ClockIcon },
        { key: "processing", label: "Processing", icon: PrinterIcon },
        { key: "completed", label: "Completed", icon: CheckCircle2Icon },
    ] as const;

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <Card key={card.key} size="sm">
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground">
                                    {card.label}
                                </div>
                                <div className="mt-1 text-2xl font-semibold">
                                    {stats[card.key]}
                                </div>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Icon className="size-5" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function PrintsTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_110px_110px_120px]"
                >
                    {Array.from({ length: 6 }).map((__, column) => (
                        <Skeleton key={column} className="h-10" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function RequestProductsSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[40px_1.4fr_1fr_100px_100px]"
                >
                    {Array.from({ length: 5 }).map((__, column) => (
                        <Skeleton key={column} className="h-10" />
                    ))}
                </div>
            ))}
        </div>
    );
}

function buildPrintIndexParams(filters: PrintFilters) {
    return {
        page: filters.page,
        per_page: filters.perPage,
        search: filters.search || undefined,
        customer_id:
            filters.customerId !== "all" ? filters.customerId : undefined,
        status: filters.statuses.length > 0 ? filters.statuses : undefined,
    };
}

function buildPreviewCacheKey(printIds: number[]) {
    return `serial-v2:${[...printIds]
        .sort((first, second) => first - second)
        .join(",")}`;
}

function getPrintStats(prints: ProductPrint[]) {
    return {
        total: prints.length,
        queued: prints.filter((print) => print.status === "queued").length,
        processing: prints.filter((print) => print.status === "processing")
            .length,
        completed: prints.filter(
            (print) =>
                print.status === "completed" ||
                print.status === "completed_with_errors",
        ).length,
    };
}

function isDispatchablePrint(print: ProductPrint) {
    return print.status === "queued" || print.status === "failed";
}

function printStatusLabel(print: ProductPrint) {
    if (print.status === "completed") return "Printed";
    if (print.status === "completed_with_errors") return "Printed with errors";

    return print.status;
}

function formatDate(value?: string | null) {
    if (!value) return "Never";

    return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function showApiError(
    error: unknown,
    notify: (toast: {
        title: string;
        description?: string;
        variant?: ToastVariant;
    }) => void,
) {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        notify({
            variant: "error",
            title: "Request failed",
            description: message ?? "The request could not be completed",
        });
        return;
    }

    notify({
        variant: "error",
        title: "Request failed",
        description:
            error instanceof Error
                ? error.message
                : "The request could not be completed",
    });
}
