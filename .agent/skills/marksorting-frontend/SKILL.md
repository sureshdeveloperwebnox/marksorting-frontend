---
name: marksorting-frontend
description: Complete Next.js 16 (App Router) & React 19 frontend engineering guidelines, Tailwind CSS v4 design tokens, comprehensive folder-by-folder structure (app, components, features, hooks, lib, providers, services, store, types), Zustand state management, TanStack Query, and RBAC permission components.
---

# MarkSorting Frontend Engineering Guidelines

## 1. Technology Stack & Folder Structure

The web application is built with Next.js 16 (App Router), React 19, Zustand, TanStack React Query, and Tailwind CSS v4 in [marksorting-frontend](file:///d:/Office/marksorting/marksorting-frontend).

### Comprehensive Directory Breakdown ([src](file:///d:/Office/marksorting/marksorting-frontend/src))

```
marksorting-frontend/src/
├── app/                        # Next.js 16 App Router pages & API routes
│   ├── (auth)/                 # Public auth pages (login, forgot-password)
│   ├── (dashboard)/            # Authenticated app shell with sidebar & navbar layout
│   │   ├── dashboard/          # Analytics & executive metrics page
│   │   ├── expense/            # Expense filing, receipt modal, & approval table
│   │   ├── installation-management/ # Installation report creation & certificate tables
│   │   ├── mills/              # Mill processing facility management
│   │   ├── reports/            # Exportable service & installation report lists
│   │   ├── roles/              # Role creation & 69 permission checkbox matrix
│   │   ├── service-management/ # Service report builder & service record logs
│   │   ├── settings/           # User profile & platform settings
│   │   ├── stores/             # Stock inventory, return items, material barcodes
│   │   ├── ticket-management/  # Service ticket dispatch & timeline drawer
│   │   └── users/              # User account creation & status controls
│   ├── api/                    # Proxy API endpoints (if needed)
│   ├── unauthorized/           # 403 Access Denied splash page
│   ├── globals.css             # Tailwind CSS v4 theme variables & custom utilities
│   ├── layout.tsx              # Root HTML wrapper with providers
│   └── page.tsx                # Entry point redirecting to /dashboard or /login
├── components/                 # Reusable UI component library
│   ├── auth/                   # Login forms & password reset cards
│   ├── charts/                 # Recharts visualization widgets for dashboard
│   ├── common/                 # Page headers, search bars, stat cards, breadcrumbs
│   ├── dashboard/              # Dashboard-specific overview widgets
│   ├── forms/                  # Reusable form fields, signature canvas, date pickers
│   ├── guards/                 # RouteGuard.tsx for client-side route protection
│   ├── icons/                  # Lucide icon wrappers
│   ├── layouts/                # sidebar.tsx (collapsible nav), navbar.tsx, footer.tsx
│   ├── modals/                 # Modal dialog wrappers (ConfirmModal, FormModal)
│   ├── notifications/          # Real-time notification drawer & toast handlers
│   ├── tables/                 # Generic data tables with pagination & sorting
│   ├── ui/                     # Base UI components (buttons, badges, inputs, tabs)
│   ├── users/                  # User profile cards & avatar uploaders
│   └── permission-wrapper.tsx # RBAC conditional renderer (<PermissionWrapper />)
├── features/                   # Domain feature modules (auth, etc.)
├── hooks/                      # Custom React hooks
│   ├── use-permissions.ts      # Permission check helper (can, hasPermission, canAccessModule)
│   ├── use-toast.ts            # Toast notification wrapper
│   └── use-media-query.ts      # Responsive viewport breakpoint hook
├── lib/                        # Core client utilities
│   ├── api.ts                  # Axios client with automatic 401 token refresh interceptor
│   └── utils.ts                # Classname mergers (clsx/tailwind-merge) & formatters
├── providers/                  # Context providers (QueryClientProvider, AuthProvider)
├── services/                   # Modular API service modules
│   ├── userService.ts          # User CRUD API calls
│   ├── ticketService.ts        # Ticket API calls
│   ├── expenseService.ts       # Expense API calls
│   ├── millService.ts          # Mill API calls
│   └── reportService.ts        # Report compile & PDF export calls
├── store/                      # Decoupled Zustand state stores (11 stores)
├── types/                      # TypeScript interfaces, permissions, API types
└── utils/                      # Helper calculation & date formatting utilities
```

---

## 2. All 11 Decoupled Zustand Stores ([src/store](file:///d:/Office/marksorting/marksorting-frontend/src/store))

All global state MUST be managed in lightweight Zustand stores:

1. **`auth-store.ts`**: Authenticated user object, user role, permission list (`permissions: string[]`), profile pictures, login/logout functions.
2. **`layout-store.ts`**: Sidebar collapsed/expanded state, search drawer visibility, dark/light theme mode.
3. **`useUserStore.ts`**: User table filters, selected user profile, search query.
4. **`useRoleStore.ts`**: Active role selections and permission toggle states for RBAC management.
5. **`useMillStore.ts`**: Mill facility search, customer dropdown filters, mill detail views.
6. **`useCustomerStore.ts`**: Corporate customer lists and corporate contacts.
7. **`useTicketStore.ts`**: Active ticket filters (`status`, `priority`), search query, assigned technician selection.
8. **`useExpenseStore.ts`**: Expense category selections, status filters (`PENDING`, `APPROVED`), upload receipt modal state.
9. **`useServiceReportStore.ts`**: Multi-step service report form state, compressor readings, air dryer values.
10. **`useInstallationReportStore.ts`**: Machine installation certificate form state, warranty dates, ground values.
11. **`useStoreItemStore.ts`**: Store return lists, inflow status, material barcode tracking, quantity summary breakdowns, per-unit return and engineer/admin acknowledge status, and bulk acknowledge actions.

---

## 3. Data Fetching & Axios Interceptor ([src/lib/api.ts](file:///d:/Office/marksorting/marksorting-frontend/src/lib/api.ts))

All API calls use the custom Axios instance in `api.ts` which automatically intercepts `401 Unauthorized` responses and refreshes tokens via `/auth/refresh`.

---

## 4. Frontend RBAC & Permission Wrappers

Enforce granular 69 permissions across the UI:

### A. Element Wrapping
```tsx
import { PermissionWrapper } from '@/components/permission-wrapper';

<PermissionWrapper module="expenses" action="create">
  <button className="btn-primary">File Expense</button>
</PermissionWrapper>
```

### B. Hook Usage
```tsx
import { usePermissions } from '@/hooks/use-permissions';

const { can } = usePermissions();
if (can('approve', 'expenses')) {
  // Render approval controls
}
```

---

## 5. Design System Tokens (Tailwind CSS v4)

- **Dark Mode First Theme**: Backgrounds (`bg-slate-950`, `bg-slate-900`), borders (`border-slate-800`), glassmorphism (`backdrop-blur-md bg-slate-900/80`).
- **Icons & Alerts**: Lucide icons + Sonner toast notifications.
