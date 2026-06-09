# Firmcraft Dispatch Optimizer

The AI intelligence layer of the Firmcraft scheduling module (Phase 2.3). A
Python/FastAPI microservice that wraps the [VROOM](https://github.com/VROOM-Project/vroom)
vehicle-routing solver, layers a multi-objective scoring engine on top, and
exposes a small API for dispatch commands. Runs on a Hetzner VPS alongside
Hermes in production; runs locally via Docker Compose for development.

See `docs/scheduling-dispatch-architecture.md` §3 and
`docs/scheduling-dispatch-build-plan.md` Phase 2.3 for the full spec.

## What it does

1. **Problem builder** (`src/solver.py`) — translates Supabase state (techs,
   jobs, locations, skills, time windows, work hours) into a VROOM VRPTW
   instance. Skills and time windows are native VROOM constraints, so a job
   requiring "EPA 608" can *never* be assigned to a tech without it.
2. **Distance matrix** (`src/distance.py`) — Google Routes API distance/duration
   matrix, cached in Redis on 0.01° grid cells (24h TTL) so a new job on the
   same block as a recent one is a cache hit. Falls back to Haversine
   straight-line estimates when the API is unavailable, and a cost circuit
   breaker drops to cached-only once estimated daily spend exceeds $15.
3. **Scoring engine** (`src/scoring.py`) — weighted multi-objective ranking:

   | dimension | default weight |
   |---|---|
   | drive time | 0.30 |
   | revenue | 0.25 |
   | skill match | 0.20 |
   | workload balance | 0.15 |
   | customer preference | 0.10 |

   Each dimension is normalized 0–1, weighted, and summed (then divided by the
   weight total). Weights are configurable per tenant in
   `tenants.settings.optimization_weights`; different weights produce different
   rankings.
4. **Dispatch orchestration** (`src/dispatch.py`) — `optimize` (full day),
   `suggest` (top-N techs for one job), `emergency` (nearest qualified tech +
   disruption cost), and `reassign` (redistribute a tech's jobs).

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/optimize` | Full-day optimization for a tenant+date → ranked assignments |
| `POST` | `/suggest` | Top-3 tech candidates for a single job, with reasoning |
| `POST` | `/emergency` | Nearest qualified tech for an emergency job + disruption cost |
| `POST` | `/reassign` | Redistribute one tech's jobs across the rest |
| `GET`  | `/health` | Liveness + backend/config status |

### Dispatch modes

Resolved per tenant from `tenants.settings.dispatch_mode` (overridable per
request):

- **manual** — suggestions only, no DB writes.
- **assist** — every run logged to `dispatch_logs` (as a suggestion) for the
  dispatch board to surface; the dispatcher accepts via the admin API.
- **auto** — assignments applied immediately to `jobs` and logged
  `accepted=true`; the 5-minute override window is enforced by the dispatch
  board UI before techs are paged.

Every optimization run is logged to `dispatch_logs` with the input snapshot,
full solution, solve time, mode, and accepted status.

## Local development

```bash
# Option A — Docker Compose (Redis + service)
cp .env.example .env            # fill in SUPABASE_* (service-role key)
docker compose up --build       # service on http://localhost:8080

# Option B — bare venv
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8080
```

`GOOGLE_MAPS_API_KEY` is optional locally — leave it blank to force the
Haversine fallback and spend no API quota. Redis is optional too; a missing
Redis degrades to no-cache rather than failing.

## Tests

```bash
pip install -r requirements.txt
pytest                  # unit + integration (offline: Haversine, no Redis/Google)
pytest -m benchmark -s  # performance benchmarks with printed timings
```

Coverage:

- **Unit** — problem builder (index/skill mapping), scoring (skill quality,
  weight-driven ranking changes), distance matrix (Haversine, grid-cell caching).
- **Integration** — the canonical 5-tech / 20-job Houston problem: all jobs
  accounted for, no double-booking, skill constraints honored, drive times
  plausible, solve < 1s. Plus `suggest`, `emergency`, and `reassign`.
- **Benchmark** — 10 techs / 50 jobs solves in **< 1s** (~45 ms observed);
  30 techs / 200 jobs in **< 2s** (~0.5s observed, 10-iteration mean/max).

## Solver backend

Uses `pyvroom` (prebuilt wheel; no C++ toolchain needed on CPython 3.11/3.12
x86_64). If `pyvroom` is unavailable on a given box, the solver transparently
falls back to a greedy nearest-feasible heuristic that still honors skills, time
windows, and work hours — `GET /health` reports the active `solver_backend`.

## Configuration

All via environment / `.env` (see `.env.example`). Notably:

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — server-side reads/writes
  (service-role key bypasses RLS, correct for a trusted backend service).
- `GOOGLE_MAPS_API_KEY` — Routes API; blank ⇒ Haversine only.
- `REDIS_URL`, `DISTANCE_GRID_PRECISION`, `DISTANCE_CACHE_TTL` — distance cache.
- `DISTANCE_DAILY_BUDGET_USD`, `DISTANCE_COST_PER_ELEMENT` — cost circuit breaker.
