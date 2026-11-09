# AI Agent Guide for Next.js Frontend Projects

## 1. Purpose

This document instructs AI agents how to work inside this codebase and other Next.js frontend projects that use the same architectural framework.

It is intentionally generalized so it can be reused across multiple projects, but it also reflects the structure and development style used in this repository.

The goal is simple:

- preserve architectural consistency
- reduce careless edits
- keep domain logic organized
- help agents build production-grade frontend systems

This guide should be treated as an execution policy for AI-assisted development.

---

## 2. Core Philosophy

AI agents working on these projects must optimize for:

- maintainability over short-term hacks
- consistency over improvisation
- feature modularity over scattered logic
- predictable data flow over ad hoc fetching
- secure patterns over convenience shortcuts

Agents should not treat the project as a loose collection of React files.
They should treat it as a structured frontend system with clear ownership boundaries.

---

## 3. Architectural Framework to Respect

This repository uses a reusable frontend framework that should remain consistent across future projects.

### 3.1 High-level structure

```txt
src/
  app/         routing, layouts, route groups, page entry points
  features/    domain modules and business logic
  components/  shared stateless UI and layout building blocks
  store/       Redux Toolkit and RTK Query setup
  lib/         cross-cutting utilities, constants, helpers
  data/        temporary static content or local content models when needed
```

### 3.2 Route group philosophy

The `app/` directory is split by access model and experience type.

Typical pattern:

- `app/(public)/`
  Public marketing and guest-accessible routes

- `app/(auth)/`
  Authentication routes such as sign-in and sign-up

- `app/(dashboard)/`
  Authenticated application area for student, admin, and super-admin experiences

Agents must preserve this separation unless explicitly asked to redesign it.

### 3.3 Feature-first domain ownership

The `features/` directory is the primary home for domain logic.

Each feature should own:

- API definitions
- feature types
- feature-specific UI components
- feature-specific helpers
- optionally forms, selectors, mappers, config, and docs

Examples:

- `features/auth/`
- `features/bootcamps/`
- `features/enrollments/`
- `features/users/`
- `features/audit/`

Agents must prefer adding domain logic to `features/<domain>/` instead of placing it directly in route files.

### 3.4 Shared components boundaries

The `components/` directory is for reusable, domain-agnostic components.

Typical subgroups:

- `components/ui/`
  Design-system or primitive components

- `components/layout/`
  Cross-app layout components like navbar, footer, sidebar shells

- `components/marketing/`
  Public-site presentation sections

Agents should not place bootcamp-specific or auth-specific business UI in `components/` if it belongs more naturally in `features/`.

### 3.5 Store architecture

The `store/` directory is the single source of truth for Redux and RTK Query wiring.

Typical responsibilities:

- `baseApi.ts`
  the single RTK Query root API instance

- `store.ts`
  Redux store configuration

- `StoreProvider.tsx`
  React provider mounted at the app root

Agents must not create multiple unrelated API roots without explicit justification.

### 3.6 Cross-cutting utilities

The `lib/` directory contains reusable application helpers such as:

- constants
- access helpers
- formatting helpers
- route helpers
- API error normalization
- role checks
- generic utility functions

Agents should place cross-feature helpers here only when they are genuinely shared.

---

## 4. Non-Negotiable Rules for AI Agents

### Rule 1. `app/` owns routing, not domain logic

Files under `app/` should be thin.

They may:

- compose layouts
- define route structure
- call feature hooks or render feature containers
- coordinate navigation and page entry behavior

They should not become dumping grounds for:

- raw API logic
- domain types
- complicated transformation logic
- reusable business components

### Rule 2. `features/` owns business behavior

If the code is about a real domain concept such as auth, users, billing, bootcamps, enrollments, courses, dashboards, or audit logs, it should probably live in `features/`.

### Rule 3. Use one shared RTK Query foundation

If the project uses Redux Toolkit and RTK Query, agents must build on the existing `baseApi` pattern rather than introducing scattered networking styles.

Do not add:

- local `fetch()` usage inside feature pages
- random `axios` instances
- duplicate API clients
- inconsistent credential handling

Unless the user explicitly requests a different architecture, all API work should extend the shared API layer.

### Rule 4. Respect access-based route grouping

Agents must preserve the separation between:

- public experiences
- authentication experiences
- protected application experiences

Do not mix dashboard UI into the public shell or marketing UI into protected application shells unless the product intentionally requires it.

### Rule 5. Keep reusable docs close to the feature

If the project uses feature `_context.md` files or similar feature-local documentation, agents should read and update them when they materially change that feature’s structure or API usage.

---

## 5. Expected Working Process for AI Agents

Agents should follow this sequence before making meaningful changes.

### Step 1. Investigate the architecture first

Before implementing anything substantial, inspect:

- `src/app/`
- `src/features/`
- `src/components/`
- `src/store/`
- `src/lib/`
- relevant docs in `docs/`

The agent should understand the current boundaries before editing.

### Step 2. Identify the ownership boundary

For any requested change, determine:

- which route group owns the experience
- which feature owns the domain logic
- whether a shared component is justified
- whether a helper belongs in `lib/`

### Step 3. Reuse existing patterns

Before creating new files or abstractions, check whether similar patterns already exist in the project.

Agents should prefer:

- extending an existing feature module
- reusing shared layout patterns
- following established naming conventions
- aligning with existing API and state patterns

### Step 4. Implement in the correct layer

Place code where it belongs the first time.

Examples:

- new domain endpoint: `features/<name>/<name>Api.ts`
- feature type: `features/<name>/<name>Types.ts`
- feature UI: `features/<name>/components/`
- shared visual primitive: `components/ui/`
- app route page: `app/.../page.tsx`
- shared auth helper: `lib/...`

### Step 5. Verify cross-cutting concerns

Every non-trivial feature should be checked for:

- loading states
- empty states
- error states
- route access implications
- role implications
- form feedback behavior
- API cache invalidation behavior

---

## 6. Directory-Level Guidance

## 6.1 `src/app/`

Use `app/` for:

- `layout.tsx`
- `page.tsx`
- route groups
- nested route composition
- route-level loading/error boundaries when needed

Keep files here focused on orchestration, not deep implementation.

Good:

- import a feature container and render it
- use route params and pass them down
- compose layouts

Avoid:

- large inline business logic
- duplicated form logic
- duplicated API transformation code

## 6.2 `src/features/`

This is the most important directory in the framework.

A feature folder may contain:

- `_context.md`
- `<feature>Api.ts`
- `<feature>Types.ts`
- `components/`
- `forms/`
- `hooks/`
- `utils/`
- `mappers/`
- `constants/`

Agents may extend this structure, but should keep it coherent and minimal.

Suggested default rule:

- if the logic is domain-specific, it belongs here

## 6.3 `src/components/`

Use only for components that can be shared safely across domains or app areas.

Good candidates:

- buttons
- cards
- modals
- shell scaffolding
- typography components
- public layout components

Bad candidates:

- feature-specific admin tables
- bootcamp-only form sections
- auth-only submission handlers

## 6.4 `src/store/`

This directory should stay small and intentional.

Agents should:

- keep one store entry point
- keep one RTK Query root API unless a special case truly requires more
- wire reducers and middleware cleanly
- avoid polluting global state with data that belongs in RTK Query cache

## 6.5 `src/lib/`

Put only cross-cutting logic here.

Examples:

- `constants.ts`
- `auth.ts`
- `access.ts`
- `api-errors.ts`
- `formatters.ts`
- `routes.ts`

Do not move domain-specific business logic here just because it is “used in two places” unless it is truly cross-feature.

## 6.6 `src/data/`

Use this only when the project intentionally keeps local/static data or temporary enrichment models.

This is especially acceptable for:

- hybrid MVP content
- local mock data during staged migration
- configuration-style content models

Agents should not silently keep static data forever if the project is clearly moving toward API-backed behavior.

---

## 7. API and State Management Policy

These projects are intended to use Redux Toolkit and RTK Query as the default API strategy.

### 7.1 RTK Query expectations

Agents should:

- extend a shared `baseApi`
- use `injectEndpoints`
- use `transformResponse` where the backend wraps data
- use tags consistently
- invalidate or provide tags intentionally
- centralize credentials/base URL handling

### 7.2 What not to do

Agents should not:

- introduce random direct `fetch()` calls in features that should use RTK Query
- mix multiple networking styles without a clear architectural reason
- duplicate error parsing logic across pages
- store server collections in local component state when RTK Query should own them

### 7.3 Redux slice usage

Use Redux slices only for genuine client state, such as:

- auth metadata
- UI mode flags
- local workflow state shared across distant components

Do not use slices to mirror RTK Query server data unnecessarily.

---

## 8. Authentication and Authorization Guidance

Many of these projects use cookie-based auth with a backend-controlled session.

Agents should assume the following best-practice pattern unless the project says otherwise:

- send credentials with API requests
- use a current-user endpoint like `/auth/me` as the auth source of truth
- do not rely on localStorage tokens
- keep UI access checks centralized
- treat backend permission checks as authoritative

When implementing protected experiences, agents should think in two layers:

1. UX layer
   Hide or disable irrelevant UI for users without access

2. Security layer
   Handle `401` and `403` cleanly because the backend is the final gatekeeper

---

## 9. UI and Component Design Rules

AI agents should build UI that fits the project’s existing design system and structure.

### 9.1 Reuse before inventing

Before adding a new primitive component, inspect:

- `components/ui/`
- existing layout patterns
- existing feature components

### 9.2 Keep business UI near the feature

If a table, form, panel, or dashboard widget is tightly tied to one domain, place it under that feature.

### 9.3 Preserve separation of concerns

Prefer:

- container/component separation where useful
- small composable components
- feature-local composition

Avoid:

- giant route files
- giant feature files mixing API, UI, and validation
- repeated layout wrappers across pages

---

## 10. Forms and Feedback Rules

AI agents should implement forms with predictable behavior.

Every production form should consider:

- client-side validation where appropriate
- server-side error mapping
- inline field errors
- submit loading states
- success and failure toast feedback when the UX pattern uses toasts
- disabled submit during in-flight mutations

If the backend returns field-specific validation errors, agents should map them back to the relevant form field instead of showing only a generic error banner.

---

## 11. Documentation Expectations

Agents should keep documentation useful, lightweight, and close to the architecture.

### 11.1 When to update docs

Update docs when you:

- introduce a new feature module
- materially change architecture
- establish a new reusable pattern
- add a new workflow other agents should follow

### 11.2 Recommended docs structure

Useful project docs may include:

- `docs/architecture.md`
- `docs/frontend_development_plan.md`
- `docs/ai_agent_guide.md`
- feature `_context.md` files

### 11.3 Feature context files

If the project uses `_context.md` inside features, agents should treat them as fast-start docs for future contributors and future AI agents.

They are especially useful for documenting:

- feature responsibilities
- endpoints used
- key state flows
- important UI entry points

---

## 12. What AI Agents Must Avoid

Agents must avoid the following common failure modes:

### 12.1 Architecture drift

Do not place logic wherever it is convenient in the moment.

### 12.2 Route-file bloat

Do not let `page.tsx` files become feature implementations.

### 12.3 Mixed networking styles

Do not combine RTK Query, raw `fetch`, and `axios` casually in the same project architecture.

### 12.4 Shared-folder abuse

Do not put domain-specific components in `components/` just because they are used in more than one route.

### 12.5 Premature abstraction

Do not create large generic frameworks when a simple feature-local solution is enough.

### 12.6 Hidden security assumptions

Do not assume hidden UI equals protected behavior.

### 12.7 Silent framework violations

If a requested change appears to conflict with the project framework, the agent should call that out clearly before making a messy implementation.

---

## 13. Decision Heuristics for File Placement

When uncertain, use these rules.

### Put it in `app/` if:

- it defines a route
- it defines a layout
- it wires route params to a feature component
- it handles route-level composition

### Put it in `features/` if:

- it belongs to one business domain
- it owns an API endpoint or mutation
- it is domain-specific UI
- it is a feature-specific hook, mapper, or form

### Put it in `components/` if:

- it is reusable across multiple unrelated domains
- it is mostly presentational
- it does not own domain behavior

### Put it in `lib/` if:

- it is cross-feature utility logic
- it is not UI
- it is not tied to one domain

### Put it in `store/` if:

- it configures Redux
- it configures RTK Query
- it wires global state infrastructure

---

## 14. Recommended Agent Checklist Before Finalizing Work

Before considering a task complete, the agent should verify:

1. Did I place each change in the correct architectural layer?
2. Did I preserve the route-group separation model?
3. Did I keep domain logic inside `features/`?
4. Did I reuse the project’s shared RTK Query/store pattern?
5. Did I avoid introducing ad hoc networking or duplicated logic?
6. Did I cover loading, empty, and error states where relevant?
7. Did I consider auth and role behavior if the feature touches access?
8. Did I update docs if I introduced a reusable pattern?

---

## 15. Project-Specific Notes for This Repository

This repository currently follows the framework well enough to use as a reference implementation.

Important observed patterns in this project:

- route groups already exist for `(public)`, `(auth)`, and `(dashboard)`
- feature modules already exist for `auth`, `bootcamps`, `enrollments`, `users`, and `audit`
- a shared RTK Query `baseApi` already exists
- shared UI is split into `ui`, `layout`, and `marketing`
- `data/` is currently used for temporary static course enrichment

AI agents working here should preserve and strengthen those patterns rather than bypass them.

---

## 16. Reuse Guidance for Other Projects

This guide is designed to be portable across your future Next.js frontend projects as long as they follow the same broad framework.

When adapting it to another project, only change:

- domain names inside `features/`
- route group names if the access model differs
- state tooling if a project intentionally does not use Redux Toolkit
- project-specific security or API conventions

The main framework should remain stable:

- route composition in `app/`
- domain ownership in `features/`
- shared primitives in `components/`
- centralized API/state infrastructure in `store/`
- cross-cutting helpers in `lib/`

---

## 17. Final Instruction to AI Agents

Do not optimize only for getting the feature working today.
Optimize for keeping the project clean enough that another agent, or a human developer, can continue building tomorrow without untangling your changes first.
