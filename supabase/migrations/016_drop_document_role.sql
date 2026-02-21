-- Remove documents.role

drop index if exists public.idx_documents_project_role_deleted;

alter table public.documents
drop constraint if exists documents_role_check;

alter table public.documents
drop column if exists role;
