import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CheckIcon, KeyRoundIcon, SaveIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { permissionGroup, permissionLabel, toTitleCase, type Permission } from "@/features/users/partials/user.model";
import { api } from "@/shared/services/api";
import { useToastStore } from "@/stores/toastStore";

type Profile = {
    id: number;
    employee_code: string | null;
    username: string;
    name: string;
    email: string;
    status: "active" | "inactive" | "locked";
    roles: Array<{ id: number; name: string; slug: string }>;
    permissions: Permission[];
};

type ProfileForm = {
    employee_code: string;
    username: string;
    name: string;
    email: string;
    current_password: string;
    password: string;
    password_confirmation: string;
};

const emptyForm: ProfileForm = {
    employee_code: "",
    username: "",
    name: "",
    email: "",
    current_password: "",
    password: "",
    password_confirmation: "",
};

export function ProfilePage() {
    const queryClient = useQueryClient();
    const setUser = useAuthStore((state) => state.setUser);
    const authUser = useAuthStore((state) => state.user);
    const notify = useToastStore((state) => state.notify);
    const [form, setForm] = React.useState<ProfileForm>(emptyForm);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const profileQuery = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await api.get<{ data: Profile }>("/profile");
            return response.data.data;
        },
    });

    React.useEffect(() => {
        if (!profileQuery.data) return;
        setForm({
            ...emptyForm,
            employee_code: profileQuery.data.employee_code ?? "",
            username: profileQuery.data.username,
            name: profileQuery.data.name,
            email: profileQuery.data.email,
        });
    }, [profileQuery.data]);

    const updateProfile = useMutation({
        mutationFn: async () => {
            const response = await api.put<{ data: Profile }>("/profile", {
                ...form,
                employee_code: form.employee_code.trim() || null,
                password: form.password || null,
                password_confirmation: form.password_confirmation || null,
                current_password: form.current_password || null,
            });
            return response.data.data;
        },
        onSuccess: async (profile) => {
            setErrors({});
            setForm((current) => ({
                ...current,
                current_password: "",
                password: "",
                password_confirmation: "",
            }));
            if (authUser) {
                setUser({
                    ...authUser,
                    name: profile.name,
                    username: profile.username,
                    email: profile.email,
                });
            }
            await queryClient.invalidateQueries({ queryKey: ["profile"] });
            notify({ variant: "success", title: "Profile updated" });
        },
        onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const validationErrors = error.response.data?.errors ?? {};
                setErrors(
                    Object.fromEntries(
                        Object.entries(validationErrors).map(([key, messages]) => [
                            key,
                            Array.isArray(messages) ? String(messages[0]) : String(messages),
                        ]),
                    ),
                );
                return;
            }
            notify({ variant: "error", title: "Unable to update profile" });
        },
    });

    function update(key: keyof ProfileForm, value: string) {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: "" }));
    }

    if (profileQuery.isLoading) return <ProfileSkeleton />;

    if (!profileQuery.data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Unable to load profile</CardTitle>
                    <CardDescription>Please retry or check your connection.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => profileQuery.refetch()}>Retry</Button>
                </CardContent>
            </Card>
        );
    }

    const profile = profileQuery.data;
    const permissionGroups = groupPermissions(profile.permissions);

    return (
        <form
            className="space-y-6"
            onSubmit={(event) => {
                event.preventDefault();
                setErrors({});
                updateProfile.mutate();
            }}
        >
            <PageHeader
                title="My Profile"
                description="Manage your personal account details and review your assigned access."
                actions={
                    <Button type="submit" disabled={updateProfile.isPending}>
                        <SaveIcon className="size-4" />
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserRoundIcon className="size-4" /> Personal Information
                            </CardTitle>
                            <CardDescription>Information used throughout production records and audit activity.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field label="Name" required error={errors.name}>
                                <Input value={form.name} onChange={(event) => update("name", event.target.value)} />
                            </Field>
                            <Field label="Email" required error={errors.email}>
                                <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
                            </Field>
                            <Field label="Username" required error={errors.username}>
                                <Input value={form.username} onChange={(event) => update("username", event.target.value)} />
                            </Field>
                            <Field label="Employee Code" error={errors.employee_code}>
                                <Input value={form.employee_code} onChange={(event) => update("employee_code", event.target.value)} />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <KeyRoundIcon className="size-4" /> Change Password
                            </CardTitle>
                            <CardDescription>Leave these fields blank to keep your existing password.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <Field label="Current Password" error={errors.current_password}>
                                <Input type="password" value={form.current_password} onChange={(event) => update("current_password", event.target.value)} />
                            </Field>
                            <div className="hidden md:block" />
                            <Field label="New Password" error={errors.password}>
                                <Input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} />
                            </Field>
                            <Field label="Confirm New Password" error={errors.password_confirmation}>
                                <Input type="password" value={form.password_confirmation} onChange={(event) => update("password_confirmation", event.target.value)} />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShieldCheckIcon className="size-4" /> Module Access
                            </CardTitle>
                            <CardDescription>Read-only access granted by your administrator.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-[150px_1fr] border-y bg-muted/40 px-5 py-3 text-sm font-medium">
                                <span>Module</span><span>Allowed Capabilities</span>
                            </div>
                            {permissionGroups.map(([group, permissions]) => (
                                <div key={group} className="grid gap-3 border-b px-5 py-4 last:border-b-0 sm:grid-cols-[150px_1fr]">
                                    <div className="font-medium">{toTitleCase(group)}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {permissions.map((permission) => (
                                            <Badge key={permission.id} variant="secondary" className="gap-1.5">
                                                <CheckIcon className="size-3" /> {permissionLabel(permission)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {permissionGroups.length === 0 ? (
                                <p className="p-5 text-sm text-muted-foreground">No module access assigned.</p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <Card className="h-fit">
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="size-20 rounded-2xl">
                                <AvatarFallback className="rounded-2xl text-xl">{initials(profile.name)}</AvatarFallback>
                            </Avatar>
                            <div className="mt-3 text-lg font-semibold">{profile.name}</div>
                            <div className="text-sm text-muted-foreground">@{profile.username}</div>
                        </div>
                        <div className="space-y-4 border-t pt-5">
                            <ReadOnlyValue label="Status">
                                <Badge variant={profile.status === "active" ? "default" : "secondary"}>{toTitleCase(profile.status)}</Badge>
                            </ReadOnlyValue>
                            <ReadOnlyValue label="Assigned Role">
                                <div className="flex flex-wrap justify-end gap-1.5">
                                    {profile.roles.map((role) => <Badge key={role.id} variant="outline">{role.name}</Badge>)}
                                    {profile.roles.length === 0 ? <span className="text-sm text-muted-foreground">No role</span> : null}
                                </div>
                            </ReadOnlyValue>
                            <ReadOnlyValue label="Employee Code">
                                <span className="text-sm font-medium">{profile.employee_code ?? "Not assigned"}</span>
                            </ReadOnlyValue>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return <div className="grid gap-2"><Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function ReadOnlyValue({ label, children }: { label: string; children: React.ReactNode }) {
    return <div className="flex items-start justify-between gap-4"><span className="text-sm text-muted-foreground">{label}</span>{children}</div>;
}

function groupPermissions(permissions: Permission[]) {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
        const group = permissionGroup(permission);
        groups.set(group, [...(groups.get(group) ?? []), permission]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function initials(name: string) {
    return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function ProfileSkeleton() {
    return <div className="space-y-6"><Skeleton className="h-16 w-full" /><div className="grid gap-6 xl:grid-cols-[1fr_360px]"><Skeleton className="h-96" /><Skeleton className="h-72" /></div></div>;
}
