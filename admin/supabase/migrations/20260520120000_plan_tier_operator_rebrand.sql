-- Loosen clients.plan_tier to support the Operator rebrand (Solo / Team / Pro)
-- plus the Pilot tier for cost-recovery / case-study customers like Rumble Bee.
-- Legacy values (spark / flow / forge) are kept valid so any backfill from
-- pre-rebrand records doesn't fail the check.

alter table public.clients
  drop constraint if exists clients_plan_tier_check;

alter table public.clients
  add constraint clients_plan_tier_check
  check (plan_tier in ('solo', 'team', 'pro', 'pilot', 'spark', 'flow', 'forge'));

alter table public.clients
  alter column plan_tier set default 'solo';
