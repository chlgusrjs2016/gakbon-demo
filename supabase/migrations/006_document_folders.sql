-- Document folders

create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_folders enable row level security;

drop policy if exists "Users can view own document folders" on public.document_folders;
create policy "Users can view own document folders"
  on public.document_folders for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = document_folders.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create own document folders" on public.document_folders;
create policy "Users can create own document folders"
  on public.document_folders for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = document_folders.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update own document folders" on public.document_folders;
create policy "Users can update own document folders"
  on public.document_folders for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = document_folders.project_id
        and projects.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own document folders" on public.document_folders;
create policy "Users can delete own document folders"
  on public.document_folders for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = document_folders.project_id
        and projects.user_id = auth.uid()
    )
  );

create index if not exists idx_document_folders_project_order
on public.document_folders(project_id, sort_order);

alter table public.documents
add column if not exists folder_id uuid references public.document_folders(id) on delete set null;

create index if not exists idx_documents_project_folder_order
on public.documents(project_id, folder_id, sort_order);

drop trigger if exists on_document_folders_updated on public.document_folders;
create trigger on_document_folders_updated
  before update on public.document_folders
  for each row execute function public.handle_updated_at();
