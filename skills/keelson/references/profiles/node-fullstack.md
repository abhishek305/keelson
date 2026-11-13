# Stack profile: Node.js full-stack

**Core:** Node.js / TypeScript, React / Next.js, PostgreSQL, MongoDB, SQL. Often with: Cube (semantic layer), Grafana, AWS (incl. Bedrock, Redshift), Azure, RAG pipelines, MCP servers, Playwright.

## Conventions to check first
- Package manager from the lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`); never mix.
- TypeScript strictness (`tsconfig.json`), module system (ESM vs CJS), path aliases.
- Monorepo tooling (pnpm workspaces, Turborepo, Nx): run commands for the affected packages only.
- Next.js: App vs Pages router, server vs client components, caching and revalidation rules for the installed version.
- ORM / query layer (Prisma, Drizzle, Kysely, TypeORM, Mongoose) and how migrations are generated and run.

## Checks that matter here
- `tsc --noEmit`, lint, unit tests (Vitest/Jest), Playwright for user flows.
- Postgres: `EXPLAIN (ANALYZE, BUFFERS)` for new queries; indexes for new filters/sorts; migrations reversible; no long locks on big tables.
- MongoDB: indexes for query shapes; avoid unbounded arrays; check `explain()`.
- React: avoid needless re-renders and effects; loading/empty/error states; accessibility.
- API: input validation at the boundary (e.g. Zod), typed errors, pagination, idempotency keys for writes, rate limits.
- Cube / analytics: pre-aggregation refresh after dimension or measure changes; check generated SQL.
- RAG / LLM: retrieval eval set, chunking and embedding choices, prompt-injection handling for retrieved content, token cost.
