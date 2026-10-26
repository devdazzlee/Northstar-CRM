# Northstar CRM — Agent Coding Instructions

**Audience:** Cursor, Claude, and any AI coding agent working in this repo.

**Goal:** Keep every change production-quality, DRY, and **scalable**. Prefer small, focused diffs over rewrites.

When writing or editing code, **follow this file**. If a request conflicts with these rules, follow these rules and explain the conflict briefly.

---

## 0. Mandatory agent behavior

1. Read existing patterns in nearby files before inventing new ones.
2. Reuse shared UI, types, hooks, validators, and API helpers — never copy-paste.
3. Prefer editing an existing module over adding a parallel duplicate.
4. Do not leave dead code, commented-out blocks, or `console.log` in committed changes.
5. Run `pnpm typecheck` and `pnpm test` (frontend) after substantive changes when possible.
6. Do not expand scope beyond the task. No drive-by refactors unless required for the change.
7. Never put secrets or API keys in source. Use env vars only.

---

## 1. Project layout (scalable structure)

```text
frontend/
  app/                 # Next.js routes, layout, providers only
  features/<domain>/   # Feature modules (lists, deals, reports, …)
  components/
    ui/                # Shared primitives (Modal, PageHeader, Toast, …)
    shell/             # App chrome (sidebar, header, nav)
    workspace/         # Shell dialogs + view router
  hooks/               # Reusable React hooks (useXxx)
  stores/              # Zustand (or similar) client stores
  lib/
    types.ts           # Shared domain types
    constants.ts       # Named constants (no magic strings)
    api/               # API / data access layer
    validators/        # Zod schemas
    seeds/             # Demo/seed data only
  …
```

**Rules**

- Organize by **feature** (`features/deals/`), not giant catch-all files.
- One primary component/export per file when practical.
- Keep thin shims at old paths only if needed for imports — prefer updating imports to `@/features/...`.
- Shared cross-feature code lives in `components/ui`, `hooks`, `lib`, or `stores` — not duplicated inside features.

---

## 2. Frontend (React / Next.js) best practices

### Components

- Functional components + hooks only. No class components (except a true Error Boundary if required).
- Keep components focused. Split when a file grows past ~150–200 lines or has multiple responsibilities.
- Prefer composition (`children`, slots) over deep prop drilling.
- Separate UI from logic: move reusable logic into `hooks/`.
- PascalCase files for components (`ContactDialog.tsx`). Hooks: `useCamelCase.ts`.

### Props & state

- Destructure props; type all props with TypeScript.
- Never mutate props or state. Use immutable updates: `setItems((prev) => [...prev, item])`.
- Keep state local; lift only when shared. Use Zustand for shell/global UI; React Query for server/cache state.
- Do not store derived data in state — compute during render (or `useMemo` only when expensive).
- Avoid prop drilling beyond 2–3 levels; use store/context/query instead.

### Hooks & effects

- Follow Rules of Hooks. Correct dependency arrays; do not disable the lint rule casually.
- Prefer event handlers over `useEffect` for user actions.
- Always clean up timers, listeners, and subscriptions.
- Do not overuse `useMemo` / `useCallback`.

### Data & forms

- Server/async data: **React Query** (`lib/api` + `hooks/use-*-queries`). No ad-hoc `useEffect` + `fetch` in components.
- Forms: **React Hook Form + Zod** (`lib/validators/*`). Validate client-side; mirror rules on the server when an API exists.
- Loading, error, and empty states are required for async UI.

### Rendering & performance

- Stable unique `key`s in lists (never index if list can reorder).
- Lazy-load heavy workspaces (`next/dynamic` / view-router). Keep route chunks small.
- Virtualize long lists (`VirtualTable` / `@tanstack/react-virtual`).
- Code-split by feature/route; optimize images; debounce search inputs.

### Styling & a11y

- Tailwind only (use `ui` tokens from `lib/ui.ts` and `cn()`). No inline styles except dynamic values.
- Semantic HTML: `button`, `nav`, `main`, `label`. Associate inputs with labels.
- Modals: `role="dialog"`, Escape to close, focus restore, backdrop dismiss.

### Frontend anti-patterns (do not do)

```tsx
// ❌ Duplicate Modal / PageHeader / shell classes in a feature file
function Modal() { /* local copy */ }

// ❌ Giant page with all views inline
export default function Page() { /* 2000 lines */ }

// ❌ Magic strings
setView('Contacts') // OK if typed View union; never invent untyped strings

// ✅ Shared primitives + typed View + feature module
import { Modal } from '@/components/ui/modal'
import { ContactsWorkspace } from '@/features/lists/contacts-workspace'
```

---

## 3. Backend best practices (API / services)

When adding or changing a backend (Node, Nest, Express, tRPC, etc.), follow the same scalability mindset.

### Structure

```text
backend/  (or apps/api/)
  src/
    modules/<domain>/     # feature module (users, contacts, deals)
      *.controller.ts     # HTTP / RPC edge only
      *.service.ts        # business logic
      *.repository.ts     # DB access only
      *.dto.ts / *.schema.ts
    common/               # auth, errors, logging, middleware
    config/               # env validation (zod)
```

### Rules

- **Layered modules:** controller → service → repository. Controllers do not talk to the DB directly.
- Validate all inputs with Zod (or equivalent) at the boundary. Never trust client data.
- Typed DTOs / shared types with the frontend when possible (`lib/types` or a shared package).
- Idempotent writes where relevant; use transactions for multi-step mutations.
- Consistent API envelope: `{ success, data, message, meta }` (errors: `{ success:false, error:{ code, details } }`).
- AuthN/AuthZ on every protected route. Never authorize only on the client.
- Logging: structured logs; never log secrets or PII unnecessarily.
- Config via env + schema validation at startup. Fail fast on missing secrets.
- Migrations for schema changes; no hand-edited prod DB as the source of truth.
- Pagination, filtering, and sorting for list endpoints. Never return unbounded lists.
- Rate-limit auth and write endpoints; sanitize HTML if ever rendered.

### Backend anti-patterns

```ts
// ❌ Business logic in route handlers + raw SQL sprinkled everywhere
app.post('/deals', async (req, res) => { /* 200 lines */ })

// ✅ Thin handler → service → repository
app.post('/deals', validate(createDealSchema), dealsController.create)
```

### Multi-tenant SaaS (selling to many companies)

- **Stack:** NestJS + Prisma + PostgreSQL (Neon). Same TypeScript as the Next.js frontend.
- **Tenancy:** one shared DB; every business row has `organizationId`. Never trust a client-sent org id — take it from the authenticated session/JWT.
- **Platform vs tenant:** `PlatformAdmin` (you) ≠ `OrgAdmin` (customer). Platform routes live in a separate module and never mix with tenant data APIs.
- **RBAC:** permissions as strings (`contacts:read`, `deals:write`); roles are bundles of permissions. UI tabs come from permissions, not hard-coded role names.
- **Secrets:** `DATABASE_URL` only in `.env` / host secrets. Never commit connection strings. Rotate immediately if leaked in chat or git.

Default tenant roles: `OrgAdmin`, `SalesManager`, `SalesRep`, `SupportManager`, `SupportAgent`, `Marketing`, `Viewer`.  
Platform role: `PlatformAdmin` only.

---

## 4. TypeScript & quality bar

- `strict: true`. No `any` unless unavoidable and documented.
- Prefer `unknown` + narrowing over `any`.
- Named constants for repeated strings/numbers (`lib/constants.ts`).
- Absolute imports via `@/…`.
- ESLint + Prettier; fix hooks/exhaustive-deps warnings you introduce.
- Meaningful names. Comment **why**, not what.
- Early returns to avoid deep nesting.

---

## 5. Testing

- Unit/RTL for validators, hooks, dialogs, and critical flows (`pnpm test`).
- Test behavior (user can submit valid contact), not implementation details.
- Backend: unit-test services; integration-test API routes with a test DB/fixture when available.
- Do not merge knowingly broken typecheck or tests.

---

## 6. Security checklist

- No `dangerouslySetInnerHTML` unless sanitized.
- No secrets in git or client bundles.
- Validate + sanitize all user input (FE and BE).
- CSRF / CORS / cookie flags configured correctly for cookie auth.
- Principle of least privilege for DB and API keys.

---

## 7. Definition of done (every change)

Before finishing a task, the agent should confirm:

- [ ] No duplicated UI/logic that already exists in `components/ui`, `hooks`, `lib`, or `features/*`
- [ ] Types live in shared modules; no one-off duplicate interfaces
- [ ] Forms use Zod + RHF where non-trivial
- [ ] Async data uses the API + React Query layer (FE) or service layer (BE)
- [ ] Feature code is under `features/<domain>/` (or a backend module), not a mega-file
- [ ] A11y basics for new interactive UI
- [ ] `pnpm typecheck` / `pnpm test` still pass for touched areas
- [ ] Diff is focused on the request only

---

## 8. Stack conventions (this repo)

| Concern | Use |
|--------|-----|
| UI kit tokens | `@/lib/ui` |
| Domain types | `@/lib/types` |
| Shell UI state | `@/stores/shell-store` (Zustand) |
| Server/cache state | `@tanstack/react-query` + `@/lib/api` |
| Forms | `react-hook-form` + `zod` + `@/lib/validators` |
| Feature workspaces | `@/features/<name>` + lazy load via view-router |
| Path alias | `@/*` |

**New feature checklist**

1. Add types/constants/validators if needed.
2. Add `features/<name>/` with focused files + `index.ts`.
3. Wire lazy import in view-router (or a real App Router page).
4. Reuse `Modal` / `PageHeader` / `EmptyState` / `Toast`.
5. Add a small test for the critical path when practical.

---

*Follow this document for all frontend and backend work so the CRM stays scalable, maintainable, and consistent.*
