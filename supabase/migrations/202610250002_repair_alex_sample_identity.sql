-- Repair the account itself even if its old name is Ethan, rather than Alex Morgan.
-- The authenticated account UUID, email, password, and membership references stay intact.
begin;

insert into public.profiles (id, name, avatar_url, major, current_courses, bio)
select id, 'Alex Rabochii', '', 'Computer Science & Engineering',
  array['CSE 2221', 'MATH 1151'], 'Working through software components, one coffee at a time.'
from auth.users where lower(email) = 'alex.morgan@osu.edu'
on conflict (id) do update set
  name = excluded.name, avatar_url = excluded.avatar_url, major = excluded.major,
  current_courses = excluded.current_courses, bio = excluded.bio;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'name', 'Alex Rabochii', 'avatar_url', '', 'major', 'Computer Science & Engineering',
  'current_courses', jsonb_build_array('CSE 2221', 'MATH 1151'),
  'bio', 'Working through software components, one coffee at a time.'
)
where lower(email) = 'alex.morgan@osu.edu';

commit;
