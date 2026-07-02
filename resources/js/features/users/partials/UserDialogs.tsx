import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    KeyRoundIcon,
    LockIcon,
    MoreHorizontalIcon,
    Trash2Icon,
    Undo2Icon,
    UnlockIcon,
} from "lucide-react";
import { useForm } from "react-hook-form";

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
import { useCan } from "@/features/auth/permissions";
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    type ConfirmAction,
    type PasswordFormValues,
    type User,
    passwordSchema,
    UserPresenter,
} from "./user.model";

export function UserActions({
    user,
    onEdit,
    onResetPassword,
    onConfirm,
}: {
    user: User;
    onEdit: () => void;
    onResetPassword: () => void;
    onConfirm: (action: ConfirmAction) => void;
}) {
    const canUpdate = useCan("user.update");
    const canResetPassword = useCan("user.reset-password");
    const canLock = useCan("user.lock");
    const canDelete = useCan("user.delete");
    const canRestore = useCan("user.restore");
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${user.name}`}
                >
                    <MoreHorizontalIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {!user.deleted_at ? (
                    <>
                        <DropdownMenuItem disabled={!canUpdate} onClick={onEdit}>
                            Edit user
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={!canResetPassword} onClick={onResetPassword}>
                            Reset password
                        </DropdownMenuItem>
                        {user.status === "locked" ? (
                            <DropdownMenuItem
                                disabled={!canLock}
                                onClick={() =>
                                    onConfirm(
                                        UserPresenter.buildConfirm(
                                            "unlock",
                                            user,
                                        ),
                                    )
                                }
                            >
                                <UnlockIcon className="size-4" />
                                Unlock
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                disabled={!canLock}
                                onClick={() =>
                                    onConfirm(
                                        UserPresenter.buildConfirm(
                                            "lock",
                                            user,
                                        ),
                                    )
                                }
                            >
                                <LockIcon className="size-4" />
                                Lock
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={!canDelete}
                            variant="destructive"
                            onClick={() =>
                                onConfirm(
                                    UserPresenter.buildConfirm("delete", user),
                                )
                            }
                        >
                            <Trash2Icon className="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem
                        disabled={!canRestore}
                        onClick={() =>
                            onConfirm(
                                UserPresenter.buildConfirm("restore", user),
                            )
                        }
                    >
                        <Undo2Icon className="size-4" />
                        Restore
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function ConfirmUserActionDialog({
    action,
    isSaving,
    onOpenChange,
    onConfirm,
}: {
    action: ConfirmAction | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{action?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {action?.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant={
                            action?.destructive ? "destructive" : "default"
                        }
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                        disabled={isSaving}
                    >
                        {isSaving ? "Working..." : action?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function PasswordResetSheet({
    user,
    isSaving,
    onOpenChange,
    onSubmit,
}: {
    user: User | null;
    isSaving: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: PasswordFormValues) => void;
}) {
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "" },
    });

    React.useEffect(() => {
        if (user) form.reset({ password: "" });
    }, [form, user]);

    return (
        <Sheet open={Boolean(user)} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Reset Password</SheetTitle>
                    <SheetDescription>
                        Set a new password for {user?.name}. The user can sign
                        in immediately after this change.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="flex flex-1 flex-col"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="space-y-4 px-4">
                        <Field
                            label="New Password"
                            error={form.formState.errors.password?.message}
                        >
                            <Input
                                {...form.register("password")}
                                type="password"
                                placeholder="Minimum 8 characters"
                            />
                        </Field>
                    </div>
                    <SheetFooter className="border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            <KeyRoundIcon className="size-4" />
                            {isSaving ? "Resetting..." : "Reset Password"}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
    );
}
