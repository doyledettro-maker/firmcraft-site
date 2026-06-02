-- Make contacts.email nullable. Cold-call prospect imports (e.g. the Houston
-- list) carry phone + email-draft but no actual email address yet — the rep
-- finds the email later. Send flow already refuses to send when email is null.

alter table public.contacts alter column email drop not null;
