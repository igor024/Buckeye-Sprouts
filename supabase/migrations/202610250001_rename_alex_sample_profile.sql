-- Preserve the sample's Auth UUID, login email, password, and membership references.
update public.profiles
set name = 'Alex Rabochii'
where name = 'Alex Morgan'
  and (id = '11111111-1111-4111-8111-111111111111'::uuid
    or id in (select id from auth.users where lower(email) = 'alex.morgan@osu.edu'));

update auth.users
set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{name}', '"Alex Rabochii"'::jsonb)
where lower(email) = 'alex.morgan@osu.edu'
  and raw_user_meta_data ->> 'name' = 'Alex Morgan';
