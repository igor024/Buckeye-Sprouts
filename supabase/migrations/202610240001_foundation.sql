-- Buckeye Sprouts foundation. Run against a Supabase project, not plain PostgreSQL.
-- The scaffold does not apply this migration or create real user accounts.
-- Snake-case database rows map to the camel-case contracts in feature adapters.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  avatar_url text not null default '',
  major text not null default '',
  current_courses text[] not null default '{}',
  bio text not null default '',
  created_at timestamptz not null default now()
);

-- Identity data has no browser grants. Hash and verify on a trusted backend only.
-- Never persist raw BuckID scans. UserProfile is an internal domain type.
create table public.profile_identities (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  buck_id_hash text not null unique,
  verified_at timestamptz not null default now()
);

-- Discovery-safe fields only: table, GPS, and photo live in a separate RLS table.
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 160),
  subtitle text not null default '',
  course_code text not null,
  library_name text not null,
  floor text,
  zone text,
  total_seats integer not null check (total_seats > 0),
  available_seats integer not null check (available_seats >= 0 and available_seats <= total_seats),
  requires_approval boolean not null default true,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'closed')),
  scheduled_for timestamptz,
  ai_topic_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (status <> 'scheduled' or scheduled_for is not null)
);

create table public.session_private_details (
  session_id uuid primary key references public.study_sessions(id) on delete cascade,
  table_id text not null,
  -- Store a private Storage path. Produce short-lived signed URLs after authorization.
  surroundings_photo_path text not null default '',
  gps_lat double precision not null check (gps_lat between -90 and 90),
  gps_lng double precision not null check (gps_lng between -180 and 180)
);

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  unique (session_id, requester_id)
);

-- Approved join requests are the membership source of truth (host is implicit).
-- Future approval RPC must atomically reserve seats and enforce capacity.
create table public.shared_notebooks (
  session_id uuid primary key references public.study_sessions(id) on delete cascade,
  content text not null default '',
  last_updated_by uuid not null references public.profiles(id),
  ai_summary text not null default '',
  ai_suggestions text[] not null default '{}',
  updated_at timestamptz not null default now(),
  revision bigint not null default 0 check (revision >= 0)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  method text not null check (method in ('table_qr', 'buck_id')),
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);

create table public.library_geofences (
  library_name text primary key,
  center_lat double precision not null check (center_lat between -90 and 90),
  center_lng double precision not null check (center_lng between -180 and 180),
  radius_meters double precision not null check (radius_meters > 0)
);

create table public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  library_name text not null,
  room_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unavailable', 'cancelled')),
  provider_booking_id text unique,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index study_sessions_discovery_idx on public.study_sessions(status, course_code, library_name);
create index join_requests_review_idx on public.join_requests(session_id, status);
create index join_requests_requester_idx on public.join_requests(requester_id);
create index study_sessions_host_idx on public.study_sessions(host_id);
create unique index check_ins_one_active_idx on public.check_ins(session_id, user_id) where checked_out_at is null;

-- Definer helpers avoid recursive join-request RLS. Search paths are fixed and
-- only booleans are exposed; no user-supplied identity is accepted.
create function public.is_session_host(target_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.study_sessions s
    where s.id = target_session_id and s.host_id = (select auth.uid())
  );
$$;

create function public.can_access_session(target_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_session_host(target_session_id) or exists (
    select 1 from public.join_requests r
    where r.session_id = target_session_id
      and r.requester_id = (select auth.uid()) and r.status = 'approved'
  );
$$;

revoke all on function public.is_session_host(uuid) from public;
revoke all on function public.can_access_session(uuid) from public;
grant execute on function public.is_session_host(uuid), public.can_access_session(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.profile_identities enable row level security;
alter table public.study_sessions enable row level security;
alter table public.session_private_details enable row level security;
alter table public.join_requests enable row level security;
alter table public.shared_notebooks enable row level security;
alter table public.check_ins enable row level security;
alter table public.library_geofences enable row level security;
alter table public.room_bookings enable row level security;

-- Start with explicit read grants. Production writes are intentionally withheld
-- until the corresponding workstream implements validation and transactional RPCs.
revoke all on public.profiles, public.profile_identities, public.study_sessions,
  public.session_private_details, public.join_requests, public.shared_notebooks,
  public.check_ins, public.library_geofences, public.room_bookings from anon, authenticated;
grant select on public.study_sessions, public.library_geofences to anon, authenticated;
grant select on public.profiles, public.session_private_details, public.join_requests,
  public.shared_notebooks, public.check_ins, public.room_bookings to authenticated;

create policy profiles_authenticated_read on public.profiles for select to authenticated using (true);
create policy sessions_discovery_read on public.study_sessions for select to anon, authenticated
  using (status <> 'closed' or public.can_access_session(id));
create policy private_location_members_read on public.session_private_details for select to authenticated
  using (public.can_access_session(session_id));
create policy join_requests_involved_read on public.join_requests for select to authenticated
  using (requester_id = (select auth.uid()) or public.is_session_host(session_id));
create policy notebooks_members_read on public.shared_notebooks for select to authenticated
  using (public.can_access_session(session_id));
create policy check_ins_involved_read on public.check_ins for select to authenticated
  using (user_id = (select auth.uid()) or public.is_session_host(session_id));
create policy geofences_public_read on public.library_geofences for select to anon, authenticated using (true);
create policy room_bookings_host_read on public.room_bookings for select to authenticated
  using (public.is_session_host(session_id));

insert into public.library_geofences (library_name, center_lat, center_lng, radius_meters) values
  ('Thompson Library', 40.0001, -83.0146, 100),
  ('18th Avenue Library', 40.0025, -83.0092, 85);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('surroundings', 'surroundings', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy surroundings_approved_read on storage.objects for select to authenticated using (
  bucket_id = 'surroundings' and exists (
    select 1 from public.session_private_details d
    where d.surroundings_photo_path = name and public.can_access_session(d.session_id)
  )
);
-- No Storage upload policy yet. Add host-only path ownership checks with uploads.

-- Use private channels named notebook:<session UUID>. Disable "Allow public
-- access" in Supabase Realtime settings before wiring browser subscriptions.
create policy notebook_realtime_receive on realtime.messages for select to authenticated using (
  extension in ('broadcast', 'presence') and exists (
    select 1 from public.shared_notebooks n
    where realtime.topic() = 'notebook:' || n.session_id::text
      and public.can_access_session(n.session_id)
  )
);
create policy notebook_realtime_send on realtime.messages for insert to authenticated with check (
  extension in ('broadcast', 'presence') and exists (
    select 1 from public.shared_notebooks n
    where realtime.topic() = 'notebook:' || n.session_id::text
      and public.can_access_session(n.session_id)
  )
);

comment on table public.profile_identities is 'Backend only. No raw BuckID storage and no browser read/write grants.';
comment on table public.session_private_details is 'Exact location and private photo paths, protected by approved membership.';
comment on table public.shared_notebooks is 'Persisted snapshots; Broadcast/Presence transport and conflict resolution are workstream 4.';

commit;
