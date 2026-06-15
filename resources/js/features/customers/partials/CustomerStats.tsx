import {
    ArchiveIcon,
    CheckCircle2Icon,
    PackageIcon,
    UserRoundIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type CustomerStatsProps = {
    stats: {
        active: number;
        inactive: number;
        deleted: number;
        products: number;
    };
};

const cards = [
    {
        key: "active",
        label: "Active",
        icon: CheckCircle2Icon,
    },
    {
        key: "inactive",
        label: "Inactive",
        icon: UserRoundIcon,
    },
    {
        key: "products",
        label: "Linked Products",
        icon: PackageIcon,
    },
] as const;

export function CustomerStats({ stats }: CustomerStatsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
