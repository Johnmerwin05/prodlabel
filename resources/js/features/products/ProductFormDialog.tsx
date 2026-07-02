import * as React from "react";
import { SaveIcon } from "lucide-react";

import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { InputNumber } from "@/components/ui/input-number";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/features/customers/partials/customer.model";
import { cn } from "@/lib/utils";

import {
    type ProductFormValues,
    ProductPresenter,
    areaOptions,
    productSchema,
    unitOfMeasureOptions,
} from "./partials/product.model";

export type ProductFormCustomer = Pick<Customer, "id" | "name" | "code">;

type ProductFormDialogProps = {
    open: boolean;
    customers: ProductFormCustomer[];
    isSaving: boolean;
    title?: string;
    description?: string;
    submitLabel?: string;
    initialValues?: ProductFormValues | null;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: ProductFormValues) => void;
};

export function ProductFormDialog({
    open,
    customers,
    isSaving,
    title = "Create Product",
    description = "Add a product master record, assign it to a customer, and define unit details.",
    submitLabel = "Create Product",
    initialValues,
    onOpenChange,
    onSubmit,
}: ProductFormDialogProps) {
    const [values, setValues] = React.useState<ProductFormValues>(
        ProductPresenter.getDefaults,
    );
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const customerOptions = customers.map((customer) => ({
        label: customer.name,
        value: String(customer.id),
        description: customer.code,
    }));

    React.useEffect(() => {
        if (open) {
            setValues(initialValues ?? ProductPresenter.getDefaults());
            setErrors({});
        }
    }, [initialValues, open]);

    function update<K extends keyof ProductFormValues>(
        key: K,
        value: ProductFormValues[K],
    ) {
        setValues((current) => ({ ...current, [key]: value }));
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const result = productSchema.safeParse(values);

        if (!result.success) {
            setErrors(
                Object.fromEntries(
                    result.error.issues.map((issue) => [
                        issue.path.join("."),
                        issue.message,
                    ]),
                ),
            );
            return;
        }

        setErrors({});
        onSubmit(result.data);
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(42vw,72rem)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={submit}
                >
                    <ScrollArea className="min-h-0 flex-1 px-4">
                        <div className="space-y-6 px-2 pb-4">
                            <section className="space-y-4">
                                <div>
                                    <h3 className="font-medium">
                                        Product Details
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Core product identity used for catalog
                                        lookup and labels.
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        label="Part Number"
                                        required
                                        error={errors.part_number}
                                    >
                                        <Input
                                            value={values.part_number}
                                            onChange={(event) =>
                                                update(
                                                    "part_number",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="PN-10001"
                                        />
                                    </Field>
                                    <Field
                                        label="PI Number"
                                        required
                                        error={errors.pi_number}
                                    >
                                        <Input
                                            value={values.pi_number}
                                            onChange={(event) =>
                                                update(
                                                    "pi_number",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="PI-10001"
                                        />
                                    </Field>
                                    <Field
                                        label="Product Name"
                                        required
                                        error={errors.name}
                                    >
                                        <Input
                                            value={values.name}
                                            onChange={(event) =>
                                                update(
                                                    "name",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Product name"
                                        />
                                    </Field>
                                    <Field
                                        label="Customer"
                                        required
                                        error={errors.customer_id}
                                    >
                                        <SearchableSelect
                                            value={
                                                values.customer_id
                                                    ? String(values.customer_id)
                                                    : undefined
                                            }
                                            options={customerOptions}
                                            placeholder="Select customer"
                                            searchPlaceholder="Search customer..."
                                            emptyMessage="No customers found."
                                            error={Boolean(errors.customer_id)}
                                            batchSize={50}
                                            onValueChange={(customerId) =>
                                                update(
                                                    "customer_id",
                                                    Number(customerId),
                                                )
                                            }
                                            onClear={() =>
                                                update(
                                                    "customer_id",
                                                    0,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Area"
                                        required
                                        error={errors.area}
                                    >
                                        <SearchableSelect
                                            value={values.area}
                                            options={areaOptions.map((area) => ({
                                                label: area,
                                                value: area,
                                            }))}
                                            placeholder="Select area"
                                            searchPlaceholder="Search area..."
                                            error={Boolean(errors.area)}
                                            onValueChange={(area) =>
                                                update(
                                                    "area",
                                                    area as ProductFormValues["area"],
                                                )
                                            }
                                        />
                                    </Field>
                                </div>
                            </section>
                            <Separator />
                            <section className="space-y-4">
                                <div>
                                    <h3 className="font-medium">Unit</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Define the unit used on labels and box
                                        packaging details when applicable.
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        label="Unit of Measure"
                                        required
                                        error={errors.unit_of_measure}
                                    >
                                        <SearchableSelect
                                            value={values.unit_of_measure}
                                            options={unitOfMeasureOptions}
                                            placeholder="Select UOM"
                                            searchPlaceholder="Search UOM..."
                                            error={Boolean(
                                                errors.unit_of_measure,
                                            )}
                                            onValueChange={(unitOfMeasure) =>
                                                update(
                                                    "unit_of_measure",
                                                    unitOfMeasure,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Packing Quantity"
                                        required
                                        error={errors.packing_quantity}
                                    >
                                        <InputNumber
                                            min={1}
                                            allowDecimal={false}
                                            value={values.packing_quantity}
                                            onValueChange={(value) =>
                                                update(
                                                    "packing_quantity",
                                                    value,
                                                )
                                            }
                                            placeholder="250"
                                        />
                                    </Field>
                                </div>
                            </section>
                            <Separator />
                            <section className="space-y-4">
                                <div>
                                    <h3 className="font-medium">
                                        Batch And Dates
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Optional production traceability fields.
                                    </p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field label="Batch Number">
                                        <Input
                                            value={values.batch_number ?? ""}
                                            onChange={(event) =>
                                                update(
                                                    "batch_number",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Lot Number">
                                        <Input
                                            value={values.lot_number ?? ""}
                                            onChange={(event) =>
                                                update(
                                                    "lot_number",
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field label="Manufacturing Date">
                                        <DatePicker
                                            value={
                                                values.manufacturing_date ?? ""
                                            }
                                            placeholder="Select manufacturing date"
                                            onChange={(date) =>
                                                update(
                                                    "manufacturing_date",
                                                    date,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label="Expiration Date"
                                        error={errors.expiration_date}
                                    >
                                        <DatePicker
                                            value={values.expiration_date ?? ""}
                                            placeholder="Select expiration date"
                                            onChange={(date) =>
                                                update(
                                                    "expiration_date",
                                                    date,
                                                )
                                            }
                                        />
                                    </Field>
                                </div>
                                <Field label="Description">
                                    <Textarea
                                        value={values.description ?? ""}
                                        onChange={(event) =>
                                            update(
                                                "description",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
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

                            <Button type="submit" disabled={isSaving}>
                                <SaveIcon className="size-4" />
                                {isSaving ? "Saving..." : submitLabel}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label className={cn(error && "text-destructive")}>
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            {children}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
    );
}
