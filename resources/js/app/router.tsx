import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/app-layout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { RequirePermission } from "@/features/auth/RequirePermission";
import { NoAccessPage } from "@/features/auth/NoAccessPage";
import { AuditLogsPage } from "@/features/audit/AuditLogsPage";
import { CustomerListPage } from "@/features/customers/CustomerListPage";
import { MassPrintingPage } from "@/features/printing/MassPrintingPage";
import { PrintQueuePage } from "@/features/printing/PrintQueuePage";
import { PrintRequestPage } from "@/features/printing/PrintRequestPage";
import { ProductListPage } from "@/features/products/ProductListPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { RoleManagementPage } from "@/features/roles/RoleManagementPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { TemplateDesignerPage } from "@/features/templates/TemplateDesignerPage";
import { TemplateListPage } from "@/features/templates/TemplateListPage";
import { UserListPage } from "@/features/users";
import LoginPage from "@/pages/login";

export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="/dashboard" replace />,
                    },
                    { path: "dashboard", element: <RequirePermission permission="report.view"><ReportsPage /></RequirePermission> },
                    { path: "customers", element: <RequirePermission permission="customer.view"><CustomerListPage /></RequirePermission> },
                    { path: "users", element: <RequirePermission permission="user.view"><UserListPage /></RequirePermission> },
                    { path: "roles", element: <RequirePermission permission="role.view"><RoleManagementPage /></RequirePermission> },
                    { path: "products", element: <RequirePermission permission="product.view"><ProductListPage /></RequirePermission> },
                    { path: "print", element: <RequirePermission permission="printing.view"><PrintRequestPage /></RequirePermission> },
                    { path: "printing", element: <RequirePermission permission="printing.view"><PrintQueuePage /></RequirePermission> },
                    { path: "printing/mass", element: <RequirePermission permission="printing.update"><MassPrintingPage /></RequirePermission> },
                    { path: "templates", element: <RequirePermission permission="template.view"><TemplateListPage /></RequirePermission> },
                    {
                        path: "templates/designer",
                        element: <RequirePermission permission="template.manage"><TemplateDesignerPage /></RequirePermission>,
                    },
                    { path: "audit-logs", element: <RequirePermission permission="audit.view"><AuditLogsPage /></RequirePermission> },
                    { path: "settings", element: <RequirePermission permission="settings.manage"><SettingsPage /></RequirePermission> },
                    { path: "profile", element: <ProfilePage /> },
                    { path: "no-access", element: <NoAccessPage /> },
                ],
            },
        ],
    },
]);
