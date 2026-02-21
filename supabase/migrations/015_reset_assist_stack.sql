-- Reset assist-related schema/data to start fresh

-- 1) Drop assist runtime tables
drop table if exists public.operation_runs cascade;
drop table if exists public.plan_runs cascade;
drop table if exists public.agent_configs cascade;
drop table if exists public.agent_runs cascade;
drop table if exists public.document_nodes cascade;
drop table if exists public.character_profiles cascade;
drop table if exists public.project_artifacts cascade;

-- 1-1) Drop assist-era indexes/constraints that may remain
drop index if exists public.idx_documents_project_type_deleted;

-- 2) Normalize documents metadata from previous assist experiments
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'document_type'
  ) then
    execute $sql$
      update public.documents
      set document_type = 'document'
      where document_type = 'plan'
    $sql$;

    execute $sql$
      alter table public.documents
      drop constraint if exists documents_document_type_check
    $sql$;

    execute $sql$
      alter table public.documents
      add constraint documents_document_type_check
      check (document_type in ('screenplay', 'document'))
    $sql$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'role'
  ) then
    execute $sql$
      update public.documents
      set role = 'note'
      where role = 'plan'
    $sql$;

    execute $sql$
      alter table public.documents
      drop constraint if exists documents_role_check
    $sql$;

    execute $sql$
      alter table public.documents
      add constraint documents_role_check
      check (role in ('script', 'spec', 'note', 'research'))
    $sql$;
  end if;
end
$$;
