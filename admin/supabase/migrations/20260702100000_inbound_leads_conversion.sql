-- Lead → opportunity conversion linkage.
--
-- Converting an inbound lead promotes it onto the outreach graph (creates or
-- links a company + contact, logs the lead's message as correspondence) and
-- opens an opportunity. The lead row itself is never moved or deleted — these
-- nullable FKs record where it went, let the Leads UI link to the board, and
-- block accidental double-conversion.

alter table public.inbound_leads
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists contact_id uuid references public.contacts(id) on delete set null,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;

create index if not exists inbound_leads_company_idx
  on public.inbound_leads (company_id) where company_id is not null;
