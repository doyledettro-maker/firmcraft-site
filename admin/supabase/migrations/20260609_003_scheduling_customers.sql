-- Scheduling & Dispatch (Phase 2.1, Sprint 1) — customers + equipment
--
-- Tables: customers (with PostGIS point for geo queries), equipment (at customer
-- locations). Schemas follow architecture doc §2.1 exactly.

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table if not exists public.customers (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    name            text not null,
    email           text,
    phone           text,
    address         jsonb,                             -- {street, city, state, zip, lat, lng}
    location        geometry(point, 4326),             -- PostGIS point for geo queries
    preferred_tech_id uuid references public.technicians(id),
    communication_preference text default 'sms',       -- "sms", "email", "phone", "none"
    tags            text[] default '{}',                -- "membership", "vip", "commercial"
    notes           text,
    no_show_count   integer not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz
);

create index if not exists idx_customers_tenant on public.customers(tenant_id);
create index if not exists idx_customers_phone on public.customers(tenant_id, phone);
create index if not exists idx_customers_location on public.customers using gist(location);

-- ============================================================
-- EQUIPMENT (at customer locations)
-- ============================================================

create table if not exists public.equipment (
    id              uuid primary key default gen_random_uuid(),
    tenant_id       uuid not null references public.tenants(id),
    customer_id     uuid not null references public.customers(id) on delete cascade,
    type            text not null,                     -- "furnace", "ac_unit", "water_heater", "panel"
    brand           text,
    model           text,
    serial_number   text,
    install_date    date,
    warranty_expires date,
    location_notes  text,                              -- "basement, left side", "rooftop unit #2"
    last_serviced   date,
    notes           text,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_equipment_customer on public.equipment(customer_id);
create index if not exists idx_equipment_tenant on public.equipment(tenant_id);
create index if not exists idx_equipment_warranty on public.equipment(warranty_expires) where warranty_expires is not null;
