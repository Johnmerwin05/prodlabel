"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircleIcon,
    Loader2Icon,
} from "lucide-react";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/shared/services/api";
import { useAuthStore } from "@/features/auth/authStore";
import { useToastStore } from "@/stores/toastStore";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required."),
    password: z.string().min(1, "Password is required."),
    remember: z.boolean().default(true),
});

type LoginInput = z.input<typeof loginSchema>;
type LoginValues = z.output<typeof loginSchema>;

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();
    const location = useLocation();
    const setSession = useAuthStore((state) => state.setSession);
    const notify = useToastStore((state) => state.notify);
    const [serverError, setServerError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput, unknown, LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "admin",
            password: "password",
            remember: true,
        },
    });

    async function onSubmit(values: LoginValues) {
        setServerError(null);

        try {
            const response = await api.post("/auth/login", {
                username: values.username,
                password: values.password,
            });

            setSession({
                user: response.data.user,
                token: response.data.token,
                remember: values.remember,
            });
            notify({
                variant: "success",
                title: "Signed in",
                description: "Welcome back to your ProdLabel workspace.",
            });

            const from =
                (location.state as { from?: { pathname?: string } } | null)
                    ?.from?.pathname ?? "/dashboard";
            navigate(from, { replace: true });
        } catch (error: any) {
            const message =
                error.response?.data?.message ??
                error.response?.data?.errors?.username?.[0] ??
                "Unable to sign in.";
            setServerError(message);
        }
    }

    return (
        <div className={cn("flex flex-col", className)} {...props}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FieldGroup className="gap-5">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            Welcome back
                        </h1>
                        <FieldDescription className="mt-2 max-w-sm text-sm leading-6 text-foreground/60">
                            Sign in with your username and password to open the
                            ProdLabel workspace.
                        </FieldDescription>
                    </div>

                    <Field data-invalid={!!errors.username}>
                        <FieldLabel className="text-sm font-medium leading-none" htmlFor="username">Username</FieldLabel>
                        <Input
                            id="username"
                            autoComplete="username"
                            placeholder="admin"
                            aria-invalid={!!errors.username}
                            {...register("username")}
                            required
                        />
                        {errors.username ? (
                            <FieldDescription className="text-destructive">
                                {errors.username.message}
                            </FieldDescription>
                        ) : null}
                    </Field>
                    <Field data-invalid={!!errors.password}>
                        <FieldLabel className="text-sm font-medium leading-none" htmlFor="password">Password</FieldLabel>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="password"
                            aria-invalid={!!errors.password}
                            {...register("password")}
                            required
                        />
                        {errors.password ? (
                            <FieldDescription className="text-destructive">
                                {errors.password.message}
                            </FieldDescription>
                        ) : null}
                    </Field>
                    {serverError ? (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                        >
                            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                            <p>{serverError}</p>
                        </div>
                    ) : null}
                    <Field>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <Loader2Icon className="size-4 animate-spin" />
                            ) : null}
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}
