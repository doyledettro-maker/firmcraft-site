-- Add lightweight owner assignment for outreach companies.
-- Used by the admin outreach board to filter prospects assigned to trainees/operators.

alter table public.companies
  add column if not exists assigned_to text;

create index if not exists companies_assigned_to_idx
  on public.companies (assigned_to);
