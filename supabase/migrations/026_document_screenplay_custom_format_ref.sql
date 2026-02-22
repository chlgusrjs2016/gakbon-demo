alter table public.document_screenplay_render_settings
  add column if not exists custom_format_id uuid null references public.user_screenplay_custom_formats(id) on delete set null;

create index if not exists idx_document_screenplay_render_settings_custom_format_id
  on public.document_screenplay_render_settings(custom_format_id);
