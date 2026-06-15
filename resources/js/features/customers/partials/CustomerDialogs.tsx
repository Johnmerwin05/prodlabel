import {
    MoreHorizontalIcon,
    Trash2Icon,
    Undo2Icon,
} from "lucide-react";

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    type ConfirmCustomerAction,
    type Customer,
    CustomerPresenter,
} from "./customer.model";

export function CustomerActions({
    customer,
    onEdit,
    onConfirm,
}: {
    customer: Customer;
    onEdit: () => void;
    onConfirm: (action: ConfirmCustomerAction) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Open actions for ${customer.name}`}
                >
                    <MoreHorizontalIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                {!customer.deleted_at ? (
                    <>
                        <DropdownMenuItem onClick={onEdit}>
                            Edit customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                                onConfirm(
                                    CustomerPresenter.buildConfirm(
                                        "delete",
                                        customer,
                                    ),
                                )
                            }
                        >
                            <Trash2Icon className="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem
                        onClick={() =>
                            onConfirm(
                                CustomerPresenter.buildConfirm(
                                    "restore",
                                    customer,
                                ),
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

export function ConfirmCustomerActionDialog({
    action,
    isSaving,
    onOpenChange,
    onConfirm,
}: {
    action: ConfirmCustomerAction | null;
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
                    <AlertDialogCancel disabled={isSaving}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        variant={
                            action?.destructive ? "destructive" : "default"
                        }
                        disabled={isSaving}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        {isSaving ? "Working..." : action?.confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
