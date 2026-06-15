import { Card, CardContent } from "@/components/ui/card";

import { templateMetricCards } from "./template.model";

export function TemplateStats({
    stats,
}: {
    stats: Record<(typeof templateMetricCards)[number]["key"], number>;
}) {
    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {templateMetricCards.map((metric) => {
                const Icon = metric.icon;

                return (
                    <Card key={metric.key} className="shadow-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {metric.label}
                                </p>
                                <p className="mt-1 text-2xl font-semibold tabular-nums">
                                    {stats[metric.key]}
                                </p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                                <Icon className="size-5 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
