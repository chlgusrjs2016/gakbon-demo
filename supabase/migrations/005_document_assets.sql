-- Document editor assets (images)

create table if not exists public.document_assets (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null,
  url text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_document_assets_document_id
on public.document_assets(document_id);

create index if not exists idx_document_assets_project_id
on public.document_assets(project_id);

alter table public.document_assets enable row level security;

drop policy if exists "Users can view own document assets" on public.document_assets;
create policy "Users can view own document assets"
  on public.document_assets for select
  using (
    exists (
      select 1
      from public.projects
      where projects.id = document_assets.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own document assets" on public.document_assets;
create policy "Users can create own document assets"
  on public.document_assets for insert
  with check (
    exists (
      select 1
      from public.projects
      where projects.id = document_assets.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own document assets" on public.document_assets;
create policy "Users can delete own document assets"
  on public.document_assets for delete
  using (
    exists (
      select 1
      from public.projects
      where projects.id = document_assets.project_id
        and projects.user_id = auth.uid()
    )
  );

-- Storage bucket for document images
insert into storage.buckets (id, name, public)
values ('document-assets', 'document-assets', true)
on conflict (id) do nothing;

-- Storage object policies: path must begin with project_id uuid
drop policy if exists "Users can read own project document assets" on storage.objects;
create policy "Users can read own project document assets"
  on storage.objects for select
  using (
    bucket_id = 'document-assets'
    and exists (
      select 1
      from public.projects
      where projects.id = (
        case
          when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then split_part(name, '/', 1)::uuid
          else null
        end
      )
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own project document assets" on storage.objects;
create policy "Users can insert own project document assets"
  on storage.objects for insert
  with check (
    bucket_id = 'document-assets'
    and exists (
      select 1
      from public.projects
      where projects.id = (
        case
          when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then split_part(name, '/', 1)::uuid
          else null
        end
      )
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own project document assets" on storage.objects;
create policy "Users can update own project document assets"
  on storage.objects for update
  using (
    bucket_id = 'document-assets'
    and exists (
      select 1
      from public.projects
      where projects.id = (
        case
          when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then split_part(name, '/', 1)::uuid
          else null
        end
      )
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own project document assets" on storage.objects;
create policy "Users can delete own project document assets"
  on storage.objects for delete
  using (
    bucket_id = 'document-assets'
    and exists (
      select 1
      from public.projects
      where projects.id = (
        case
          when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then split_part(name, '/', 1)::uuid
          else null
        end
      )
        and projects.user_id = auth.uid()
    )
  );
