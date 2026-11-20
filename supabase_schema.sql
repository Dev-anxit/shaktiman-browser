create table if not exists public.user_credits (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  credits integer not null default 100 check (credits >= 0),
  is_pro boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users can view own credits"
  on public.user_credits
  for select
  to authenticated
  using (auth.uid() = id);

create or replace function public.consume_shaktiman_credit()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_current_credits integer;
  v_new_credits integer;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  select credits into v_current_credits
  from public.user_credits
  where id = v_uid
  for update;

  if not found then
    raise exception 'User credit ledger not found';
  end if;

  if v_current_credits <= 0 then
    raise exception 'Insufficient credits: Shaktiman AI energy exhausted';
  end if;

  update public.user_credits
  set credits = credits - 1,
      updated_at = now()
  where id = v_uid
  returning credits into v_new_credits;

  return v_new_credits;
end;
$$;

create or replace function public.topup_shaktiman_credit(p_amount integer default 500)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_new_credits integer;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  update public.user_credits
  set credits = credits + p_amount,
      updated_at = now()
  where id = v_uid
  returning credits into v_new_credits;

  if not found then
    raise exception 'User credit ledger not found';
  end if;

  return v_new_credits;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_credits (id, email, credits, is_pro)
  values (
    new.id,
    new.email,
    100,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
