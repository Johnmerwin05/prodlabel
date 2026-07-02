import { ArrowLeftIcon, ShieldXIcon, UserRoundIcon } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type NoAccessLocationState = {
    deniedPath?: string;
};

export function NoAccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as NoAccessLocationState | null;

    return (
        <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center py-8">
            <Card className="w-full max-w-xl">
                <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
                    <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ShieldXIcon className="size-8" />
                    </div>
                    <p className="mt-6 text-sm font-medium uppercase tracking-wider text-destructive">
                        Access denied
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold">
                        You don&apos;t have permission to view this page
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                        Ask an administrator to update your role if you need
                        access to this part of the application.
                    </p>
                    {state?.deniedPath ? (
                        <div className="mt-5 max-w-full rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                            {state.deniedPath}
                        </div>
                    ) : null}
                    <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeftIcon className="size-4" />
                            Go back
                        </Button>
                        <Button asChild>
                            <Link to="/profile" replace>
                                <UserRoundIcon className="size-4" />
                                Go to my profile
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
