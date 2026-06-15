import * as React from "react";
import {
    CheckCircle2Icon,
    LockIcon,
    Undo2Icon,
    UserRoundIcon,
} from "lucide-react";

type UserStatsProps = {
    stats: {
        active: number;
        locked: number;
        inactive: number;
        deleted: number;
    };
};

export function UserStats({ stats }: UserStatsProps) {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            <UserStat
                label="Active"
                value={stats.active}
                icon={<CheckCircle2Icon className="size-4" />}
            />
            <UserStat
                label="Locked"
                value={stats.locked}
                icon={<LockIcon className="size-4" />}
            />
            <UserStat
                label="Inactive"
                value={stats.inactive}
                icon={<UserRoundIcon className="size-4" />}
            />
        </div>
    );
}

function UserStat({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-background p-4">
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground">
                {icon}
            </div>
        </div>
    );
}
