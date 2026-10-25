-- Migration 0009: Allow public/anon to read active table check-ins
begin;

grant select on public.check_ins to anon;
drop policy if exists check_ins_anon_read on public.check_ins;
create policy check_ins_anon_read on public.check_ins for select to anon using (true);

commit;
