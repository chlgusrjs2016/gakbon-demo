# Requirements Document

## Introduction

이 문서는 웹 애플리케이션에 새로운 마크다운(Markdown) 문서 타입을 추가하는 기능에 대한 요구사항을 정의합니다. 현재 시스템은 screenplay와 document 두 가지 문서 타입을 지원하며, 이번 기능 추가를 통해 세 번째 문서 타입인 'md'를 도입합니다. 마크다운 문서 타입은 노션(Notion)과 유사한 블록 기반 에디터를 제공하며, 이미지, 표 등의 리치 콘텐츠를 지원합니다.

## Glossary

- **MD_Editor**: 마크다운 문서를 편집하기 위한 블록 기반 에디터 컴포넌트
- **Document_Type_System**: 데이터베이스 및 애플리케이션 레벨에서 문서 타입을 관리하는 시스템
- **Block_Element**: 에디터 내에서 독립적인 콘텐츠 단위 (예: 단락, 제목, 이미지, 표)
- **Rich_Content**: 텍스트 외에 이미지, 표, 링크 등을 포함하는 콘텐츠
- **Extension_Kit**: Tiptap 에디터에 기능을 추가하는 확장 모듈 집합
- **PDF_Export_System**: 문서를 PDF 형식으로 변환하는 시스템
- **Document_Toolbar**: 문서 편집 시 사용되는 도구 모음 UI 컴포넌트

## Requirements

### Requirement 1: 데이터베이스 스키마 확장

**User Story:** 개발자로서, 마크다운 문서 타입을 데이터베이스에 저장할 수 있도록, 문서 타입 제약 조건을 확장하고 싶습니다.

#### Acceptance Criteria

1. THE Document_Type_System SHALL support 'md' as a valid document_type value in the documents table
2. WHEN a new document is created with document_type 'md', THE Document_Type_System SHALL store it without constraint violations
3. THE Document_Type_System SHALL maintain backward compatibility with existing 'screenplay' and 'document' types
4. THE Document_Type_System SHALL enforce that document_type is one of ('screenplay', 'document', 'md')

### Requirement 2: 마크다운 에디터 확장 킷 구현

**User Story:** 개발자로서, 마크다운 문서에 필요한 모든 편집 기능을 제공하기 위해, 전용 Extension Kit을 구현하고 싶습니다.

#### Acceptance Criteria

1. THE Extension_Kit SHALL include heading support for levels 1, 2, and 3
2. THE Extension_Kit SHALL include paragraph, bold, italic, and underline text formatting
3. THE Extension_Kit SHALL include ordered lists and unordered lists
4. THE Extension_Kit SHALL include task lists with checkboxes
5. THE Extension_Kit SHALL include blockquote support
6. THE Extension_Kit SHALL include code blocks with syntax highlighting
7. THE Extension_Kit SHALL include inline code formatting
8. THE Extension_Kit SHALL include horizontal rule (divider) support
9. THE Extension_Kit SHALL include link insertion and editing capabilities
10. THE Extension_Kit SHALL include image insertion with upload support
11. THE Extension_Kit SHALL include table creation and editing with rows, columns, and headers
12. THE Extension_Kit SHALL use Tiptap framework as the base editor engine

### Requirement 3: 마크다운 에디터 컴포넌트 생성

**User Story:** 사용자로서, 마크다운 문서를 편집할 수 있는 전용 에디터를 사용하고 싶습니다.

#### Acceptance Criteria

1. THE MD_Editor SHALL render a block-based editing interface similar to Notion
2. WHEN a user types '/', THE MD_Editor SHALL display a command menu for inserting blocks
3. WHEN a user types markdown syntax (e.g., '# ', '- ', '1. '), THE MD_Editor SHALL auto-convert to the corresponding block type
4. THE MD_Editor SHALL support drag-and-drop reordering of blocks
5. THE MD_Editor SHALL provide a hover menu for block-level actions (delete, duplicate, move)
6. THE MD_Editor SHALL support keyboard shortcuts for common formatting operations
7. THE MD_Editor SHALL auto-save content changes to the backend
8. THE MD_Editor SHALL display a character or word count indicator

### Requirement 4: 이미지 첨부 기능

**User Story:** 사용자로서, 마크다운 문서에 이미지를 삽입하고 관리할 수 있기를 원합니다.

#### Acceptance Criteria

1. WHEN a user uploads an image file, THE MD_Editor SHALL store it in the document_assets storage
2. THE MD_Editor SHALL support image upload via drag-and-drop
3. THE MD_Editor SHALL support image upload via file picker dialog
4. THE MD_Editor SHALL support image upload via paste from clipboard
5. THE MD_Editor SHALL display uploaded images inline within the document
6. WHEN an image is inserted, THE MD_Editor SHALL allow resizing by dragging handles
7. THE MD_Editor SHALL support image alignment options (left, center, right)
8. THE MD_Editor SHALL support alt text input for accessibility
9. THE MD_Editor SHALL support common image formats (JPEG, PNG, GIF, WebP, SVG)
10. IF an image upload fails, THEN THE MD_Editor SHALL display an error message and allow retry

### Requirement 5: 표 편집 기능

**User Story:** 사용자로서, 마크다운 문서에 표를 삽입하고 편집할 수 있기를 원합니다.

#### Acceptance Criteria

1. WHEN a user inserts a table, THE MD_Editor SHALL create a default 3x3 table with headers
2. THE MD_Editor SHALL allow adding rows above or below the current row
3. THE MD_Editor SHALL allow adding columns to the left or right of the current column
4. THE MD_Editor SHALL allow deleting rows and columns
5. THE MD_Editor SHALL allow merging adjacent cells
6. THE MD_Editor SHALL support text formatting within table cells
7. THE MD_Editor SHALL highlight the active cell with a border or background color
8. THE MD_Editor SHALL support tab key navigation between cells
9. THE MD_Editor SHALL support column resizing by dragging column borders
10. THE MD_Editor SHALL maintain table structure when content is copied and pasted

### Requirement 6: 문서 타입 선택 UI

**User Story:** 사용자로서, 새 문서를 생성할 때 마크다운 타입을 선택할 수 있기를 원합니다.

#### Acceptance Criteria

1. WHEN a user creates a new document, THE Document_Type_System SHALL display a type selection dialog
2. THE Document_Type_System SHALL present 'Screenplay', 'Document', and 'Markdown' as available options
3. WHEN a user selects 'Markdown', THE Document_Type_System SHALL create a document with document_type 'md'
4. THE Document_Type_System SHALL display an appropriate icon for each document type
5. THE Document_Type_System SHALL provide a brief description for each document type option

### Requirement 7: 마크다운 문서 도구 모음

**User Story:** 사용자로서, 마크다운 문서 편집 시 필요한 도구에 빠르게 접근하고 싶습니다.

#### Acceptance Criteria

1. WHEN a markdown document is open, THE Document_Toolbar SHALL display formatting buttons
2. THE Document_Toolbar SHALL include buttons for: bold, italic, underline, strikethrough
3. THE Document_Toolbar SHALL include buttons for: heading levels, lists, task lists
4. THE Document_Toolbar SHALL include buttons for: link, image, table, code block
5. THE Document_Toolbar SHALL include buttons for: blockquote, horizontal rule
6. THE Document_Toolbar SHALL highlight active formatting states (e.g., bold button when text is bold)
7. THE Document_Toolbar SHALL be sticky at the top of the editor viewport
8. THE Document_Toolbar SHALL include undo and redo buttons

### Requirement 8: PDF 내보내기 지원

**User Story:** 사용자로서, 마크다운 문서를 PDF 형식으로 내보낼 수 있기를 원합니다.

#### Acceptance Criteria

1. WHEN a user exports a markdown document, THE PDF_Export_System SHALL generate a PDF file
2. THE PDF_Export_System SHALL preserve all text formatting (bold, italic, underline, etc.)
3. THE PDF_Export_System SHALL render images at appropriate sizes
4. THE PDF_Export_System SHALL render tables with proper borders and alignment
5. THE PDF_Export_System SHALL render code blocks with monospace font and background color
6. THE PDF_Export_System SHALL apply consistent page margins and spacing
7. THE PDF_Export_System SHALL include page numbers in the footer
8. THE PDF_Export_System SHALL support custom page size selection (A4, Letter, etc.)

### Requirement 9: 마크다운 구문 파싱 및 렌더링

**User Story:** 개발자로서, 마크다운 구문을 정확하게 파싱하고 렌더링하기 위해, 파서와 프리티 프린터를 구현하고 싶습니다.

#### Acceptance Criteria

1. WHEN valid markdown syntax is provided, THE MD_Editor SHALL parse it into the internal document structure
2. WHEN invalid markdown syntax is provided, THE MD_Editor SHALL handle it gracefully without crashing
3. THE MD_Editor SHALL support GitHub Flavored Markdown (GFM) syntax
4. THE MD_Editor SHALL convert the internal document structure back to markdown format for export
5. FOR ALL valid markdown documents, parsing then exporting then parsing SHALL produce an equivalent document structure (round-trip property)
6. THE MD_Editor SHALL preserve whitespace and line breaks according to markdown specifications
7. THE MD_Editor SHALL support escaping special markdown characters with backslash

### Requirement 10: 접근성 지원

**User Story:** 사용자로서, 스크린 리더 및 키보드만으로 마크다운 에디터를 사용할 수 있기를 원합니다.

#### Acceptance Criteria

1. THE MD_Editor SHALL support full keyboard navigation without requiring a mouse
2. THE MD_Editor SHALL provide ARIA labels for all interactive elements
3. THE MD_Editor SHALL announce content changes to screen readers
4. THE MD_Editor SHALL support standard keyboard shortcuts (Ctrl+B for bold, etc.)
5. THE MD_Editor SHALL maintain focus indicators visible at all times
6. THE MD_Editor SHALL support tab key navigation through toolbar buttons
7. WHEN an image is inserted, THE MD_Editor SHALL prompt for alt text
8. THE MD_Editor SHALL ensure color contrast ratios meet WCAG AA standards

### Requirement 11: 성능 최적화

**User Story:** 사용자로서, 대용량 마크다운 문서를 편집할 때도 원활한 성능을 경험하고 싶습니다.

#### Acceptance Criteria

1. WHEN a document contains more than 1000 blocks, THE MD_Editor SHALL use virtualization to render only visible blocks
2. THE MD_Editor SHALL debounce auto-save operations to reduce server requests
3. THE MD_Editor SHALL load images lazily as they enter the viewport
4. WHEN typing, THE MD_Editor SHALL respond within 16ms to maintain 60fps
5. THE MD_Editor SHALL use incremental updates for content synchronization
6. THE MD_Editor SHALL cache rendered content to avoid unnecessary re-renders
7. WHEN uploading multiple images, THE MD_Editor SHALL process them in parallel

### Requirement 12: 협업 기능 준비

**User Story:** 개발자로서, 향후 실시간 협업 기능을 추가할 수 있도록, 문서 구조를 설계하고 싶습니다.

#### Acceptance Criteria

1. THE MD_Editor SHALL store document content in a format compatible with operational transformation (OT) or CRDT
2. THE MD_Editor SHALL assign unique identifiers to each block for conflict resolution
3. THE MD_Editor SHALL track document version numbers for change detection
4. THE MD_Editor SHALL support merging concurrent edits without data loss
5. THE MD_Editor SHALL provide hooks for real-time synchronization integration
