-- Expand builtin screenplay format keys to include KR

alter table public.document_screenplay_render_settings
  drop constraint if exists document_screenplay_render_settings_format_key_check;

alter table public.document_screenplay_render_settings
  add constraint document_screenplay_render_settings_format_key_check
  check (format_key in ('us', 'kr'));

alter table public.user_screenplay_custom_formats
  drop constraint if exists user_screenplay_custom_formats_base_format_key_check;

alter table public.user_screenplay_custom_formats
  add constraint user_screenplay_custom_formats_base_format_key_check
  check (base_format_key in ('us', 'kr'));
