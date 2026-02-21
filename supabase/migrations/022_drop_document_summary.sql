-- Remove documents.summary and related index.

drop index if exists public.idx_documents_project_deleted_summary;

alter table public.documents
drop column if exists summary;
