# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, API routes.
- `components/`: Reusable React components (prefer `PascalCase.tsx`).
- `lib/`: Utilities, clients, and helpers (prefer `kebab-case.ts`).
- `__tests__/`: Jest tests (see naming below).
- `prisma/`: Prisma schema and generated client.
- `public/`: Static assets; `styles/`: Tailwind/PostCSS styles.
- `types/`: Shared TypeScript types; `docs/`, `generated/`: project docs/artifacts.
- Module aliases supported: `@/components/*`, `@/lib/*`, `@/app/*`.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server (Next.js).
- `npm run build`: Production build.
- `npm start`: Run production server.
- `npm run lint`: Lint with ESLint/Next rules.
- `npm test`: Run Jest test suite.
- `npm run test:watch`: Watch mode for tests.
- Post-install: `prisma generate` runs automatically. For schema changes, run `npx prisma migrate dev` (if applicable).

## Coding Style & Naming Conventions
- TypeScript + React. Follow ESLint (`eslint-config-next`) and fix issues before PRs.
- Components: `PascalCase` filenames; hooks `useCamelCase`.
- App Router: directories lowercase; use `page.tsx`, `layout.tsx` patterns.
- Imports: prefer `@/components/...`, `@/lib/...` aliases.

## Testing Guidelines
- Frameworks: Jest + Testing Library (`jest-environment-jsdom`, `ts-jest`).
- Location: `__tests__/` with `*.test.ts` or `*.test.tsx`.
- Run: `npm test` (use `test:watch` during development).
- Use existing mocks in `jest.setup.js` for LiveKit, Supabase, and Tldraw.

## Commit & Pull Request Guidelines
- Commits: Use concise, action-oriented prefixes (seen in history): `feat:`, `fix:`, `improve:`, `refine:`. Example: `fix: prevent navbar hydration mismatch`.
- Scope small, commit often; reference issues when relevant (e.g., `Closes #123`).
- PRs: Include summary, rationale, screenshots for UI, test plan, and checklist (lint/tests passing). Link related issues.

## Security & Configuration Tips
- Secrets in `.env.local` (never commit). Client-safe vars use `NEXT_PUBLIC_*`.
- Database/config: Prisma uses `DATABASE_URL`. Keep schemas and migrations consistent.
- Review `next.config.js` and `middleware.ts` when changing routing or headers.
