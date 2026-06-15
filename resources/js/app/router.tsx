import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/app-layout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AuditLogsPage } from "@/features/audit/AuditLogsPage";
import { CustomerListPage } from "@/features/customers/CustomerListPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { MassPrintingPage } from "@/features/printing/MassPrintingPage";
import { PrintQueuePage } from "@/features/printing/PrintQueuePage";
import { ProductListPage } from "@/features/products/ProductListPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
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
                    { path: "dashboard", element: <DashboardPage /> },
                    { path: "customers", element: <CustomerListPage /> },
                    { path: "users", element: <UserListPage /> },
                    { path: "products", element: <ProductListPage /> },
                    { path: "printing", element: <PrintQueuePage /> },
                    { path: "printing/mass", element: <MassPrintingPage /> },
                    { path: "templates", element: <TemplateListPage /> },
                    {
                        path: "templates/designer",
                        element: <TemplateDesignerPage />,
                    },
                    { path: "reports", element: <ReportsPage /> },
                    { path: "audit-logs", element: <AuditLogsPage /> },
                    { path: "settings", element: <SettingsPage /> },
                ],
            },
        ],
    },
]);
