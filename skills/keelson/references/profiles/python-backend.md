# Stack profile: Python backend

**Core:** Python 3, FastAPI / Django / Flask, PostgreSQL, SQLAlchemy or Django ORM, Celery or RQ, Redis, pytest. Often with: pandas/Polars, Airflow/Dagster, AWS/GCP/Azure.

## Conventions to check first
- Environment and dependency tool (`uv`, Poetry, pip-tools, pip + `requirements.txt`) and the Python version (`.python-version`, `pyproject.toml`).
- Type checking (mypy / pyright) and lint/format (ruff, black) settings.
- Framework version and its async model (sync vs async views, event loop usage).
- Migrations: Alembic or Django migrations; how they are generated and run.

## Checks that matter here
- `pytest` (with the repo's markers and fixtures), type check, lint.
- Postgres: `EXPLAIN ANALYZE` for new queries; avoid N+1 (`select_related` / `selectinload`); reversible migrations.
- Async code: no blocking calls in async paths; timeouts on all network calls.
- Background jobs: idempotent tasks, retries with backoff, visibility timeouts.
- Data pipelines: schema validation, idempotent reruns, partitioning, backfill plan.
