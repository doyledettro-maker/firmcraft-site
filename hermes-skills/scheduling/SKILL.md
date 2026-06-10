---
name: scheduling
description: "Manage the Firmcraft scheduling & dispatch module conversationally: book/move/cancel/complete jobs, list a day's schedule, check tech availability, mark techs off. Use for 'book an AC tune-up for Tom Friday 2pm', 'what's on the schedule tomorrow', 'move the Johnson job to Wednesday', 'who's free Tuesday for 2 hours', 'Dave is off next Friday', 'mark the furnace install complete'."
version: 1.0.0
author: Firmcraft
metadata:
  hermes:
    tags: [Firmcraft, Scheduling, Dispatch, Jobs, Calendar, Technicians]
    related_skills: [firmcraft-ops, voice-calls]
---

# Scheduling & Dispatch (Phase 2.1 Sprint 3)

Eight function-calling tools over the Firmcraft scheduling module (Supabase).
Each tool fuzzy-matches names the way a dispatcher speaks ("the Johnson job",
"Dave", "AC tune up"), parses natural dates in the **tenant's timezone**
("Thursday", "next Tuesday", "tomorrow 2pm"), and returns a plain-English
`message` to relay to the user.

## Invocation

Everything goes through the CLI with Node (no npm install needed — zero deps):

```
node cli.mjs tools                      # the 8 tool definitions as JSON (load into function-calling)
node cli.mjs <skill> '<json-args>'      # run one tool, JSON result on stdout
```

Result shape: `{ ok, message, needs_confirmation?, data? }`.
- `message` is what you say to the user (clarifying question when `ok:false`).
- `needs_confirmation: true` means show `message` to the user and re-call the
  same tool with the same args **plus `"confirm": true`** once they approve.
  `update_job`, `cancel_job`, and `complete_job` always preview first.

## Tools

| Tool | Use for | Notes |
|---|---|---|
| `create_job` | "Book an AC repair for Tom at 2pm Friday" | Checks the preferred tech's calendar; suggests alternates when booked. Auto-picks a free tech when none specified. |
| `list_jobs` | "What's tomorrow look like?", "Dave's Friday" | date (default today) + optional technician/status filters. |
| `get_job` | "What's the Johnson job about?" | By job_id, or customer_name + date. Includes status history. |
| `update_job` | "Move the Johnson job to Wednesday", "Assign Mike to the 3pm" | Reschedule / reassign / priority / notes. Previews, then confirm. |
| `cancel_job` | "Cancel the 3pm, customer called" | Previews, then confirm. Reports the freed slot. |
| `complete_job` | "Dave finished the furnace install" | Dispatcher path; auto-walks skipped statuses, assembles invoice data. Previews, then confirm. |
| `check_availability` | "Who can fit a 2-hour install Tuesday?" | Optional job_type (applies required certs) or skills list. |
| `set_time_off` | "Dave is off next Friday" | Day or range; reports jobs needing reassignment. |

## Configuration

Copy `.env.example` to `.env` next to this file:

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — the scheduling Supabase project.
- `SCHEDULING_TENANT_SLUG` — which contractor this Hermes serves (default `demo`).
- `SCHEDULING_EDGE_MODE` — `auto` (default): call the Sprint 2 Edge Functions when
  deployed, otherwise fall back to equivalent direct PostgREST operations (the
  status-transition trigger and audit trail behave identically on both paths).
  `always` / `never` force one path.

## Behavior rules

- Never invent a customer, tech, or job type — every name is resolved against
  the DB; ambiguity comes back as a question for the user.
- Destructive/visible changes (update, cancel, complete) are two-step: preview
  → user approves → re-call with `confirm: true`. Don't skip the preview.
- All times you show the user are tenant-local; the API speaks UTC ISO.
- After `set_time_off` reports affected jobs, offer to rebook them (the
  dispatch optimizer integration arrives with a later skill pack).
