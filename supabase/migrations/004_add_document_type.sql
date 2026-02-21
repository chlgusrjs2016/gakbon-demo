-- documents: screenplay / document 타입 구분

alter table public.documents
add column if not exists document_type text;

update public.documents
set document_type = 'screenplay'
where document_type is null;

alter table public.documents
alter column document_type set default 'screenplay';

alter table public.documents
alter column document_type set not null;

alter table public.documents
drop constraint if exists documents_document_type_check;

alter table public.documents
add constraint documents_document_type_check
check (document_type in ('screenplay', 'document'));

create index if not exists idx_documents_project_type_order
on public.documents(project_id, document_type, sort_order);
