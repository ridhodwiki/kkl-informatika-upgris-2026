begin;
create table public.kkl_public_feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) <= 100 and name ~ '[^[:space:]]'),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(message) <= 1000 and message ~ '[^[:space:]]'),
  created_at timestamptz not null default statement_timestamp()
);
create index kkl_public_feedback_latest on public.kkl_public_feedback (created_at desc, id desc);
alter table public.kkl_public_feedback enable row level security;
revoke all on public.kkl_public_feedback from public, anon, authenticated;
grant select on public.kkl_public_feedback to anon, authenticated;
grant insert (name, rating, message) on public.kkl_public_feedback to anon, authenticated;
create policy kkl_feedback_read on public.kkl_public_feedback for select to anon, authenticated using (true);
create policy kkl_feedback_submit on public.kkl_public_feedback for insert to anon, authenticated with check (true);
commit;
