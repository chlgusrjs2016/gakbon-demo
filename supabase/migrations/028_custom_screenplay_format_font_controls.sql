alter table public.user_screenplay_custom_formats
  add column if not exists base_font_size int not null default 16;

alter table public.user_screenplay_custom_formats
  add column if not exists node_font_coverage_overrides jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_screenplay_custom_formats_base_font_size_check'
  ) then
    alter table public.user_screenplay_custom_formats
      add constraint user_screenplay_custom_formats_base_font_size_check
      check (base_font_size in (14, 16, 18, 20));
  end if;
end $$;

update public.user_screenplay_custom_formats
set
  base_font_size = coalesce(base_font_size, 16),
  node_font_coverage_overrides = coalesce(node_font_coverage_overrides, '{}'::jsonb)
where base_font_size is null or node_font_coverage_overrides is null;

