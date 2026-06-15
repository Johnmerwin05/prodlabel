import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheckIcon } from "lucide-react";
import { type UseFormReturn, useForm } from "react-hook-form";

import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

import {
    type Role,
    type User,
    type UserFormValues,
    UserPresenter,
    statusOptions,
} from "./user.model";

export function UserFormSheet({
    open,
    user,
    roles,
    isSaving,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    user: User | null;
    roles: Role[];
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: UserFormValues) => void;
}) {
    const form = useForm<UserFormValues>({
        resolver: zodResolver(UserPresenter.buildSchema(user)),
        defaultValues: UserPresenter.getDefaults(user),
    });

    React.useEffect(() => {
        form.reset(UserPresenter.getDefaults(user));
    }, [form, user, open]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(42vw,72rem)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>
                        {user ? "Edit User" : "Create User"}
                    </SheetTitle>
                    <SheetDescription>
                        {user
                            ? "Update access details, roles, and account state."
                            : "Add a team member, assign their access level, and set their first sign-in password."}
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="flex min-h-0 flex-1 flex-col"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <ScrollArea className="min-h-0 flex-1 px-4">
                        <UserFormFields form={form} user={user} roles={roles} />
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
                                <ShieldCheckIcon className="size-4" />
                                {isSaving
                                    ? user
                                        ? "Saving..."
                                        : "Creating..."
                                    : user
                                      ? "Save Changes"
                                      : "Create User"}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function UserFormFields({
    form,
    user,
    roles,
}: {
    form: UseFormReturn<UserFormValues>;
    user: User | null;
    roles: Role[];
}) {
    const selectedRoleId = form.watch("role_ids")[0];
    const roleSelectOptions = roles.map((role) => ({
        label: role.name,
        value: String(role.id),
        description: role.slug,
    }));
    const statusSelectOptions = statusOptions.map((option) => ({
        ...option,
        description:
            option.value === "active"
                ? "Can sign in"
                : option.value === "inactive"
                  ? "Access paused"
                  : "Sign-in blocked",
    }));

    return (
        <div className="space-y-6 pb-4 px-2">
            <section className="space-y-4">
                <div>
                    <h3 className="font-medium">Profile</h3>
                    <p className="text-sm text-muted-foreground">
                        Basic identity used across audit logs and production
                        actions.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Name"
                        required
                        error={form.formState.errors.name?.message}
                    >
                        <Input
                            {...form.register("name")}
                            aria-invalid={Boolean(form.formState.errors.name)}
                            placeholder="Maria Santos"
                        />
                    </Field>
                    <Field
                        label="Email"
                        required
                        error={form.formState.errors.email?.message}
                    >
                        <Input
                            {...form.register("email")}
                            aria-invalid={Boolean(form.formState.errors.email)}
                            type="email"
                            placeholder="user@company.com"
                        />
                    </Field>
                    <Field
                        label="Username"
                        required
                        error={form.formState.errors.username?.message}
                    >
                        <Input
                            {...form.register("username")}
                            aria-invalid={Boolean(
                                form.formState.errors.username,
                            )}
                            placeholder="msantos"
                        />
                    </Field>
                    <Field
                        label="Employee Code"
                        error={form.formState.errors.employee_code?.message}
                    >
                        <Input
                            {...form.register("employee_code")}
                            aria-invalid={Boolean(
                                form.formState.errors.employee_code,
                            )}
                            placeholder="EMP-001"
                        />
                    </Field>
                </div>
            </section>
            <Separator />
            <section className="space-y-4">
                <div>
                    <h3 className="font-medium">Access</h3>
                    <p className="text-sm text-muted-foreground">
                        Set the account status and assign one or more RBAC
                        roles.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Status"
                        required
                        error={form.formState.errors.status?.message}
                    >
                        <SearchableSelect<UserFormValues["status"]>
                            value={form.watch("status")}
                            error={Boolean(form.formState.errors.status)}
                            options={statusSelectOptions}
                            placeholder="Select status"
                            searchPlaceholder="Search status..."
                            onValueChange={(status) =>
                                form.setValue("status", status, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        />
                    </Field>
                    <Field
                        label="Role"
                        required
                        error={form.formState.errors.role_ids?.message}
                    >
                        <SearchableSelect
                            value={
                                selectedRoleId
                                    ? String(selectedRoleId)
                                    : undefined
                            }
                            error={Boolean(form.formState.errors.role_ids)}
                            options={roleSelectOptions}
                            placeholder="Select role"
                            searchPlaceholder="Search role..."
                            onValueChange={(roleId) =>
                                form.setValue("role_ids", [Number(roleId)], {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        />
                    </Field>
                </div>
                <Field
                    label={user ? "New Password" : "Password"}
                    required={!user}
                    error={form.formState.errors.password?.message}
                >
                    <Input
                        {...form.register("password")}
                        aria-invalid={Boolean(form.formState.errors.password)}
                        type="password"
                        placeholder={
                            user
                                ? "Leave blank to keep current"
                                : "Minimum 8 characters"
                        }
                    />
                </Field>
            </section>
        </div>
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
