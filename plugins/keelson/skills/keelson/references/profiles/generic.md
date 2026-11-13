# Stack profile: generic (auto-detect)

No fixed stack. At the start of a session, learn it from the repo and keep a short summary in `.keelson/memory/project/context.md` (with the engineer's approval):
- **Languages and versions:** manifests and lockfiles (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`, `Cargo.toml`…), toolchain files (`.nvmrc`, `.python-version`).
- **Frameworks and data stores:** dependencies, config files, docker-compose services, migrations folders.
- **Commands:** how to install, build, typecheck, lint, test (unit/integration/E2E). Prefer the scripts the repo already defines and the CI config.
- **Conventions:** folder layout, error handling, logging, naming; copy the existing patterns.

## Checks that matter for any stack
- Read the CI config and mirror it locally before calling a change done.
- Check the installed version of a library before using version-specific APIs.
- Database work: look at the query plan, indexes, and migration reversibility.
- Services: timeouts, retries with backoff, idempotency, pagination, observability.
