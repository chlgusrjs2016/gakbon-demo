-- Soft delete support for documents/folders (Trash)

alter table public.documents
add column if not exists deleted_at timestamptz null;

alter table public.documents
add column if not exists original_folder_id uuid null references public.document_folders(id) on delete set null;

alter table public.document_folders
add column if not exists deleted_at timestamptz null;

create index if not exists idx_documents_project_deleted
on public.documents(project_id, deleted_at, sort_order);

create index if not exists idx_document_folders_project_deleted
on public.document_folders(project_id, deleted_at, sort_order);
