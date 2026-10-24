-- Migration 0006: Table QR Routing & Fast Table Lookup
begin;

-- 1. Index table_id in session_private_details
create index if not exists idx_session_private_details_table_id 
  on public.session_private_details(lower(table_id));

-- 2. Add active_session_id to public.room_ids for fast direct lookup
alter table public.room_ids
  add column if not exists active_session_id uuid references public.study_sessions(id) on delete set null;

create index if not exists idx_room_ids_active_session
  on public.room_ids(active_session_id);

-- 3. Security definer function to lookup active study session by table ID
-- This allows anyone scanning a physical table QR to know if an active session exists
create or replace function public.lookup_active_session_by_table(
  p_table_id text,
  p_library_name text default 'Thompson Library'
)
returns table (
  session_id uuid,
  title text,
  subtitle text,
  course_code text,
  library_name text,
  floor text,
  zone text,
  total_seats integer,
  available_seats integer,
  requires_approval boolean,
  status text,
  created_at timestamptz,
  host_name text
)
language sql
security definer
set search_path = public
as $$
  select 
    s.id as session_id,
    s.title,
    s.subtitle,
    s.course_code,
    s.library_name,
    s.floor,
    s.zone,
    s.total_seats,
    s.available_seats,
    s.requires_approval,
    s.status,
    s.created_at,
    p.name as host_name
  from public.session_private_details spd
  inner join public.study_sessions s on s.id = spd.session_id
  left join public.profiles p on p.id = s.host_id
  where lower(spd.table_id) = lower(trim(p_table_id))
    and s.status = 'active'
    and (p_library_name is null or lower(s.library_name) = lower(trim(p_library_name)))
  order by s.created_at desc
  limit 1;
$$;

grant execute on function public.lookup_active_session_by_table to anon, authenticated;

commit;
