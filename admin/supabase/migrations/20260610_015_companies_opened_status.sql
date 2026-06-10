-- Allow outreach company rows to use the "opened" board status.
-- Existing statuses are preserved; opened is used for reviewed/opened prospect records
-- that are not yet engaged/customers/archived.

alter table public.companies
  drop constraint if exists companies_status_check;

alter table public.companies
  add constraint companies_status_check
  check (status in ('active', 'opened', 'engaged', 'customer', 'archived'));
