-- Add a market-segment tag to companies so outreach can be sliced by
-- company size tier. Existing rows (the trade-vertical SMB lists) default to
-- 'small'; mid-market sourcing runs tag their rows 'midmarket'.
alter table public.companies
  add column if not exists segment text not null default 'small'
    check (segment in ('small', 'midmarket', 'enterprise'));

create index if not exists companies_segment_idx on public.companies (segment);

-- Backfill: anything not yet tagged is small.
update public.companies set segment = 'small' where segment is null;
