-- Repeatable startup reset for the physical BuckID demo table only.
do $$
declare
  ethan_id uuid;
  target_id uuid;
  affected_ids uuid[];
begin
  -- Serialize simultaneous deployment/startup resets.
  perform pg_advisory_xact_lock(hashtext('buckeye-sprouts:110-1'));

  if (select count(*) from public.profiles where lower(trim(name)) = 'ethan dong') > 1 then
    raise exception 'Multiple Ethan Dong profiles found; resolve the duplicate profiles before startup';
  end if;
  select id into ethan_id from public.profiles where lower(trim(name)) = 'ethan dong';
  if ethan_id is null then
    ethan_id := gen_random_uuid();
    -- A separate demo identity, with no email, password, or login credentials.
    -- Never rename or take over an existing student's authenticated account.
    insert into auth.users (id, aud, role, raw_app_meta_data, raw_user_meta_data)
    values (ethan_id, 'authenticated', 'authenticated', '{}'::jsonb,
      '{"name":"Ethan Dong","major":"Computer Science & Engineering","current_courses":["CSE 2221"]}'::jsonb);
    insert into public.profiles (id, name, major, current_courses, bio)
    values (ethan_id, 'Ethan Dong', 'Computer Science & Engineering', array['CSE 2221'], 'Reviewing recursion. Pull up a chair!')
    on conflict (id) do nothing;
  end if;

  -- Match both the direct anchor and the private location used by QR lookup.
  select array_agg(s.id) into affected_ids
  from public.study_sessions s
  left join public.session_private_details d on d.session_id = s.id
  where s.library_name = 'Thompson Library'
    and (s.table_id = '110-1' or d.table_id = '110-1')
    and s.status = 'active';

  select id into target_id from public.study_sessions
  where id = any(affected_ids)
  order by created_at desc, id limit 1 for update;

  if target_id is null then
    insert into public.study_sessions (
      host_id, title, subtitle, course_code, library_name, floor, zone,
      table_id, total_seats, available_seats, requires_approval, status, ai_topic_tags
    ) values (
      ethan_id, 'Ethan''s Group', 'Recursion and software components', 'CSE 2221',
      'Thompson Library', 'Level 1', 'Table 110-1', '110-1', 5, 4, false, 'active', array['Recursion']
    ) returning id into target_id;
  end if;
  affected_ids := array_append(coalesce(affected_ids, '{}'::uuid[]), target_id);

  -- Remove duplicate active groups so the map and QR lookup agree.
  update public.study_sessions set status = 'closed'
  where id = any(affected_ids) and id <> target_id;

  update public.check_ins set checked_out_at = greatest(now(), checked_in_at)
  where session_id = any(affected_ids) and checked_out_at is null
    and (session_id <> target_id or user_id <> ethan_id);

  -- Both approvals and check-ins contribute to the displayed roster.
  update public.join_requests set status = 'rejected'
  where session_id = any(affected_ids)
    and (session_id <> target_id or requester_id <> ethan_id)
    and status in ('pending', 'approved');

  insert into public.join_requests (session_id, requester_id, status)
  values (target_id, ethan_id, 'approved')
  on conflict (session_id, requester_id) do update set status = 'approved';

  insert into public.check_ins (session_id, user_id, method)
  select target_id, ethan_id, 'table_qr'
  where not exists (
    select 1 from public.check_ins
    where session_id = target_id and user_id = ethan_id and checked_out_at is null
  );

  update public.study_sessions set host_id = ethan_id, title = 'Ethan''s Group',
    table_id = '110-1', available_seats = total_seats - 1
  where id = target_id;

  insert into public.session_private_details (session_id, table_id, gps_lat, gps_lng)
  values (target_id, '110-1', 40.0001, -83.0146)
  on conflict (session_id) do update set table_id = excluded.table_id;

  insert into public.room_ids (id, library_name, active_session_id)
  values ('110-1', 'Thompson Library', target_id)
  on conflict (id) do update set active_session_id = excluded.active_session_id;

  insert into public.shared_notebooks (session_id, content, last_updated_by)
  values (target_id, '## CSE 2221 study notes' || chr(10) || '[note] Ethan Dong · Shared' || chr(10) || 'Recursion and software components.', ethan_id)
  on conflict (session_id) do nothing;
end $$;
