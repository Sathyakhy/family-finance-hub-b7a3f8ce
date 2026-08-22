-- Resolve a login email from a username ONLY when the password is correct.
-- Prevents email enumeration and removes the need for a service-role key.
create or replace function public.email_for_login(_username text, _password text)
returns text
language plpgsql
stable
security definer
set search_path = public, auth, extensions
as $$
declare
  _email text;
begin
  select u.email into _email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = lower(trim(_username))
    and u.encrypted_password = extensions.crypt(_password, u.encrypted_password);

  return _email;
end;
$$;

revoke all on function public.email_for_login(text, text) from public;
grant execute on function public.email_for_login(text, text) to anon, authenticated;
