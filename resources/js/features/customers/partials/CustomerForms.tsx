import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { type UseFormReturn, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
    type Customer,
    type CustomerFormValues,
    CustomerPresenter,
    customerSchema,
} from "./customer.model";

export function CustomerFormSheet({
    open,
    customer,
    isSaving,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    customer: Customer | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CustomerFormValues) => void;
}) {
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: CustomerPresenter.getDefaults(customer),
    });

    React.useEffect(() => {
        form.reset(CustomerPresenter.getDefaults(customer));
    }, [form, customer, open]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(42vw,72rem)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>
                        {customer ? "Edit Customer" : "Create Customer"}
                    </SheetTitle>
                    <SheetDescription>
                        {customer
                            ? "Update customer master data and optional contact details."
                            : "Add required customer identity details, then fill optional contact information as needed."}
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <ScrollArea className="min-h-0 flex-1 px-4">
                        <CustomerFormFields form={form} />
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
                                {isSaving
                                    ? customer
                                        ? "Saving..."
                                        : "Creating..."
                                    : customer
                                      ? "Save Changes"
                                      : "Create Customer"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function CustomerFormFields({
    form,
}: {
    form: UseFormReturn<CustomerFormValues>;
}) {
    return (
        <div className="space-y-6 px-2 pb-4">
            <section className="space-y-4">
                <div>
                    <h3 className="font-medium">Customer Identity</h3>
                    <p className="text-sm text-muted-foreground">
                        Customer name and customer code are required for product
                        labeling and print workflows.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Customer Name"
                        required
                        error={form.formState.errors.name?.message}
                    >
                        <Input
                            {...form.register("name")}
                            aria-invalid={Boolean(form.formState.errors.name)}
                            placeholder="Acme Foods Inc."
                        />
                    </Field>
                    <Field
                        label="Customer Code"
                        required
                        error={form.formState.errors.customer_code?.message}
                    >
                        <Input
                            {...form.register("customer_code")}
                            aria-invalid={Boolean(
                                form.formState.errors.customer_code,
                            )}
                            placeholder="CUST-001"
                        />
                    </Field>
                    <Field
                        label="Status"
                        required
                        error={form.formState.errors.status?.message}
                    >
                        <Select
                            value={form.watch("status")}
                            onValueChange={(status) =>
                                form.setValue(
                                    "status",
                                    status as CustomerFormValues["status"],
                                    {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    },
                                )
                            }
                        >
                            <SelectTrigger
                                aria-invalid={Boolean(
                                    form.formState.errors.status,
                                )}
                            >
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </section>

            <Separator />

            <section className="space-y-4">
                <div>
                    <h3 className="font-medium">Optional Details</h3>
                    <p className="text-sm text-muted-foreground">
                        Contact number, address, email, and remarks can be added
                        now or updated later.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Contact Person"
                        error={form.formState.errors.contact_person?.message}
                    >
                        <Input
                            {...form.register("contact_person")}
                            aria-invalid={Boolean(
                                form.formState.errors.contact_person,
                            )}
                            placeholder="Juan Dela Cruz"
                        />
                    </Field>
                    <Field
                        label="Contact Number"
                        error={form.formState.errors.contact_number?.message}
                    >
                        <Input
                            {...form.register("contact_number")}
                            aria-invalid={Boolean(
                                form.formState.errors.contact_number,
                            )}
                            placeholder="+63 917 000 0000"
                        />
                    </Field>
                    <Field
                        label="Email"
                        error={form.formState.errors.email?.message}
                    >
                        <Input
                            {...form.register("email")}
                            aria-invalid={Boolean(form.formState.errors.email)}
                            type="email"
                            placeholder="contact@customer.com"
                        />
                    </Field>
                    <Field
                        label="Address"
                        error={form.formState.errors.address?.message}
                    >
                        <Textarea
                            {...form.register("address")}
                            aria-invalid={Boolean(
                                form.formState.errors.address,
                            )}
                            placeholder="Street, city, province"
                        />
                    </Field>
                    <Field
                        label="Remarks"
                        error={form.formState.errors.remarks?.message}
                        className="md:col-span-2"
                    >
                        <Textarea
                            {...form.register("remarks")}
                            aria-invalid={Boolean(
                                form.formState.errors.remarks,
                            )}
                            placeholder="Optional internal notes"
                        />
                    </Field>
                </div>
            </section>
        </div>
    );
}

function Field({
    label,
    required,
    error,
    className,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Label className={cn(error && "text-destructive")}>
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            {children}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
    );
}
