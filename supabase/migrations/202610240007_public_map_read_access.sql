-- Migration 0007: Public read access for frontend map discovery
begin;

-- 1. Allow public/anon to read public student profiles
grant select on public.profiles to anon;
drop policy if exists profiles_anon_read on public.profiles;
create policy profiles_anon_read on public.profiles for select to anon using (true);

-- 2. Allow public/anon to read session private details (table IDs and locations)
grant select on public.session_private_details to anon;
drop policy if exists session_private_details_anon_read on public.session_private_details;
create policy session_private_details_anon_read on public.session_private_details for select to anon using (true);

-- 3. Allow public/anon to read shared notebooks
grant select on public.shared_notebooks to anon;
drop policy if exists shared_notebooks_anon_read on public.shared_notebooks;
create policy shared_notebooks_anon_read on public.shared_notebooks for select to anon using (true);

-- 4. Allow public/anon to read join_requests
grant select on public.join_requests to anon;
drop policy if exists join_requests_anon_read on public.join_requests;
create policy join_requests_anon_read on public.join_requests for select to anon using (true);

commit;
