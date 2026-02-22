create table if not exists public.document_screenplay_render_settings (
  document_id uuid primary key references public.documents(id) on delete cascade,
  format_key text not null default 'us' check (format_key in ('us')),
  visual_overrides jsonb not null default '{}'::jsonb,
  break_policy_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_screenplay_render_settings_document
  on public.document_screenplay_render_settings(document_id);

alter table public.document_screenplay_render_settings enable row level security;

DROP POLICY IF EXISTS "Users can view own document screenplay render settings" ON public.document_screenplay_render_settings;
create policy "Users can view own document screenplay render settings"
  on public.document_screenplay_render_settings
  for select
  using (
    exists (
      select 1
      from public.documents d
      join public.projects p on p.id = d.project_id
      where d.id = document_screenplay_render_settings.document_id
        and p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own document screenplay render settings" ON public.document_screenplay_render_settings;
create policy "Users can insert own document screenplay render settings"
  on public.document_screenplay_render_settings
  for insert
  with check (
    exists (
      select 1
      from public.documents d
      join public.projects p on p.id = d.project_id
      where d.id = document_screenplay_render_settings.document_id
        and p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own document screenplay render settings" ON public.document_screenplay_render_settings;
create policy "Users can update own document screenplay render settings"
  on public.document_screenplay_render_settings
  for update
  using (
    exists (
      select 1
      from public.documents d
      join public.projects p on p.id = d.project_id
      where d.id = document_screenplay_render_settings.document_id
        and p.user_id = auth.uid()
    )
  );
