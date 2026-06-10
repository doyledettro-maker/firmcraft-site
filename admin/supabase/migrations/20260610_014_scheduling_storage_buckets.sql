-- Scheduling & Dispatch (Phase 2.1, Sprint 3) — Storage buckets
--
-- Two private buckets for the Phase 2.4 tech mobile app:
--   job-photos  — before/work/after photos, ≤5MB each
--   signatures  — customer signature captures, ≤1MB each
--
-- Object paths are {tenant_id}/{job_id}/{filename}; RLS on storage.objects
-- scopes authenticated users to their own tenant's folder (first path segment
-- must equal the JWT's tenant_id) and requires the two-level path shape. The
-- service-role key (Edge Functions, Hermes) bypasses RLS as usual.

-- ============================================================
-- 1. BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('job-photos', 'job-photos', false, 5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
    ('signatures', 'signatures', false, 1048576,
     array['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'])
on conflict (id) do update
    set file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 2. TENANT-SCOPED RLS ON OBJECTS
-- ============================================================
--
-- storage.foldername(name) is the path split minus the filename;
-- [1] = tenant_id segment, [2] = job_id segment.

drop policy if exists scheduling_uploads_select on storage.objects;
create policy scheduling_uploads_select on storage.objects
    for select to authenticated
    using (
        bucket_id in ('job-photos', 'signatures')
        and (storage.foldername(name))[1] = public.tenant_id()::text
    );

drop policy if exists scheduling_uploads_insert on storage.objects;
create policy scheduling_uploads_insert on storage.objects
    for insert to authenticated
    with check (
        bucket_id in ('job-photos', 'signatures')
        and (storage.foldername(name))[1] = public.tenant_id()::text
        and array_length(storage.foldername(name), 1) >= 2
    );

drop policy if exists scheduling_uploads_update on storage.objects;
create policy scheduling_uploads_update on storage.objects
    for update to authenticated
    using (
        bucket_id in ('job-photos', 'signatures')
        and (storage.foldername(name))[1] = public.tenant_id()::text
    )
    with check (
        bucket_id in ('job-photos', 'signatures')
        and (storage.foldername(name))[1] = public.tenant_id()::text
        and array_length(storage.foldername(name), 1) >= 2
    );

drop policy if exists scheduling_uploads_delete on storage.objects;
create policy scheduling_uploads_delete on storage.objects
    for delete to authenticated
    using (
        bucket_id in ('job-photos', 'signatures')
        and (storage.foldername(name))[1] = public.tenant_id()::text
    );
