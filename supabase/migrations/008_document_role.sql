-- Document role metadata

alter table public.documents
add column if not exists role text;

update public.documents
set role = case
  when document_type = 'screenplay' then 'script'
  else 'note'
end
where role is null;

alter table public.documents
alter column role set default 'note';

alter table public.documents
alter column role set not null;

alter table public.documents
drop constraint if exists documents_role_check;

alter table public.documents
add constraint documents_role_check
check (role in ('script', 'plan', 'spec', 'note', 'research'));

create index if not exists idx_documents_project_role_deleted
on public.documents(project_id, role, deleted_at);
