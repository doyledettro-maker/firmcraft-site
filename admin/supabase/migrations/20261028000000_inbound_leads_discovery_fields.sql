-- Optional self-reported fields from the marketing-site contact form
-- (added to the form on 2026-10-22). Until this migration, the answers were
-- written into `notes` as "Heard about Firmcraft: ..." and
-- "Writing on behalf of: ..." lines.

alter table public.inbound_leads
  add column if not exists referral_source text,
  add column if not exists inquiry_for text;

comment on column public.inbound_leads.referral_source is
  'Answer to "How did you hear about Firmcraft?" (optional; one of the form options)';
comment on column public.inbound_leads.inquiry_for is
  'Answer to "I am writing on behalf of" (optional): My own organization | A client of my firm';

-- Backfill leads captured between 2026-10-22 and this migration.
-- `notes` is left unchanged.
update public.inbound_leads
set referral_source = substring(notes from 'Heard about Firmcraft: ([^\n]+)')
where referral_source is null
  and notes like '%Heard about Firmcraft: %';

update public.inbound_leads
set inquiry_for = substring(notes from 'Writing on behalf of: ([^\n]+)')
where inquiry_for is null
  and notes like '%Writing on behalf of: %';
