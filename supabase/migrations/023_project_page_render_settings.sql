create table if not exists public.project_page_render_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  screenplay_page_size text not null default 'a4'
    check (screenplay_page_size in ('a4', 'us_letter')),
  screenplay_margins jsonb not null default '{"top":96,"bottom":96,"left":96,"right":96}'::jsonb,
  node_break_policies jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_render_settings_project
  on public.project_page_render_settings(project_id);

alter table public.project_page_render_settings enable row level security;

drop policy if exists "Users can view own page render settings" on public.project_page_render_settings;
create policy "Users can view own page render settings"
  on public.project_page_render_settings
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_page_render_settings.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own page render settings" on public.project_page_render_settings;
create policy "Users can insert own page render settings"
  on public.project_page_render_settings
  for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_page_render_settings.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own page render settings" on public.project_page_render_settings;
create policy "Users can update own page render settings"
  on public.project_page_render_settings
  for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_page_render_settings.project_id
        and projects.user_id = auth.uid()
    )
  );
