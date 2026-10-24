-- Workstream 1: Profiles & Auth Self-Management
-- Enables users to create and edit their own profiles in Supabase

begin;

-- Grant permissions to authenticated users to insert and update their own profile
grant insert, update on public.profiles to authenticated;

-- RLS policies: users can insert and update only their own profile
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Automatic profile creation on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url, major, current_courses, bio)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(nullif(new.raw_user_meta_data->>'major', ''), 'Computer Science & Engineering'),
    coalesce(
      case
        when new.raw_user_meta_data ? 'current_courses' then
          array(select jsonb_array_elements_text(new.raw_user_meta_data->'current_courses'))
        else array['CSE 2221']
      end,
      array['CSE 2221']
    ),
    coalesce(nullif(new.raw_user_meta_data->>'bio', ''), 'Buckeye studier')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute after signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

commit;
