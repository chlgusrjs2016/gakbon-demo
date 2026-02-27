# Implementation Plan: Markdown Document Type

## Overview

이 구현 계획은 마크다운 문서 타입을 웹 애플리케이션에 추가하는 작업을 단계별로 정의합니다. 기존 Tiptap 에디터 인프라를 활용하여 노션과 유사한 블록 기반 에디터를 구현하며, 이미지, 표, 다양한 마크다운 요소를 지원합니다. 각 작업은 이전 단계를 기반으로 하며, 점진적으로 기능을 추가하여 최종적으로 완전한 마크다운 에디터를 완성합니다.

## Tasks

- [x] 1. 데이터베이스 스키마 확장 및 타입 정의
  - 'md' 문서 타입을 지원하도록 documents 테이블의 제약 조건 수정
  - Supabase 마이그레이션 파일 생성 (`supabase/migrations/XXX_add_markdown_document_type.sql`)
  - document_type 인덱스 추가로 마크다운 문서 필터링 최적화
  - TypeScript 타입 정의 업데이트 (Document 타입에 'md' 추가)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 데이터베이스 제약 조건 속성 테스트 작성
  - **Property 1: Document Type Constraint Enforcement**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 2. 마크다운 Extension Kit 구현
  - `lib/editor/markdownKit.ts` 파일 생성
  - Tiptap StarterKit 설정 (Heading levels 1-3, Paragraph, Lists 등)
  - Link, Image, Table 확장 추가
  - TaskList, TaskItem 확장 추가
  - CodeBlockLowlight 확장 추가 (syntax highlighting)
  - 각 확장에 적절한 HTML 속성 및 스타일 클래스 설정
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

- [x] 2.1 Extension Kit 완전성 속성 테스트 작성
  - **Property 2: Extension Kit Completeness**
  - **Validates: Requirements 2.1-2.11**

- [x] 3. 이미지 업로드 시스템 구현
  - `app/actions/markdownImage.ts` 파일 생성
  - `createMarkdownImageUploadUrl` 함수 구현 (presigned URL 생성)
  - `confirmMarkdownImageUpload` 함수 구현 (asset 레코드 생성)
  - `deleteMarkdownImage` 함수 구현
  - 파일 형식 검증 (JPEG, PNG, GIF, WebP, SVG)
  - 파일 크기 제한 (10MB) 검증
  - Storage 경로 설정 (`document_assets/{projectId}/{documentId}/{uuid}-{filename}`)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.9, 4.10_

- [x] 3.1 이미지 업로드 및 저장 속성 테스트 작성
  - **Property 5: Image Upload and Storage**
  - **Validates: Requirements 4.1, 4.5**

- [x] 3.2 이미지 형식 검증 속성 테스트 작성
  - **Property 6: Image Format Validation**
  - **Validates: Requirements 4.9**

- [x] 4. 마크다운 에디터 컴포넌트 기본 구조 생성
  - `components/editor/MarkdownEditor.tsx` 파일 생성
  - MarkdownEditorProps 인터페이스 정의
  - Tiptap useEditor 훅 설정 (markdownExtensions 사용)
  - 기본 에디터 렌더링 (EditorContent 컴포넌트)
  - onUpdate 콜백 연결
  - _Requirements: 3.1, 2.12_

- [x] 5. 슬래시 커맨드 메뉴 구현
  - 슬래시 커맨드 확장 생성 또는 기존 라이브러리 통합
  - '/' 입력 시 커맨드 메뉴 표시
  - 블록 타입 옵션 제공 (Heading 1-3, Paragraph, Lists, Table, Image, Code Block 등)
  - 키보드 네비게이션 지원 (화살표 키, Enter)
  - 선택 시 해당 블록 타입으로 변환
  - _Requirements: 3.2_

- [x] 6. 마크다운 단축키 자동 변환 구현
  - 마크다운 단축키 확장 생성
  - '# ', '## ', '### ' → Heading 변환
  - '- ', '* ' → Bullet List 변환
  - '1. ' → Ordered List 변환
  - '```' → Code Block 변환
  - '> ' → Blockquote 변환
  - '---' → Horizontal Rule 변환
  - '[ ] ', '[x] ' → Task List 변환
  - _Requirements: 3.3_

- [x] 6.1 마크다운 단축키 자동 변환 속성 테스트 작성
  - **Property 3: Markdown Shortcut Auto-Conversion**
  - **Validates: Requirements 3.3**

- [x] 7. 자동 저장 기능 구현
  - useDebounce 훅 생성 또는 기존 훅 활용
  - 에디터 onUpdate에서 debounced 저장 함수 호출 (기본 1000ms)
  - 문서 업데이트 액션 호출 (JSONContent 저장)
  - 저장 상태 표시 UI 추가 ("Saving...", "Saved")
  - _Requirements: 3.7_

- [x] 7.1 자동 저장 지속성 속성 테스트 작성
  - **Property 4: Auto-Save Persistence**
  - **Validates: Requirements 3.7**

- [x] 8. Checkpoint - 기본 에디터 기능 검증
  - 모든 테스트가 통과하는지 확인
  - 에디터가 정상적으로 렌더링되는지 확인
  - 슬래시 커맨드와 마크다운 단축키가 작동하는지 확인
  - 자동 저장이 정상적으로 동작하는지 확인
  - 질문이 있으면 사용자에게 문의

- [x] 9. 블록 관리 기능 구현
  - 블록 호버 메뉴 컴포넌트 생성
  - 블록 위에 마우스 오버 시 메뉴 표시
  - 블록 삭제, 복제, 이동 버튼 추가
  - 드래그 앤 드롭으로 블록 재정렬 구현
  - 블록 선택 상태 관리
  - _Requirements: 3.4, 3.5_

- [x] 10. 이미지 삽입 UI 구현
  - 이미지 업로드 다이얼로그 컴포넌트 생성
  - 파일 선택기 (file picker) 통합
  - 드래그 앤 드롭 이미지 업로드 지원
  - 클립보드에서 이미지 붙여넣기 지원
  - 업로드 진행 상태 표시
  - 업로드 실패 시 에러 메시지 및 재시도 옵션
  - 이미지 삽입 후 에디터에 표시
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.10_

- [x] 11. 이미지 편집 기능 구현
  - 이미지 리사이징 핸들 추가
  - 이미지 정렬 옵션 (left, center, right) 추가
  - Alt 텍스트 입력 UI 추가
  - 이미지 클릭 시 편집 메뉴 표시
  - _Requirements: 4.6, 4.7, 4.8_

- [x] 12. 표 편집 기능 구현
  - 표 삽입 시 기본 3x3 표 생성 (헤더 포함)
  - 행 추가/삭제 기능 (위/아래)
  - 열 추가/삭제 기능 (좌/우)
  - 셀 병합 기능
  - 활성 셀 하이라이트
  - Tab 키로 셀 간 네비게이션
  - 열 너비 조절 (드래그)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9_

- [x] 12.1 표 셀 내 텍스트 서식 속성 테스트 작성
  - **Property 7: Text Formatting in Table Cells**
  - **Validates: Requirements 5.6**

- [x] 12.2 표 구조 복사/붙여넣기 보존 속성 테스트 작성
  - **Property 8: Table Structure Preservation on Copy/Paste**
  - **Validates: Requirements 5.10**

- [ ] 13. 마크다운 도구 모음 컴포넌트 생성
  - `components/editor/MarkdownToolbar.tsx` 파일 생성
  - MarkdownToolbarProps 인터페이스 정의
  - 텍스트 서식 버튼 추가 (Bold, Italic, Underline, Strikethrough)
  - 제목 레벨 버튼 추가 (H1, H2, H3)
  - 리스트 버튼 추가 (Bullet, Numbered, Task)
  - 삽입 버튼 추가 (Link, Image, Table, Code Block)
  - 블록 버튼 추가 (Blockquote, Horizontal Rule)
  - Undo/Redo 버튼 추가
  - 도구 모음을 에디터 상단에 고정 (sticky)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_

- [ ] 14. 도구 모음 상태 반영 구현
  - 현재 선택된 텍스트의 서식 상태 감지
  - 활성 서식에 해당하는 버튼 하이라이트
  - 에디터 상태 변경 시 도구 모음 업데이트
  - _Requirements: 7.6_

- [ ]* 14.1 도구 모음 상태 반영 속성 테스트 작성
  - **Property 9: Toolbar State Reflection**
  - **Validates: Requirements 7.6**

- [x] 15. 문서 타입 선택 UI 확장
  - `components/NewDocumentModal.tsx` 파일 수정
  - DocumentType 타입에 'md' 추가
  - documentTypeOptions 배열에 Markdown 옵션 추가
  - Markdown 아이콘 및 설명 추가
  - 선택 시 document_type 'md'로 문서 생성
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 16. 문자/단어 수 표시 기능 추가
  - 에디터 하단에 문자 수 표시 컴포넌트 추가
  - 단어 수 계산 로직 구현
  - 실시간 업데이트
  - _Requirements: 3.8_

- [ ] 17. 키보드 단축키 구현
  - Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline) 등 표준 단축키 추가
  - Ctrl+K (Link 삽입)
  - Ctrl+Shift+C (Code Block)
  - Ctrl+Z (Undo), Ctrl+Y (Redo)
  - 단축키 목록 도움말 추가
  - _Requirements: 3.6, 10.4_

- [ ] 18. Checkpoint - 에디터 UI 및 기능 검증
  - 모든 테스트가 통과하는지 확인
  - 도구 모음이 정상적으로 작동하는지 확인
  - 이미지 및 표 편집이 정상적으로 동작하는지 확인
  - 문서 타입 선택이 정상적으로 작동하는지 확인
  - 질문이 있으면 사용자에게 문의

- [ ] 19. 마크다운 파서 및 직렬화 구현
  - `lib/editor/markdown/serializer.ts` 파일 생성
  - `parseMarkdownToJson` 함수 구현 (markdown → JSONContent)
  - `serializeJsonToMarkdown` 함수 구현 (JSONContent → markdown)
  - `validateMarkdownRoundTrip` 함수 구현
  - prosemirror-markdown 또는 remark 라이브러리 활용
  - GitHub Flavored Markdown (GFM) 지원
  - 공백 및 줄바꿈 보존
  - 이스케이프 문자 처리
  - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ]* 19.1 마크다운 라운드트립 보존 속성 테스트 작성
  - **Property 11: Markdown Round-Trip Preservation**
  - **Validates: Requirements 9.1, 9.4, 9.5**

- [ ]* 19.2 잘못된 마크다운 처리 속성 테스트 작성
  - **Property 12: Invalid Markdown Graceful Handling**
  - **Validates: Requirements 9.2**

- [ ]* 19.3 GFM 구문 지원 속성 테스트 작성
  - **Property 13: GFM Syntax Support**
  - **Validates: Requirements 9.3**

- [ ]* 19.4 공백 보존 속성 테스트 작성
  - **Property 14: Whitespace Preservation**
  - **Validates: Requirements 9.6**

- [ ]* 19.5 이스케이프 시퀀스 처리 속성 테스트 작성
  - **Property 15: Escape Sequence Handling**
  - **Validates: Requirements 9.7**

- [ ] 20. PDF 내보내기 시스템 확장
  - `lib/export/pdf/markdownSerializer.ts` 파일 생성
  - `serializeMarkdownToHtml` 함수 구현
  - 마크다운 전용 CSS 스타일 추가
  - 이미지 렌더링 지원
  - 표 렌더링 지원 (테두리 및 정렬)
  - 코드 블록 렌더링 지원 (monospace 폰트, 배경색)
  - 페이지 여백 및 간격 설정
  - 페이지 번호 추가
  - 페이지 크기 선택 옵션 (A4, Letter 등)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ]* 20.1 PDF 내보내기 형식 보존 속성 테스트 작성
  - **Property 10: PDF Export with Format Preservation**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 21. 접근성 기능 구현
  - 모든 대화형 요소에 ARIA 레이블 추가
  - 스크린 리더 알림을 위한 ARIA live region 추가
  - 포커스 인디케이터 스타일 추가 (WCAG AA 준수)
  - 도구 모음 버튼에 Tab 키 네비게이션 지원
  - 이미지 삽입 시 Alt 텍스트 입력 프롬프트
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7_

- [ ]* 21.1 전체 키보드 네비게이션 속성 테스트 작성
  - **Property 16: Full Keyboard Navigation**
  - **Validates: Requirements 10.1, 10.4**

- [ ]* 21.2 대화형 요소 ARIA 레이블 속성 테스트 작성
  - **Property 17: ARIA Labels for Interactive Elements**
  - **Validates: Requirements 10.2**

- [ ]* 21.3 스크린 리더 알림 속성 테스트 작성
  - **Property 18: Screen Reader Announcements**
  - **Validates: Requirements 10.3**

- [ ]* 21.4 포커스 인디케이터 가시성 속성 테스트 작성
  - **Property 19: Focus Indicator Visibility**
  - **Validates: Requirements 10.5**

- [ ]* 21.5 접근성 감사 수행
  - jest-axe를 사용하여 모든 컴포넌트 테스트
  - WCAG AA 색상 대비 검증
  - 스크린 리더로 수동 테스트 (NVDA, JAWS, VoiceOver)

- [ ] 22. 성능 최적화 구현
  - 대용량 문서(>1000 블록)를 위한 가상화 구현
  - 이미지 지연 로딩 (viewport 진입 시)
  - React.memo로 도구 모음 컴포넌트 최적화
  - useMemo/useCallback로 불필요한 재렌더링 방지
  - 렌더링된 콘텐츠 캐싱
  - 여러 이미지 업로드 시 병렬 처리
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 23. 협업 기능 준비
  - 각 블록에 고유 식별자(UUID) 추가
  - 블록 버전 번호 추가
  - 문서 버전 추적 구현
  - CRDT 호환 데이터 구조 설계
  - 실시간 동기화를 위한 훅 제공
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 23.1 블록 고유 식별자 속성 테스트 작성
  - **Property 20: Block Unique Identifiers**
  - **Validates: Requirements 12.2**

- [ ]* 23.2 문서 버전 추적 속성 테스트 작성
  - **Property 21: Document Version Tracking**
  - **Validates: Requirements 12.3**

- [ ] 24. 에러 처리 구현
  - 데이터베이스 에러 처리 (제약 조건 위반, 연결 실패 등)
  - 이미지 업로드 에러 처리 (형식 오류, 크기 초과, 네트워크 실패 등)
  - 파싱 에러 처리 (잘못된 마크다운, 손상된 JSON 등)
  - PDF 내보내기 에러 처리
  - 검증 에러 처리
  - 구조화된 에러 응답 형식 구현 (ErrorResponse 타입)
  - 사용자 친화적인 에러 메시지 표시
  - 에러 복구 전략 구현 (재시도, 대체 방법 등)

- [ ] 25. 통합 테스트 작성
  - 문서 생성 플로우 테스트 ('md' 타입)
  - 이미지 업로드 플로우 테스트 (presigned URL → 업로드 → 확인)
  - 자동 저장 디바운싱 테스트
  - PDF 내보내기 플로우 테스트
  - 빈 문서 처리 테스트
  - 대용량 문서 처리 테스트 (>1000 블록)
  - 네트워크 실패 시나리오 테스트

- [ ] 26. 최종 Checkpoint - 전체 기능 검증
  - 모든 단위 테스트 및 속성 테스트 통과 확인
  - 모든 통합 테스트 통과 확인
  - 접근성 감사 통과 확인
  - 성능 벤치마크 확인
  - 사용자 시나리오 수동 테스트
  - 질문이 있으면 사용자에게 문의

## Notes

- '*'로 표시된 작업은 선택 사항이며 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 작업은 추적 가능성을 위해 특정 요구사항을 참조합니다
- Checkpoint는 점진적 검증을 보장합니다
- 속성 테스트는 보편적인 정확성 속성을 검증합니다
- 단위 테스트는 특정 예제 및 엣지 케이스를 검증합니다
- 모든 코드는 TypeScript로 작성됩니다
