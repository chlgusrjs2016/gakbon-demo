-- Remove Assist v3 runtime schema

drop table if exists public.assist_operation_runs cascade;
drop table if exists public.assist_chat_runs cascade;
drop table if exists public.project_assist_settings cascade;
