-- Workstream 1: Join Requests Self-Service & Host Review
-- Enables authenticated users to request seats and hosts to approve/decline

begin;

-- Grant permissions to authenticated users to insert and update join requests
grant insert, update on public.join_requests to authenticated;

-- RLS: users can create join requests for themselves
create policy join_requests_requester_insert on public.join_requests
  for insert to authenticated
  with check (requester_id = auth.uid());

-- RLS: session hosts can update request statuses (e.g. approve or reject)
create policy join_requests_host_update on public.join_requests
  for update to authenticated
  using (public.is_session_host(session_id))
  with check (public.is_session_host(session_id));

commit;
