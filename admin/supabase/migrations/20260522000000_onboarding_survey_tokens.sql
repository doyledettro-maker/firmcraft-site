-- Token-gated onboarding survey backing tables.
--
-- A survey_token represents an invitation Doyle hands to a company. Multiple
-- people from the same company can use the same token. Company-wide sections
-- are filled once and shared; individual sections are per-respondent.

create table if not exists public.survey_tokens (
  token         text primary key,
  company_name  text not null,
  notes         text,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz,
  revoked_at    timestamptz
);

create index if not exists survey_tokens_company_idx
  on public.survey_tokens (company_name);

-- Company-wide answers — one row per (token, section, question).
-- updated_by_email tracks whoever last edited it so the UI can show
-- attribution and the email digest can label who answered what.
create table if not exists public.survey_company_answers (
  token             text not null references public.survey_tokens(token) on delete cascade,
  section_id        text not null,
  question_id       text not null,
  answer            text not null default '',
  updated_by_email  text,
  updated_at        timestamptz not null default now(),
  primary key (token, section_id, question_id)
);

create index if not exists survey_company_answers_token_idx
  on public.survey_company_answers (token);

-- One row per respondent (person filling the survey) per token.
-- Identified by email; same email under different tokens is a different row.
create table if not exists public.survey_respondents (
  token         text not null references public.survey_tokens(token) on delete cascade,
  email         text not null,
  name          text not null,
  role          text not null,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  primary key (token, email)
);

create index if not exists survey_respondents_token_idx
  on public.survey_respondents (token);

-- Individual answers — one row per (token, respondent, section, question).
create table if not exists public.survey_individual_answers (
  token             text not null,
  respondent_email  text not null,
  section_id        text not null,
  question_id       text not null,
  answer            text not null default '',
  updated_at        timestamptz not null default now(),
  primary key (token, respondent_email, section_id, question_id),
  foreign key (token, respondent_email)
    references public.survey_respondents(token, email)
    on delete cascade
);

create index if not exists survey_individual_answers_token_idx
  on public.survey_individual_answers (token);
create index if not exists survey_individual_answers_respondent_idx
  on public.survey_individual_answers (token, respondent_email);
