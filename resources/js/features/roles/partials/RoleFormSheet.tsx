import * as React from "react";
import { SaveIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import {
    type Role,
    type RoleFormValues,
    roleDefaults,
    slugify,
} from "./role.model";

export function RoleFormSheet({
    open,
    role,
    isSaving,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    role: Role | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: RoleFormValues) => void;
}) {
    const [values, setValues] = React.useState(() => roleDefaults(role));
    const [slugEdited, setSlugEdited] = React.useState(false);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        setValues(roleDefaults(role));
        setSlugEdited(Boolean(role));
        setError("");
    }, [open, role]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        if (!values.name.trim() || !values.slug.trim()) {
            setError("Role name and slug are required.");
            return;
        }
        onSubmit({
            name: values.name.trim(),
            slug: slugify(values.slug),
            description: values.description.trim(),
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="data-[side=right]:w-[min(42rem,92vw)] data-[side=right]:sm:max-w-none">
                <SheetHeader>
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="size-5 text-primary" />
                        <SheetTitle>{role ? "Edit Role" : "Create Role"}</SheetTitle>
                    </div>
                    <SheetDescription>
                        Roles identify a user’s responsibility. Module access is
                        configured individually from User Management.
                    </SheetDescription>
                </SheetHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
                    <div className="flex-1 space-y-5 px-6 py-2">
                        <Field label="Role Name" required>
                            <Input
                                value={values.name}
                                placeholder="IT"
                                disabled={role?.is_system}
                                onChange={(event) => {
                                    const name = event.target.value;
                                    setValues((current) => ({
                                        ...current,
                                        name,
                                        slug: slugEdited
                                            ? current.slug
                                            : slugify(name),
                                    }));
                                }}
                            />
                        </Field>
                        <Field label="Slug" required>
                            <Input
                                value={values.slug}
                                placeholder="it"
                                disabled={role?.is_system}
                                onChange={(event) => {
                                    setSlugEdited(true);
                                    setValues((current) => ({
                                        ...current,
                                        slug: slugify(event.target.value),
                                    }));
                                }}
                            />
                        </Field>
                        <Field label="Description">
                            <Textarea
                                value={values.description}
                                rows={4}
                                disabled={role?.is_system}
                                placeholder="Describe who should receive this role."
                                onChange={(event) =>
                                    setValues((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : null}
                    </div>
                    <SheetFooter className="border-t">
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            {!role?.is_system ? (
                                <Button type="submit" disabled={isSaving}>
                                    <SaveIcon className="size-4" />
                                    {isSaving
                                        ? role
                                            ? "Saving..."
                                            : "Creating..."
                                        : role
                                          ? "Save Changes"
                                          : "Create Role"}
                                </Button>
                            ) : null}
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
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {required ? <span className="text-destructive"> *</span> : null}
            </Label>
            {children}
        </div>
    );
}
