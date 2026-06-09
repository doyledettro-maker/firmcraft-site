-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — demo seed data
--
-- Populates one demo tenant (slug 'demo', reachable at demo.firmcraft.ai once
-- the subdomain middleware is wired) with a realistic Houston-area dataset:
-- 5 technicians, 3 skills + assignments, 2 service-area polygons, 10 customers,
-- 4 job types, and 15 jobs spread across the lifecycle states.
--
-- Idempotent: wraps in a transaction and deletes the demo tenant's rows first
-- (in FK-dependency order) so it can be re-run. Uses fixed UUIDs so jobs/skills
-- can cross-reference deterministically.
--
-- Run with:  psql "$DATABASE_URL" -f admin/supabase/seed-scheduling.sql

begin;

-- ------------------------------------------------------------------
-- Clean prior demo data (FK-safe order) so the seed is re-runnable.
-- ------------------------------------------------------------------
do $$
declare
    demo uuid := '00000000-0000-0000-0000-0000000000d0';
begin
    if exists (select 1 from public.tenants where id = demo) then
        delete from public.job_status_history where tenant_id = demo;
        delete from public.jobs where tenant_id = demo;
        delete from public.dispatch_logs where tenant_id = demo;
        delete from public.technician_current_location where tenant_id = demo;
        delete from public.technician_locations where tenant_id = demo;
        delete from public.technician_availability where tenant_id = demo;
        delete from public.on_call_rotations where tenant_id = demo;
        delete from public.recurring_schedules where tenant_id = demo;
        delete from public.equipment where tenant_id = demo;
        delete from public.technician_zones tz using public.technicians t
            where tz.technician_id = t.id and t.tenant_id = demo;
        delete from public.technician_skills ts using public.technicians t
            where ts.technician_id = t.id and t.tenant_id = demo;
        delete from public.job_types where tenant_id = demo;
        delete from public.customers where tenant_id = demo;
        delete from public.skills where tenant_id = demo;
        delete from public.service_areas where tenant_id = demo;
        delete from public.technicians where tenant_id = demo;
        delete from public.tenants where id = demo;
    end if;
end $$;

-- ------------------------------------------------------------------
-- Tenant
-- ------------------------------------------------------------------
insert into public.tenants (id, clerk_org_id, name, slug, custom_domain, timezone, business_hours)
values (
    '00000000-0000-0000-0000-0000000000d0',
    'org_demo_firmcraft',
    'Demo HVAC & Electrical',
    'demo',
    null,
    'America/Chicago',
    '{"mon":{"start":"08:00","end":"17:00"},"tue":{"start":"08:00","end":"17:00"},"wed":{"start":"08:00","end":"17:00"},"thu":{"start":"08:00","end":"17:00"},"fri":{"start":"08:00","end":"17:00"}}'
);

-- ------------------------------------------------------------------
-- Service areas (PostGIS polygons over the Houston metro)
-- North Houston: roughly north of the I-10 / downtown line (lat >= 29.78)
-- South Houston: roughly south of it (lat <= 29.76)
-- ------------------------------------------------------------------
insert into public.service_areas (id, tenant_id, name, boundary, color, is_active) values
(
    '00000000-0000-0000-0000-00000000a001',
    '00000000-0000-0000-0000-0000000000d0',
    'North Houston',
    ST_GeomFromText('POLYGON((-95.55 29.78, -95.20 29.78, -95.20 29.98, -95.55 29.98, -95.55 29.78))', 4326),
    '#2563eb',
    true
),
(
    '00000000-0000-0000-0000-00000000a002',
    '00000000-0000-0000-0000-0000000000d0',
    'South Houston',
    ST_GeomFromText('POLYGON((-95.55 29.55, -95.20 29.55, -95.20 29.76, -95.55 29.76, -95.55 29.55))', 4326),
    '#16a34a',
    true
);

-- ------------------------------------------------------------------
-- Skills (per-tenant taxonomy)
-- ------------------------------------------------------------------
insert into public.skills (id, tenant_id, name, category, description, is_certification) values
('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000d0', 'EPA 608 Universal',       'certification', 'EPA Section 608 Universal refrigerant handling certification', true),
('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-0000000000d0', 'Journeyman Electrician',  'certification', 'Texas journeyman electrician license',                     true),
('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-0000000000d0', 'Licensed Plumber',        'certification', 'Texas licensed plumber',                                   true);

-- ------------------------------------------------------------------
-- Technicians (Houston-area home addresses + work hours)
-- ------------------------------------------------------------------
insert into public.technicians (id, tenant_id, name, email, phone, home_address, hourly_rate, color, work_hours, is_active, hire_date) values
('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-0000000000d0', 'Dave Martinez',  'dave@demohvac.test',  '+17135550101',
    '{"street":"1820 W 18th St","city":"Houston","state":"TX","zip":"77008","lat":29.8025,"lng":-95.4150}', 38.00, '#ef4444',
    '{"mon":{"start":"07:00","end":"16:00"},"tue":{"start":"07:00","end":"16:00"},"wed":{"start":"07:00","end":"16:00"},"thu":{"start":"07:00","end":"16:00"},"fri":{"start":"07:00","end":"16:00"}}', true, '2021-03-15'),
('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-0000000000d0', 'Mike Chen',      'mike@demohvac.test',  '+17135550102',
    '{"street":"5402 Airline Dr","city":"Houston","state":"TX","zip":"77076","lat":29.8480,"lng":-95.3760}', 36.00, '#f59e0b',
    '{}', true, '2022-06-01'),
('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-0000000000d0', 'Sarah Johnson',  'sarah@demohvac.test', '+17135550103',
    '{"street":"7100 Bellfort Ave","city":"Houston","state":"TX","zip":"77087","lat":29.6710,"lng":-95.3250}', 42.00, '#8b5cf6',
    '{"mon":{"start":"08:00","end":"17:00"},"tue":{"start":"08:00","end":"17:00"},"wed":{"start":"08:00","end":"17:00"},"thu":{"start":"08:00","end":"17:00"},"fri":{"start":"08:00","end":"15:00"}}', true, '2020-09-20'),
('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-0000000000d0', 'Carlos Reyes',   'carlos@demohvac.test','+17135550104',
    '{"street":"3300 Broadway St","city":"Houston","state":"TX","zip":"77017","lat":29.7080,"lng":-95.2780}', 35.00, '#06b6d4',
    '{}', true, '2023-01-10'),
('00000000-0000-0000-0000-00000000b005', '00000000-0000-0000-0000-0000000000d0', 'Tony Russo',     'tony@demohvac.test',  '+17135550105',
    '{"street":"9200 Westheimer Rd","city":"Houston","state":"TX","zip":"77063","lat":29.7380,"lng":-95.5240}', 40.00, '#ec4899',
    '{}', true, '2019-11-05');

-- ------------------------------------------------------------------
-- Technician skill assignments (not every tech has every skill)
--   Dave   : EPA 608 (expert)
--   Mike   : EPA 608 (standard)
--   Sarah  : Journeyman Electrician (expert)
--   Carlos : EPA 608 (apprentice) + Licensed Plumber (standard)
--   Tony   : Licensed Plumber (expert) + Journeyman Electrician (standard)
-- ------------------------------------------------------------------
insert into public.technician_skills (technician_id, skill_id, proficiency, certified_at, expires_at, license_number) values
('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000c001', 'expert',    '2019-04-01', '2027-04-01', 'EPA-608-DM-9921'),
('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000c001', 'standard',  '2022-05-10', '2026-07-15', 'EPA-608-MC-4410'),
('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000c002', 'expert',    '2018-02-20', '2028-02-20', 'TX-JE-118822'),
('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000c001', 'apprentice','2023-03-01', '2027-03-01', 'EPA-608-CR-7733'),
('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000c003', 'standard',  '2022-08-15', null,         'TX-PL-55218'),
('00000000-0000-0000-0000-00000000b005', '00000000-0000-0000-0000-00000000c003', 'expert',    '2017-06-30', null,         'TX-PL-33019'),
('00000000-0000-0000-0000-00000000b005', '00000000-0000-0000-0000-00000000c002', 'standard',  '2019-09-12', '2027-09-12', 'TX-JE-220114');

-- ------------------------------------------------------------------
-- Technician zone assignments
--   North techs: Dave, Mike   South techs: Sarah, Carlos
--   Tony spans both (primary North, secondary South)
-- ------------------------------------------------------------------
insert into public.technician_zones (technician_id, service_area_id, priority) values
('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a001', 1),
('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a001', 1),
('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a002', 1),
('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a002', 1),
('00000000-0000-0000-0000-00000000b005', '00000000-0000-0000-0000-00000000a001', 1),
('00000000-0000-0000-0000-00000000b005', '00000000-0000-0000-0000-00000000a002', 2);

-- ------------------------------------------------------------------
-- Customers (Houston addresses with lat/lng; location point set below)
-- ------------------------------------------------------------------
insert into public.customers (id, tenant_id, name, email, phone, address, location, preferred_tech_id, communication_preference, tags) values
('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-0000000000d0', 'Tom Wilson',       'tom.wilson@example.test',    '+17135551001', '{"street":"412 Heights Blvd","city":"Houston","state":"TX","zip":"77007","lat":29.7790,"lng":-95.3980}',  ST_SetSRID(ST_MakePoint(-95.3980, 29.7790), 4326), '00000000-0000-0000-0000-00000000b001', 'sms',   '{"membership"}'),
('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-0000000000d0', 'Maria Garcia',     'maria.garcia@example.test',  '+17135551002', '{"street":"2200 Yale St","city":"Houston","state":"TX","zip":"77008","lat":29.7990,"lng":-95.3970}',     ST_SetSRID(ST_MakePoint(-95.3970, 29.7990), 4326), null,                                   'sms',   '{}'),
('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-0000000000d0', 'James Brown',      'james.brown@example.test',   '+17135551003', '{"street":"8800 Kirby Dr","city":"Houston","state":"TX","zip":"77054","lat":29.6840,"lng":-95.4170}',    ST_SetSRID(ST_MakePoint(-95.4170, 29.6840), 4326), '00000000-0000-0000-0000-00000000b003', 'email', '{"vip"}'),
('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-0000000000d0', 'Linda Nguyen',     'linda.nguyen@example.test',  '+17135551004', '{"street":"6500 Bellaire Blvd","city":"Houston","state":"TX","zip":"77074","lat":29.7050,"lng":-95.5050}', ST_SetSRID(ST_MakePoint(-95.5050, 29.7050), 4326), null,                                   'sms',   '{"commercial"}'),
('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-0000000000d0', 'Robert Davis',     'robert.davis@example.test',  '+17135551005', '{"street":"1500 N Shepherd Dr","city":"Houston","state":"TX","zip":"77008","lat":29.8010,"lng":-95.4100}', ST_SetSRID(ST_MakePoint(-95.4100, 29.8010), 4326), '00000000-0000-0000-0000-00000000b002', 'phone', '{}'),
('00000000-0000-0000-0000-00000000e006', '00000000-0000-0000-0000-0000000000d0', 'Patricia Lee',     'patricia.lee@example.test',  '+17135551006', '{"street":"3900 Telephone Rd","city":"Houston","state":"TX","zip":"77023","lat":29.7150,"lng":-95.3170}',  ST_SetSRID(ST_MakePoint(-95.3170, 29.7150), 4326), null,                                   'sms',   '{}'),
('00000000-0000-0000-0000-00000000e007', '00000000-0000-0000-0000-0000000000d0', 'Michael Taylor',   'michael.taylor@example.test','+17135551007', '{"street":"10200 Hammerly Blvd","city":"Houston","state":"TX","zip":"77080","lat":29.8090,"lng":-95.5360}', ST_SetSRID(ST_MakePoint(-95.5360, 29.8090), 4326), '00000000-0000-0000-0000-00000000b005', 'sms',   '{"membership"}'),
('00000000-0000-0000-0000-00000000e008', '00000000-0000-0000-0000-0000000000d0', 'Jennifer White',   'jennifer.white@example.test','+17135551008', '{"street":"7700 Almeda Rd","city":"Houston","state":"TX","zip":"77054","lat":29.6900,"lng":-95.3870}',    ST_SetSRID(ST_MakePoint(-95.3870, 29.6900), 4326), '00000000-0000-0000-0000-00000000b004', 'email', '{}'),
('00000000-0000-0000-0000-00000000e009', '00000000-0000-0000-0000-0000000000d0', 'William Harris',   'william.harris@example.test','+17135551009', '{"street":"2300 Wirt Rd","city":"Houston","state":"TX","zip":"77055","lat":29.7920,"lng":-95.5060}',     ST_SetSRID(ST_MakePoint(-95.5060, 29.7920), 4326), null,                                   'sms',   '{"vip","membership"}'),
('00000000-0000-0000-0000-00000000e010', '00000000-0000-0000-0000-0000000000d0', 'Elizabeth Clark',  'elizabeth.clark@example.test','+17135551010','{"street":"5300 Griggs Rd","city":"Houston","state":"TX","zip":"77021","lat":29.6960,"lng":-95.3360}',    ST_SetSRID(ST_MakePoint(-95.3360, 29.6960), 4326), null,                                   'sms',   '{}');

-- ------------------------------------------------------------------
-- Equipment (a couple of customer units for realism)
-- ------------------------------------------------------------------
insert into public.equipment (tenant_id, customer_id, type, brand, model, serial_number, install_date, warranty_expires, location_notes) values
('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e001', 'ac_unit',      'Carrier', '24ACC636', 'CAR-636-771201', '2019-05-12', '2029-05-12', 'side yard, north wall'),
('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e003', 'furnace',      'Trane',   'S9V2',     'TRN-S9V2-220944','2021-11-03', '2031-11-03', 'attic'),
('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e004', 'panel',        'Square D','QO140M200','SQD-200-553102', '2015-03-20', null,         'garage, main panel'),
('00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e006', 'water_heater', 'Rheem',   'XE50T10',  'RHM-50-119087',  '2020-07-08', '2030-07-08', 'utility closet');

-- ------------------------------------------------------------------
-- Job types (required_skills reference the skill UUIDs above)
-- ------------------------------------------------------------------
insert into public.job_types (id, tenant_id, name, category, default_duration, estimated_revenue, color, required_skills) values
('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000d0', 'AC Tune-Up',     'hvac',       60,  149.00, '#3b82f6', array['00000000-0000-0000-0000-00000000c001']::uuid[]),
('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000d0', 'Furnace Repair', 'hvac',       90,  325.00, '#f97316', array['00000000-0000-0000-0000-00000000c001']::uuid[]),
('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d0', 'Panel Upgrade',  'electrical', 240, 1850.00,'#a855f7', array['00000000-0000-0000-0000-00000000c002']::uuid[]),
('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000d0', 'Drain Cleaning', 'plumbing',   45,  189.00, '#14b8a6', array['00000000-0000-0000-0000-00000000c003']::uuid[]);

-- ------------------------------------------------------------------
-- Jobs (15) across lifecycle states. Times are relative to now() so the demo
-- board always has "today/tomorrow" content. Statuses are set directly on
-- INSERT (the transition trigger only governs UPDATEs).
--   States covered: created, scheduled, dispatched, en_route, arrived,
--   in_progress, on_hold, completed, invoiced, cancelled.
-- location is denormalized from the customer.
-- ------------------------------------------------------------------
insert into public.jobs
    (id, tenant_id, customer_id, job_type_id, technician_id, title, description, priority, status, source,
     scheduled_start, scheduled_end, estimated_duration, estimated_revenue, address, location, actual_start, actual_end)
values
-- 1. unassigned, just created
('00000000-0000-0000-0000-000000010001', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000f001', null,
 'AC Tune-Up — Garcia', 'Annual maintenance, system running loud', 'standard', 'created', 'manual',
 null, null, 60, 149.00, '{"street":"2200 Yale St","city":"Houston","state":"TX","zip":"77008"}', ST_SetSRID(ST_MakePoint(-95.3970, 29.7990), 4326), null, null),
-- 2. unassigned emergency (created)
('00000000-0000-0000-0000-000000010002', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e006', '00000000-0000-0000-0000-00000000f002', null,
 'Furnace Repair — Lee (no heat)', 'No heat, pilot will not stay lit', 'emergency', 'created', 'phone_ai',
 null, null, 90, 325.00, '{"street":"3900 Telephone Rd","city":"Houston","state":"TX","zip":"77023"}', ST_SetSRID(ST_MakePoint(-95.3170, 29.7150), 4326), null, null),
-- 3. scheduled tomorrow, Dave
('00000000-0000-0000-0000-000000010003', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000b001',
 'AC Tune-Up — Wilson', 'Membership seasonal tune-up', 'standard', 'scheduled', 'recurring',
 date_trunc('day', now()) + interval '1 day 9 hours', date_trunc('day', now()) + interval '1 day 10 hours', 60, 149.00,
 '{"street":"412 Heights Blvd","city":"Houston","state":"TX","zip":"77007"}', ST_SetSRID(ST_MakePoint(-95.3980, 29.7790), 4326), null, null),
-- 4. scheduled tomorrow, Sarah (panel upgrade)
('00000000-0000-0000-0000-000000010004', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000b003',
 'Panel Upgrade — Nguyen', '100A to 200A service upgrade, permit pulled', 'standard', 'scheduled', 'manual',
 date_trunc('day', now()) + interval '1 day 8 hours', date_trunc('day', now()) + interval '1 day 12 hours', 240, 1850.00,
 '{"street":"6500 Bellaire Blvd","city":"Houston","state":"TX","zip":"77074"}', ST_SetSRID(ST_MakePoint(-95.5050, 29.7050), 4326), null, null),
-- 5. scheduled today, Tony (drain)
('00000000-0000-0000-0000-000000010005', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e007', '00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000b005',
 'Drain Cleaning — Taylor', 'Kitchen line slow drain', 'standard', 'scheduled', 'manual',
 date_trunc('day', now()) + interval '15 hours', date_trunc('day', now()) + interval '15 hours 45 minutes', 45, 189.00,
 '{"street":"10200 Hammerly Blvd","city":"Houston","state":"TX","zip":"77080"}', ST_SetSRID(ST_MakePoint(-95.5360, 29.8090), 4326), null, null),
-- 6. dispatched today, Mike
('00000000-0000-0000-0000-000000010006', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000b002',
 'AC Tune-Up — Davis', 'Second-opinion tune-up', 'standard', 'dispatched', 'manual',
 date_trunc('day', now()) + interval '13 hours', date_trunc('day', now()) + interval '14 hours', 60, 149.00,
 '{"street":"1500 N Shepherd Dr","city":"Houston","state":"TX","zip":"77008"}', ST_SetSRID(ST_MakePoint(-95.4100, 29.8010), 4326), null, null),
-- 7. en_route today, Dave
('00000000-0000-0000-0000-000000010007', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e009', '00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000b001',
 'Furnace Repair — Harris', 'Intermittent ignition fault', 'urgent', 'en_route', 'manual',
 date_trunc('day', now()) + interval '11 hours', date_trunc('day', now()) + interval '12 hours 30 minutes', 90, 325.00,
 '{"street":"2300 Wirt Rd","city":"Houston","state":"TX","zip":"77055"}', ST_SetSRID(ST_MakePoint(-95.5060, 29.7920), 4326), null, null),
-- 8. arrived today, Carlos
('00000000-0000-0000-0000-000000010008', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e008', '00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000b004',
 'Drain Cleaning — White', 'Main line backup', 'urgent', 'arrived', 'manual',
 date_trunc('day', now()) + interval '10 hours', date_trunc('day', now()) + interval '10 hours 45 minutes', 45, 189.00,
 '{"street":"7700 Almeda Rd","city":"Houston","state":"TX","zip":"77054"}', ST_SetSRID(ST_MakePoint(-95.3870, 29.6900), 4326), null, null),
-- 9. in_progress today, Sarah
('00000000-0000-0000-0000-000000010009', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000b003',
 'Panel Upgrade — Brown', 'VIP — full panel replacement', 'standard', 'in_progress', 'manual',
 date_trunc('day', now()) + interval '8 hours', date_trunc('day', now()) + interval '12 hours', 240, 1850.00,
 '{"street":"8800 Kirby Dr","city":"Houston","state":"TX","zip":"77054"}', ST_SetSRID(ST_MakePoint(-95.4170, 29.6840), 4326),
 date_trunc('day', now()) + interval '8 hours 5 minutes', null),
-- 10. on_hold today, Tony (waiting on parts)
('00000000-0000-0000-0000-000000010010', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e010', '00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000b005',
 'Furnace Repair — Clark', 'Awaiting OEM inducer motor', 'standard', 'on_hold', 'manual',
 date_trunc('day', now()) + interval '9 hours', date_trunc('day', now()) + interval '10 hours 30 minutes', 90, 325.00,
 '{"street":"5300 Griggs Rd","city":"Houston","state":"TX","zip":"77021"}', ST_SetSRID(ST_MakePoint(-95.3360, 29.6960), 4326),
 date_trunc('day', now()) + interval '9 hours 10 minutes', null),
-- 11. completed yesterday, Dave
('00000000-0000-0000-0000-000000010011', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000b001',
 'AC Tune-Up — Wilson (prior)', 'Spring tune-up', 'standard', 'completed', 'recurring',
 date_trunc('day', now()) - interval '1 day' + interval '9 hours', date_trunc('day', now()) - interval '1 day' + interval '10 hours', 60, 149.00,
 '{"street":"412 Heights Blvd","city":"Houston","state":"TX","zip":"77007"}', ST_SetSRID(ST_MakePoint(-95.3980, 29.7790), 4326),
 date_trunc('day', now()) - interval '1 day' + interval '9 hours 2 minutes', date_trunc('day', now()) - interval '1 day' + interval '9 hours 55 minutes'),
-- 12. completed yesterday, Mike
('00000000-0000-0000-0000-000000010012', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000b002',
 'Furnace Repair — Davis (prior)', 'Flame sensor replacement', 'urgent', 'completed', 'manual',
 date_trunc('day', now()) - interval '1 day' + interval '13 hours', date_trunc('day', now()) - interval '1 day' + interval '14 hours 30 minutes', 90, 340.00,
 '{"street":"1500 N Shepherd Dr","city":"Houston","state":"TX","zip":"77008"}', ST_SetSRID(ST_MakePoint(-95.4100, 29.8010), 4326),
 date_trunc('day', now()) - interval '1 day' + interval '13 hours 8 minutes', date_trunc('day', now()) - interval '1 day' + interval '14 hours 20 minutes'),
-- 13. invoiced (2 days ago), Sarah
('00000000-0000-0000-0000-000000010013', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000b003',
 'Panel Upgrade — Nguyen (prior)', 'Subpanel add for shop', 'standard', 'invoiced', 'manual',
 date_trunc('day', now()) - interval '2 days' + interval '8 hours', date_trunc('day', now()) - interval '2 days' + interval '12 hours', 240, 1650.00,
 '{"street":"6500 Bellaire Blvd","city":"Houston","state":"TX","zip":"77074"}', ST_SetSRID(ST_MakePoint(-95.5050, 29.7050), 4326),
 date_trunc('day', now()) - interval '2 days' + interval '8 hours 4 minutes', date_trunc('day', now()) - interval '2 days' + interval '11 hours 50 minutes'),
-- 14. cancelled, Carlos
('00000000-0000-0000-0000-000000010014', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e008', '00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000b004',
 'Drain Cleaning — White (cancelled)', 'Customer resolved themselves', 'flexible', 'cancelled', 'manual',
 date_trunc('day', now()) + interval '2 days 14 hours', date_trunc('day', now()) + interval '2 days 14 hours 45 minutes', 45, 189.00,
 '{"street":"7700 Almeda Rd","city":"Houston","state":"TX","zip":"77054"}', ST_SetSRID(ST_MakePoint(-95.3870, 29.6900), 4326), null, null),
-- 15. scheduled day-after-tomorrow, Mike (flexible)
('00000000-0000-0000-0000-000000010015', '00000000-0000-0000-0000-0000000000d0', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000b002',
 'AC Tune-Up — Garcia (follow-up)', 'Recheck blower noise', 'flexible', 'scheduled', 'hermes',
 date_trunc('day', now()) + interval '2 days 10 hours', date_trunc('day', now()) + interval '2 days 11 hours', 60, 149.00,
 '{"street":"2200 Yale St","city":"Houston","state":"TX","zip":"77008"}', ST_SetSRID(ST_MakePoint(-95.3970, 29.7990), 4326), null, null);

-- ------------------------------------------------------------------
-- Current location cache for the techs who are actively working a job
-- (drives the dispatch-board map dots).
-- ------------------------------------------------------------------
insert into public.technician_current_location (technician_id, tenant_id, location, accuracy, speed, heading, current_job_id, status) values
('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-0000000000d0', ST_SetSRID(ST_MakePoint(-95.4600, 29.7950), 4326), 8.0, 13.4, 270, '00000000-0000-0000-0000-000000010007', 'driving'),
('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-0000000000d0', ST_SetSRID(ST_MakePoint(-95.4170, 29.6840), 4326), 6.0, 0.0,  0,   '00000000-0000-0000-0000-000000010009', 'on_job'),
('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-0000000000d0', ST_SetSRID(ST_MakePoint(-95.3870, 29.6900), 4326), 5.0, 0.0,  0,   '00000000-0000-0000-0000-000000010008', 'on_job');

commit;
