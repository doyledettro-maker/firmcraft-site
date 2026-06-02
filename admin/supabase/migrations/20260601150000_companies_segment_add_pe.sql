-- Add 'pe' (private equity firms) to the allowed company segments. PE firms are
-- a distinct outreach motion from the SMB/mid-market/enterprise size tiers:
-- the partners are the decision makers, so they get sourced and enriched
-- differently. Replace the inline check constraint from the prior migration.
alter table public.companies
  drop constraint if exists companies_segment_check;

alter table public.companies
  add constraint companies_segment_check
    check (segment in ('small', 'midmarket', 'enterprise', 'pe'));
