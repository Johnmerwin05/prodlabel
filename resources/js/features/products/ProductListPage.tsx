import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    DownloadIcon,
    MoreHorizontalIcon,
    PlusIcon,
    RefreshCwIcon,
    SearchIcon,
    Trash2Icon,
    XIcon,
} from "lucide-react";

import { DataTablePagination, DataTableSurface } from "@/components/data-table";
import { DataTableHeaderFilter } from "@/components/data-table-header-filter";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
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
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useCan } from "@/features/auth/permissions";
import { useToastStore, type ToastVariant } from "@/stores/toastStore";

import { ProductFormDialog, type ProductFormCustomer } from "./ProductFormDialog";
import {
    type PaginatedProducts,
    type Product,
    type ProductFilters,
    type ProductFormValues,
    type ProductResourceResponse,
    defaultProductFilters,
    productMetricCards,
    ProductPresenter,
} from "./partials/product.model";

export function ProductListPage() {
    const canCreate = useCan("product.create");
    const canUpdate = useCan("product.update");
    const canDelete = useCan("product.delete");
    const queryClient = useQueryClient();
    const notify = useToastStore((state) => state.notify);
    const [filters, setFilters] = React.useState<ProductFilters>(
        defaultProductFilters,
    );
    const [draftFilters, setDraftFilters] = React.useState<ProductFilters>(
        defaultProductFilters,
    );
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(
        null,
    );
    const [deletingProduct, setDeletingProduct] =
        React.useState<Product | null>(null);

    const productsQuery = useQuery({
        queryKey: ["products", filters],
        queryFn: async () => {
            const response = await api.get<PaginatedProducts>("/products", {
                params: ProductPresenter.buildIndexParams(filters),
            });
            return response.data;
        },
    });

    const customersQuery = useQuery({
        queryKey: ["product-customers"],
        queryFn: async () => {
            const response = await api.get<unknown>("/customers/options");
            return normalizeProductFormCustomers(response.data);
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnMount: false,
    });

    const products = productsQuery.data?.data ?? [];
    const customers = customersQuery.data ?? [];
    const editCustomers = React.useMemo(() => {
        const currentCustomer = editingProduct?.customer;
        if (
            !currentCustomer ||
            customers.some((customer) => customer.id === currentCustomer.id)
        ) {
            return customers;
        }

        return [currentCustomer, ...customers];
    }, [customers, editingProduct]);
    const meta = productsQuery.data?.meta;
    const stats = React.useMemo(
        () => ProductPresenter.getStats(products),
        [products],
    );

    const createProduct = useMutation({
        mutationFn: async (values: ProductFormValues) => {
            const response = await api.post<ProductResourceResponse>(
                "/products",
                ProductPresenter.toPayload(values),
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Product created" });
            setIsCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({
                queryKey: ["request-print-products"],
            });
        },
        onError: (error) => showApiError(error, notify),
    });

    const updateProduct = useMutation({
        mutationFn: async ({
            product,
            values,
        }: {
            product: Product;
            values: ProductFormValues;
        }) => {
            const response = await api.put<ProductResourceResponse>(
                `/products/${product.id}`,
                ProductPresenter.toPayload(values),
            );
            return response.data.data;
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Product updated" });
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({
                queryKey: ["request-print-products"],
            });
            queryClient.invalidateQueries({
                queryKey: ["request-print-customer-template"],
            });
        },
        onError: (error) => showApiError(error, notify),
    });

    const deleteProduct = useMutation({
        mutationFn: async (product: Product) => {
            await api.delete(`/products/${product.id}`);
        },
        onSuccess: () => {
            notify({ variant: "success", title: "Product deleted" });
            setDeletingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({
                queryKey: ["request-print-products"],
            });
        },
        onError: (error) => showApiError(error, notify),
    });

    function applyFilters() {
        setFilters({ ...draftFilters, page: 1 });
    }

    function resetFilters() {
        setDraftFilters(defaultProductFilters);
        setFilters(defaultProductFilters);
    }

    function applyColumnFilters(next: Partial<ProductFilters>) {
        const updated = { ...draftFilters, ...next, page: 1 };
        setDraftFilters(updated);
        setFilters(updated);
    }

    async function refreshProducts() {
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        await productsQuery.refetch();
    }

    return (
        <div className="space-y-5">
            <PageHeader
                title="Product Master List"
                description="Maintain product names, customer ownership, part numbers, units of measure, and master quantities."
                actions={
                    <>
                        <Button variant="outline">
                            <DownloadIcon className="size-4" />
                            Export
                        </Button>
                        <Button
                            disabled={!canCreate}
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <PlusIcon className="size-4" />
                            Create Product
                        </Button>
                    </>
                }
            />

            <ProductStats stats={stats} />

            <div className="space-y-0">
                <div className="mb-4">
                    <ProductToolbar
                        draftFilters={draftFilters}
                        isFetching={productsQuery.isFetching}
                        onDraftFiltersChange={setDraftFilters}
                        onApplyFilters={applyFilters}
                        onResetFilters={resetFilters}
                        onRefresh={refreshProducts}
                    />
                </div>

                <DataTableSurface>
                    {productsQuery.isLoading ? (
                        <ProductTableSkeleton />
                    ) : productsQuery.isError ? (
                        <EmptyState
                            title="Unable to load products"
                            description="Please refresh the page or check your connection."
                            action={
                                <Button onClick={refreshProducts}>Retry</Button>
                            }
                        />
                    ) : products.length === 0 ? (
                        <EmptyState
                            title="No products found"
                            description="Create a product or adjust your filters."
                            action={
                                <Button
                                    disabled={!canCreate}
                                    onClick={() => setIsCreateOpen(true)}
                                >
                                    Create Product
                                </Button>
                            }
                        />
                    ) : (
                        <ProductsTable
                            products={products}
                            customerId={draftFilters.customerId}
                            onCustomerChange={(customerId) =>
                                applyColumnFilters({ customerId })
                            }
                            onEdit={setEditingProduct}
                            onDelete={setDeletingProduct}
                            canEdit={canUpdate}
                            canDelete={canDelete}
                        />
                    )}
                </DataTableSurface>

                <DataTablePagination
                    meta={meta}
                    totalRows={products.length}
                    selectedCount={0}
                    pageSizeOptions={[10, 25, 50, 100]}
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

            <ProductFormDialog
                open={isCreateOpen}
                customers={customers}
                isSaving={createProduct.isPending}
                onOpenChange={setIsCreateOpen}
                onSubmit={(values) => createProduct.mutate(values)}
            />
            <ProductFormDialog
                open={Boolean(editingProduct)}
                customers={editCustomers}
                isSaving={updateProduct.isPending}
                title="Edit Product"
                description="Update product master details, customer ownership, and unit information."
                submitLabel="Save Changes"
                initialValues={
                    editingProduct
                        ? ProductPresenter.fromProduct(editingProduct)
                        : null
                }
                onOpenChange={(open) => {
                    if (!open) setEditingProduct(null);
                }}
                onSubmit={(values) => {
                    if (editingProduct) {
                        updateProduct.mutate({
                            product: editingProduct,
                            values,
                        });
                    }
                }}
            />
            <DeleteProductDialog
                product={deletingProduct}
                isDeleting={deleteProduct.isPending}
                onOpenChange={(open) => {
                    if (!open) setDeletingProduct(null);
                }}
                onConfirm={() => {
                    if (deletingProduct) deleteProduct.mutate(deletingProduct);
                }}
            />
        </div>
    );
}

function ProductStats({
    stats,
}: {
    stats: ReturnType<typeof ProductPresenter.getStats>;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productMetricCards.map((card) => {
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

function ProductsTable({
    products,
    customerId,
    onCustomerChange,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: {
    products: Product[];
    customerId: string;
    onCustomerChange: (customerId: string) => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-72">Product</TableHead>
                    <TableHead>
                        <DataTableHeaderFilter
                            label="Customer"
                            allLabel="All customers"
                            searchable
                            value={customerId}
                            options={Array.from(
                                new Map(
                                    products.flatMap((product) =>
                                        product.customer
                                            ? [
                                                  [
                                                      String(
                                                          product.customer.id,
                                                      ),
                                                      {
                                                          label: product
                                                              .customer.name,
                                                          value: String(
                                                              product.customer
                                                                  .id,
                                                          ),
                                                          description:
                                                              product.customer
                                                                  .code,
                                                      },
                                                  ] as const,
                                              ]
                                            : [],
                                    ),
                                ).values(),
                            )}
                            onValueChange={onCustomerChange}
                        />
                    </TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Part / PI Number</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Packing Quantity</TableHead>
                    <TableHead className="w-12" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {products.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell>
                            <div className="min-w-0">
                                <div className="font-medium">
                                    {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {product.description ?? "No description"}
                                </div>
                                {product.lot_number || product.batch_number ? (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Lot {product.lot_number ?? "-"} · Batch{" "}
                                        {product.batch_number ?? "-"}
                                    </div>
                                ) : null}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">
                                {product.customer?.name ?? "No customer"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {product.customer?.code ?? "-"}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                            {product.area ?? "-"}
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">
                                {product.part_number ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                PI: {product.pi_number ?? "-"}
                            </div>
                        </TableCell>
                        <TableCell>{product.unit_of_measure ?? "-"}</TableCell>
                        <TableCell className="tabular-nums">
                            {product.packing_quantity}
                        </TableCell>
                        <TableCell className="text-right">
                            <ProductActions
                                product={product}
                                onEdit={() => onEdit(product)}
                                onDelete={() => onDelete(product)}
                                canEdit={canEdit}
                                canDelete={canDelete}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function ProductToolbar({
    draftFilters,
    isFetching,
    onDraftFiltersChange,
    onApplyFilters,
    onResetFilters,
    onRefresh,
}: {
    draftFilters: ProductFilters;
    isFetching: boolean;
    onDraftFiltersChange: React.Dispatch<React.SetStateAction<ProductFilters>>;
    onApplyFilters: () => void;
    onResetFilters: () => void;
    onRefresh: () => void | Promise<unknown>;
}) {
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const isFiltered = draftFilters.search || draftFilters.customerId !== "all";

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
                        placeholder="Filter products..."
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

function ProductActions({
    product,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${product.name}`}
                >
                    <MoreHorizontalIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem disabled={!canEdit} onClick={onEdit}>
                    Edit product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    disabled={!canDelete}
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

function DeleteProductDialog({
    product,
    isDeleting,
    onOpenChange,
    onConfirm,
}: {
    product: Product | null;
    isDeleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={Boolean(product)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete product?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {product?.name ?? "This product"} will be removed from
                        the active product list. This keeps the record in the
                        database for audit history.
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

function ProductTableSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[1.5fr_1fr_100px_100px_100px_32px]"
                >
                    {Array.from({ length: 6 }).map((__, column) => (
                        <Skeleton key={column} className="h-10" />
                    ))}
                </div>
            ))}
        </div>
    );
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

function normalizeProductFormCustomers(payload: unknown): ProductFormCustomer[] {
    let current = payload;

    while (current && typeof current === "object") {
        if (
            !Array.isArray(current) &&
            "data" in current
        ) {
            current = (current as { data: unknown }).data;
            continue;
        }

        const rows = Array.isArray(current)
            ? current
            : Object.values(current);

        return rows.flatMap((customer) => {
            if (typeof customer !== "object" || customer === null) return [];

            const row = customer as Record<string, unknown>;
            const id = Number(row.id);
            if (
                !Number.isInteger(id) ||
                typeof row.name !== "string" ||
                typeof row.code !== "string"
            ) {
                return [];
            }

            return [{ id, name: row.name, code: row.code }];
        });
    }

    return [];
}
