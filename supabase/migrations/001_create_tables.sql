-- =============================================================
-- Gakbon - 데이터베이스 스키마 생성
-- =============================================================
--
-- 이 SQL을 Supabase 대시보드 > SQL Editor 에서 실행하세요.
--
-- 만드는 테이블:
--   1. projects  - 사용자의 시나리오 프로젝트
--   2. documents - 프로젝트 안의 시나리오 문서
--
-- 보안:
--   RLS(Row Level Security)를 사용하여
--   각 사용자는 본인의 데이터만 읽고/쓰고/삭제할 수 있습니다.
-- =============================================================


-- -----------------------------------------
-- 1. projects 테이블
-- -----------------------------------------
-- 사용자가 만든 시나리오 프로젝트 목록입니다.
-- 예: "장편 시나리오 - 봄날", "단편 - 커피한잔" 등

create table if not exists public.projects (
  -- 고유 ID (자동 생성되는 UUID)
  id uuid default gen_random_uuid() primary key,

  -- 이 프로젝트를 만든 사용자의 ID
  -- auth.users 테이블의 id를 참조합니다.
  user_id uuid references auth.users(id) on delete cascade not null,

  -- 프로젝트 제목 (필수)
  title text not null,

  -- 프로젝트 설명 (선택)
  description text default '',

  -- 생성 시각 (자동 설정)
  created_at timestamptz default now() not null,

  -- 마지막 수정 시각 (자동 설정)
  updated_at timestamptz default now() not null
);

-- projects 테이블에 RLS 활성화
alter table public.projects enable row level security;

-- RLS 정책: 본인의 프로젝트만 조회 가능
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- RLS 정책: 본인만 프로젝트 생성 가능
create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- RLS 정책: 본인의 프로젝트만 수정 가능
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- RLS 정책: 본인의 프로젝트만 삭제 가능
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);


-- -----------------------------------------
-- 2. documents 테이블
-- -----------------------------------------
-- 프로젝트 안에 있는 개별 시나리오 문서입니다.
-- 예: "1화 - 첫 만남", "2화 - 재회" 등
-- content 컬럼에 TipTap 에디터의 JSON 데이터가 저장됩니다.

create table if not exists public.documents (
  -- 고유 ID
  id uuid default gen_random_uuid() primary key,

  -- 어떤 프로젝트에 속하는지
  -- projects 테이블의 id를 참조합니다.
  -- 프로젝트가 삭제되면 문서도 함께 삭제됩니다 (cascade).
  project_id uuid references public.projects(id) on delete cascade not null,

  -- 문서 제목
  title text not null default '제목 없음',

  -- 시나리오 본문 (TipTap JSON 형태)
  -- jsonb 타입은 JSON 데이터를 효율적으로 저장/검색할 수 있습니다.
  content jsonb default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,

  -- 문서 순서 (같은 프로젝트 내에서의 정렬 순서)
  sort_order integer default 0,

  -- 생성/수정 시각
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- documents 테이블에 RLS 활성화
alter table public.documents enable row level security;

-- RLS 정책: 본인 프로젝트의 문서만 조회 가능
-- (documents는 user_id가 없으므로, projects 테이블을 통해 확인합니다)
create policy "Users can view own documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
        and projects.user_id = auth.uid()
    )
  );

-- RLS 정책: 본인 프로젝트에만 문서 생성 가능
create policy "Users can create documents in own projects"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
        and projects.user_id = auth.uid()
    )
  );

-- RLS 정책: 본인 프로젝트의 문서만 수정 가능
create policy "Users can update own documents"
  on public.documents for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
        and projects.user_id = auth.uid()
    )
  );

-- RLS 정책: 본인 프로젝트의 문서만 삭제 가능
create policy "Users can delete own documents"
  on public.documents for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = documents.project_id
        and projects.user_id = auth.uid()
    )
  );


-- -----------------------------------------
-- 3. updated_at 자동 갱신 함수
-- -----------------------------------------
-- 레코드가 수정될 때마다 updated_at을 자동으로 현재 시각으로 바꿔줍니다.

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- projects 테이블에 트리거 연결
create trigger on_projects_updated
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- documents 테이블에 트리거 연결
create trigger on_documents_updated
  before update on public.documents
  for each row execute function public.handle_updated_at();
