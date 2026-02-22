create table if not exists public.user_screenplay_custom_formats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  base_format_key text not null check (base_format_key in ('us')),
  paper_preset_key text not null check (paper_preset_key in ('a4','us_letter')),
  font_coverage jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create index if not exists idx_user_screenplay_custom_formats_user_id
  on public.user_screenplay_custom_formats(user_id);

alter table public.user_screenplay_custom_formats enable row level security;

drop policy if exists "Users can view own screenplay custom formats" on public.user_screenplay_custom_formats;
create policy "Users can view own screenplay custom formats"
  on public.user_screenplay_custom_formats for select
  using (user_id = auth.uid());

drop policy if exists "Users can insert own screenplay custom formats" on public.user_screenplay_custom_formats;
create policy "Users can insert own screenplay custom formats"
  on public.user_screenplay_custom_formats for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update own screenplay custom formats" on public.user_screenplay_custom_formats;
create policy "Users can update own screenplay custom formats"
  on public.user_screenplay_custom_formats for update
  using (user_id = auth.uid());

drop policy if exists "Users can delete own screenplay custom formats" on public.user_screenplay_custom_formats;
create policy "Users can delete own screenplay custom formats"
  on public.user_screenplay_custom_formats for delete
  using (user_id = auth.uid());
