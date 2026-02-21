alter table public.document_folders
add column if not exists parent_folder_id uuid null references public.document_folders(id) on delete set null;

create index if not exists idx_document_folders_project_parent_order
on public.document_folders(project_id, parent_folder_id, sort_order);
