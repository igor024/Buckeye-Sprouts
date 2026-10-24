-- Workstream 2: Sessions Creation & Discovery
-- Enables authenticated users to create and manage their study sessions in Supabase

begin;

-- Grant write permissions on study_sessions and session_private_details to authenticated
grant insert, update on public.study_sessions to authenticated;
grant insert, update on public.session_private_details to authenticated;

-- RLS: hosts can insert their own study sessions
create policy sessions_host_insert on public.study_sessions
  for insert to authenticated
  with check (host_id = auth.uid());

-- RLS: hosts can update their own study sessions (e.g. close session or update seats)
create policy sessions_host_update on public.study_sessions
  for update to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- RLS: hosts can insert private details for their own session
create policy private_details_host_insert on public.session_private_details
  for insert to authenticated
  with check (
    exists (
      select 1 from public.study_sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

-- RLS: hosts can update private details for their own session
create policy private_details_host_update on public.session_private_details
  for update to authenticated
  using (
    exists (
      select 1 from public.study_sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

commit;
