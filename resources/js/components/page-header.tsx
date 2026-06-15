import type * as React from "react";

import { Button } from "@/components/ui/button";

type PageHeaderProps = {
    title: string;
    description: string;
    actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-foreground">
                    {title}
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    {description}
                </p>
            </div>

            {actions ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

export function RefreshButton({ onClick }: { onClick?: () => void }) {
    return (
        <Button type="button" variant="outline" onClick={onClick}>
            Refresh
        </Button>
    );
}
