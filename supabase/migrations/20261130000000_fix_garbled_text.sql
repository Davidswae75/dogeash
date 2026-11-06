-- Repair text garbled on its way into the SQL Editor.
-- Migrations and the seed were copied to the clipboard by a tool that read UTF-8 as Mac Roman, so every
-- character outside plain ASCII (dashes, the middle dot, the naira sign, curly quotes...) arrived as two or
-- three wrong characters. This puts them back:
--   1. fix_garbled_text(): turns each garbled sequence back into its character (only those; nothing else changes)
--   2. every text and jsonb column in the public tables, wherever a garbled sequence appears
--   3. every function whose code holds one (notification texts, admin labels and search), re-created repaired
-- Safe to run more than once. Written in plain ASCII (characters as U& escapes) so it can't be garbled itself.

create or replace function public.fix_garbled_text(t text)
returns text language sql immutable set search_path = ''
as $fn$
  select replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(t, U&'\201A\00C4\00EC', U&'\2013'), U&'\201A\00C4\00EE', U&'\2014'), U&'\201A\00C4\00F2', U&'\2018'), U&'\201A\00C4\00F4', U&'\2019'), U&'\201A\00C4\00FA', U&'\201C'), U&'\201A\00C4\00F9', U&'\201D'), U&'\201A\00C4\00A2', U&'\2022'), U&'\201A\00C4\00B6', U&'\2026'), U&'\201A\00C7\00B6', U&'\20A6'), U&'\201A\00DC\00EA', U&'\2190'), U&'\201A\00DC\00ED', U&'\2192'), U&'\201A\00E2\00E0', U&'\2248'), U&'\201A\00EE\00C4', U&'\2500'), U&'\201A\00FA\00EC', U&'\2713'), U&'\00AC\221E', U&'\00B0'), U&'\00AC\2211', U&'\00B7'), U&'\00AC\03A9', U&'\00BD'), U&'\221A\00F3', U&'\00D7'), U&'\221A\00A9', U&'\00E9'), U&'\221A\2211', U&'\00F7')
$fn$;
revoke execute on function public.fix_garbled_text(text) from public, anon, authenticated;

do $repair$
declare
  col record;
  fn record;
begin
  -- 2. Data: text and jsonb columns of every table in public
  for col in
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.data_type in ('text', 'jsonb', 'character varying')
  loop
    if col.data_type = 'jsonb' then
      execute format('update public.%I set %I = public.fix_garbled_text(%I::text)::jsonb where %I::text <> public.fix_garbled_text(%I::text)',
        col.table_name, col.column_name, col.column_name, col.column_name, col.column_name);
    else
      execute format('update public.%I set %I = public.fix_garbled_text(%I) where %I <> public.fix_garbled_text(%I)',
        col.table_name, col.column_name, col.column_name, col.column_name, col.column_name);
    end if;
  end loop;

  -- 3. Code: functions in public whose body holds a garbled sequence
  for fn in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and p.proname <> 'fix_garbled_text'
      and p.prosrc <> public.fix_garbled_text(p.prosrc)
  loop
    execute public.fix_garbled_text(pg_get_functiondef(fn.oid));
  end loop;
end
$repair$;
