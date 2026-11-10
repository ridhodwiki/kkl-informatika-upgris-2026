-- Run in a test project after the migration. Test rows are rolled back.
begin;
set local role anon;
select id from public.kkl_public_feedback limit 0;
insert into public.kkl_public_feedback (name,rating,message) values ('RLS test',5,'Temporary validation');
do $$
begin
  begin
    insert into public.kkl_public_feedback (name,rating,message) values ('   ',5,'Invalid name');
    raise exception 'Whitespace was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.kkl_public_feedback (name,rating,message) values ('Test',6,'Invalid rating');
    raise exception 'Invalid rating was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.kkl_public_feedback (id,name,rating,message) values (gen_random_uuid(),'Test',5,'Forged id');
    raise exception 'Client supplied id was accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.kkl_public_feedback (name,rating,message,created_at) values ('Test',5,'Forged time',now());
    raise exception 'Client supplied timestamp was accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.kkl_public_feedback set message='Forbidden' where false;
    raise exception 'Update was permitted';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.kkl_public_feedback where false;
    raise exception 'Delete was permitted';
  exception when insufficient_privilege then null; end;
  if has_table_privilege(current_user,'public.kkl_public_feedback','UPDATE')
    or has_table_privilege(current_user,'public.kkl_public_feedback','DELETE')
    or has_table_privilege(current_user,'public.kkl_public_feedback','TRUNCATE') then
    raise exception 'Unexpected mutation privileges';
  end if;
end $$;
reset role;
set local role authenticated;
select id from public.kkl_public_feedback limit 0;
insert into public.kkl_public_feedback (name,rating,message) values ('Authenticated test',4,'Temporary validation');
do $$ begin
  if has_table_privilege(current_user,'public.kkl_public_feedback','UPDATE')
    or has_table_privilege(current_user,'public.kkl_public_feedback','DELETE')
    or has_table_privilege(current_user,'public.kkl_public_feedback','TRUNCATE') then
    raise exception 'Unexpected authenticated mutation privileges';
  end if;
end $$;
rollback;
