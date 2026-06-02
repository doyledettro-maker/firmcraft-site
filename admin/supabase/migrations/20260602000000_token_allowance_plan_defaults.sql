-- Give each client a sensible monthly token (AI-spend) allowance.
-- The token_allowance column already exists (numeric, flat default 100), but
-- several clients were created with 0, which renders as "no budget" in the
-- admin progress bars. Backfill a per-plan default ONLY where the allowance was
-- never set (null or 0) so any explicitly-configured value (eg. Rumble Bee's
-- $20 pilot cap) is preserved.

update public.clients
set token_allowance = case plan_tier
    when 'pilot' then 50    -- cost-recovery / case-study tenants
    when 'solo'  then 50
    when 'team'  then 100
    when 'pro'   then 200
    -- legacy tiers (pre-Operator rebrand)
    when 'spark' then 100
    when 'flow'  then 200
    when 'forge' then 300
    else 50
  end
where coalesce(token_allowance, 0) = 0
  and deleted_at is null;

-- New clients should inherit a non-zero floor rather than a misleading 0.
alter table public.clients
  alter column token_allowance set default 50;
