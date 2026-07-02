export type Role = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
    users_count: number;
    created_at: string;
    updated_at: string;
};

export type RoleFormValues = {
    name: string;
    slug: string;
    description: string;
};

export type PaginatedRoles = {
    data: Role[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export type RoleFilters = {
    search: string;
    page: number;
    perPage: number;
};

export const defaultRoleFilters: RoleFilters = {
    search: "",
    page: 1,
    perPage: 10,
};

export function roleDefaults(role: Role | null): RoleFormValues {
    return {
        name: role?.name ?? "",
        slug: role?.slug ?? "",
        description: role?.description ?? "",
    };
}

export function toTitleCase(value: string) {
    return value
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
