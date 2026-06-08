-- ---------------------------------------------------------------------------
-- Add "targeted" contact status + reset demo/seed data to a clean baseline
-- ---------------------------------------------------------------------------
-- "targeted" is the first real status in the outreach pipeline: we've
-- identified this contact as a prospect we want to pursue, before any outreach
-- has been drafted or queued. It becomes the new default for new contacts.

-- 1. Widen the status CHECK constraint to allow 'targeted'.
alter table public.contacts
  drop constraint if exists contacts_status_check;

alter table public.contacts
  add constraint contacts_status_check
  check (status in (
    'targeted', 'draft', 'queued', 'sent', 'opened',
    'clicked', 'replied', 'bounced', 'unsubscribed'
  ));

-- 2. New contacts start as 'targeted'.
alter table public.contacts
  alter column status set default 'targeted';

-- 3. Reset ALL existing contacts (current rows are demo/seed data) to a clean
--    baseline: targeted status with no engagement history.
update public.contacts set
  status            = 'targeted',
  resend_message_id = null,
  sent_at           = null,
  opened_at         = null,
  clicked_at        = null,
  replied_at        = null,
  bounced_at        = null,
  unsubscribed_at   = null;

-- 4. Clear the demo correspondence timeline so engagement history matches the
--    reset contacts.
delete from public.correspondence;

-- 5. Return companies to their neutral baseline status as well (seed data set
--    some to engaged/customer/archived).
update public.companies set status = 'active';
