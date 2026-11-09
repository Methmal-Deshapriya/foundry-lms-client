# Foundry LMS Client

Next.js frontend for Foundry Academy's public course catalog and authenticated learning management system.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Redux Toolkit and RTK Query
- React Hook Form and Zod
- HTTP-only cookie authentication provided by the Express API

## Local development

Create `.env.local` with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
CATALOG_REVALIDATION_SECRET=replace-with-the-same-strong-secret-used-by-the-api
NEXT_PUBLIC_IMAGE_ORIGINS=https://your-approved-thumbnail-cdn.example
```

The shared server-only revalidation secret lets the Express API immediately
expire public catalog caches after published category or course changes.

Then run:

```bash
npm install
npm run dev
```

The application runs at `http://localhost:3000`.

## Structure

- `src/app/(public)` contains the landing page, authentication flows, and public catalogs.
- `src/app/(dashboard)` contains authenticated student and admin routes.
- `src/features` contains domain types, RTK Query endpoints, and feature components.
- `src/store/baseApi.ts` owns API response unwrapping, normalized errors, credentials, and cache tags.

The backend remains authoritative for authentication, roles, ownership checks, and LMS business rules.

## Verification

```bash
npm test
npm run lint
npm run build
npm run test:e2e
```

The Playwright release gates run against a production build and retain browser
coverage for stale-cookie recovery, API outages, CSP connectivity, route
authorization, free-enrollment return intent, and paid-classroom isolation.
