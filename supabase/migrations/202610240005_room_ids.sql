-- Migration 0005: Add room_ids support for Thompson Library and campus maps
begin;

-- 1. Add room_ids column to library_geofences if not present
alter table public.library_geofences
  add column if not exists room_ids text[] default '{}';

-- 2. Create dedicated public.room_ids table
create table if not exists public.room_ids (
  id text primary key,
  library_name text not null default 'Thompson Library',
  created_at timestamptz not null default now()
);

-- Grant read and write permissions to authenticated and anon
grant select on public.room_ids to anon, authenticated;
grant insert, update, delete on public.room_ids to authenticated;

-- RLS policies
alter table public.room_ids enable row level security;
drop policy if exists room_ids_public_read on public.room_ids;
create policy room_ids_public_read on public.room_ids for select to anon, authenticated using (true);
drop policy if exists room_ids_authenticated_write on public.room_ids;
create policy room_ids_authenticated_write on public.room_ids for all to authenticated using (true);

commit;
