alter table public.projects
add column if not exists deleted_at timestamptz null;

create index if not exists idx_projects_user_deleted_updated
on public.projects(user_id, deleted_at, updated_at desc);
