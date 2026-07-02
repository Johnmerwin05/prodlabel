import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { queryClient } from "@/shared/services/queryClient"
import { router } from "@/app/router"
import { SystemSettingsProvider } from "@/features/settings/system-settings"

createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SystemSettingsProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        </SystemSettingsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
