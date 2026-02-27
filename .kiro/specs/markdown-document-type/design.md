# Design Document: Markdown Document Type

## Overview

This design document specifies the technical implementation for adding a markdown document type to the web application. The system currently supports two document types ('screenplay' and 'document'), and this feature adds a third type ('md') with a Notion-like block-based editor supporting rich content including images, tables, and various markdown elements.

The implementation leverages the existing Tiptap editor infrastructure and follows established patterns from the DocumentEditor component. The markdown editor will provide a modern, accessible editing experience with slash commands, keyboard shortcuts, and comprehensive formatting options.

### Key Design Principles

1. **Consistency**: Follow existing patterns from DocumentEditor and ScenarioEditor implementations
2. **Extensibility**: Design for future collaboration features using CRDT-compatible data structures
3. **Performance**: Implement virtualization and lazy loading for large documents
4. **Accessibility**: Ensure full keyboard navigation and screen reader support
5. **Standards Compliance**: Support GitHub Flavored Markdown (GFM) syntax

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  MarkdownEditor Component                                   │
│  ├─ Slash Command Menu                                      │
│  ├─ Toolbar Component                                       │
│  └─ Block Management                                        │
├─────────────────────────────────────────────────────────────┤
│  Tiptap Extension Layer                                     │
│  ├─ markdownExtensions (Extension Kit)                      │
│  │  ├─ StarterKit (Heading, Paragraph, Lists, etc.)        │
│  │  ├─ Link Extension                                       │
│  │  ├─ Image Extension (with upload)                        │
│  │  ├─ Table Extension                                      │
│  │  ├─ TaskList/TaskItem Extensions                         │
│  │  └─ Code Block Extension                                 │
│  └─ Custom Extensions                                       │
│     ├─ SlashCommand Extension                               │
│     └─ MarkdownShortcuts Extension                          │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├─ Document CRUD Actions                                   │
│  ├─ Image Upload Actions                                    │
│  └─ Export Actions                                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase)                                        │
│  ├─ documents table (with 'md' type)                        │
│  └─ document_assets table (image storage)                   │
├─────────────────────────────────────────────────────────────┤
│  Storage (Supabase Storage)                                 │
│  └─ document_assets bucket                                  │
├─────────────────────────────────────────────────────────────┤
│  Export System                                              │
│  ├─ Markdown Serializer                                     │
│  ├─ HTML Renderer                                           │
│  └─ PDF Generator (Chromium/Puppeteer)                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Document Creation**: User selects 'Markdown' type → Frontend creates document with `document_type: 'md'` → Stored in Supabase
2. **Content Editing**: User edits → Tiptap updates internal state → Auto-save debounced → JSONContent saved to database
3. **Image Upload**: User uploads image → Presigned URL generated → Upload to Supabase Storage → Asset record created → Image URL inserted into editor
4. **Export**: User requests PDF → Content serialized to HTML → Styled with CSS → Rendered to PDF via Chromium

## Components and Interfaces

### 1. Database Schema Extension

**Migration File**: `supabase/migrations/XXX_add_markdown_document_type.sql`

```sql
-- Extend document_type constraint to include 'md'
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE public.documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN ('screenplay', 'document', 'md'));

-- Add index for efficient filtering by markdown documents
CREATE INDEX IF NOT EXISTS idx_documents_markdown_type
ON public.documents(project_id, document_type)
WHERE document_type = 'md';
```

### 2. Markdown Extension Kit

**File**: `lib/editor/markdownKit.ts`

```typescript
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export const markdownExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    codeBlock: false, // Replaced with CodeBlockLowlight
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class: "text-blue-600 underline hover:text-blue-800",
    },
  }),
  Image.configure({
    inline: true,
    allowBase64: false,
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse table-auto w-full",
    },
  }),
  TableRow,
  TableHeader.configure({
    HTMLAttributes: {
      class: "border border-gray-300 px-4 py-2 bg-gray-100 font-semibold",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-gray-300 px-4 py-2",
    },
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "list-none pl-0",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex items-start gap-2",
    },
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm",
    },
  }),
];
```

### 3. Markdown Editor Component

**File**: `components/editor/MarkdownEditor.tsx`

**Interface**:
```typescript
type MarkdownEditorProps = {
  content: JSONContent | null;
  onUpdate?: (content: JSONContent) => void;
  onEditorReady?: (editor: Editor) => void;
  onRequestImageUpload?: () => void;
  autoSaveDelay?: number; // Default: 1000ms
};
```

**Key Features**:
- Slash command menu (triggered by '/')
- Markdown shortcuts (e.g., '# ' → Heading 1)
- Drag-and-drop block reordering
- Block hover menu (delete, duplicate, move)
- Auto-save with debouncing
- Character/word count indicator
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)

### 4. Markdown Toolbar Component

**File**: `components/editor/MarkdownToolbar.tsx`

**Interface**:
```typescript
type MarkdownToolbarProps = {
  editor: Editor | null;
  onImageUpload?: () => void;
  onExportPdf?: () => void;
};
```

**Toolbar Buttons**:
- Text formatting: Bold, Italic, Underline, Strikethrough
- Headings: H1, H2, H3
- Lists: Bullet, Numbered, Task
- Insert: Link, Image, Table, Code Block
- Block: Blockquote, Horizontal Rule
- Actions: Undo, Redo

### 5. Document Type Selection UI

**File**: `components/NewDocumentModal.tsx` (extend existing)

**Interface**:
```typescript
type DocumentType = 'screenplay' | 'document' | 'md';

type DocumentTypeOption = {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const documentTypeOptions: DocumentTypeOption[] = [
  {
    type: 'screenplay',
    label: 'Screenplay',
    description: 'Professional screenplay format with scene headings, action, and dialogue',
    icon: <Film className="w-6 h-6" />,
  },
  {
    type: 'document',
    label: 'Document',
    description: 'Rich text document with formatting, images, and tables',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    type: 'md',
    label: 'Markdown',
    description: 'Block-based markdown editor with slash commands and rich content',
    icon: <Hash className="w-6 h-6" />,
  },
];
```

### 6. Image Upload System

**File**: `app/actions/markdownImage.ts`

**Functions**:
```typescript
// Generate presigned upload URL
export async function createMarkdownImageUploadUrl(
  documentId: string,
  filename: string,
  mimeType: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }>;

// Confirm upload and create asset record
export async function confirmMarkdownImageUpload(args: {
  documentId: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
}): Promise<{ success: boolean; assetId?: string; publicUrl?: string; error?: string }>;

// Delete image asset
export async function deleteMarkdownImage(
  assetId: string
): Promise<{ success: boolean; error?: string }>;
```

**Supported Formats**: JPEG, PNG, GIF, WebP, SVG
**Max File Size**: 10MB
**Storage Path**: `document_assets/{projectId}/{documentId}/{uuid}-{filename}`

### 7. Markdown Parser and Serializer

**File**: `lib/editor/markdown/serializer.ts`

**Functions**:
```typescript
// Parse markdown string to Tiptap JSONContent
export function parseMarkdownToJson(markdown: string): JSONContent;

// Serialize Tiptap JSONContent to markdown string
export function serializeJsonToMarkdown(json: JSONContent): string;

// Validate round-trip conversion
export function validateMarkdownRoundTrip(markdown: string): boolean;
```

**Implementation**: Use `prosemirror-markdown` or `remark` ecosystem for parsing/serialization

### 8. PDF Export Extension

**File**: `lib/export/pdf/markdownSerializer.ts`

**Function**:
```typescript
export function serializeMarkdownToHtml(
  json: JSONContent,
  options: {
    includeStyles: boolean;
    imageBaseUrl: string;
  }
): string;
```

**CSS Styling**: Extend existing `buildPdfPrintCss` to support markdown-specific styles

## Data Models

### Document Model (Extended)

```typescript
type Document = {
  id: string;
  project_id: string;
  title: string;
  document_type: 'screenplay' | 'document' | 'md'; // Extended
  content: JSONContent; // Tiptap JSON format
  order_index: number;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

### Markdown JSONContent Structure

```typescript
type MarkdownDocument = {
  type: 'doc';
  content: MarkdownBlock[];
};

type MarkdownBlock =
  | HeadingBlock
  | ParagraphBlock
  | BulletListBlock
  | OrderedListBlock
  | TaskListBlock
  | BlockquoteBlock
  | CodeBlockBlock
  | HorizontalRuleBlock
  | ImageBlock
  | TableBlock;

type HeadingBlock = {
  type: 'heading';
  attrs: { level: 1 | 2 | 3 };
  content?: InlineContent[];
};

type ParagraphBlock = {
  type: 'paragraph';
  content?: InlineContent[];
};

type ImageBlock = {
  type: 'image';
  attrs: {
    src: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
  };
};

type TableBlock = {
  type: 'table';
  content: TableRowBlock[];
};

type TableRowBlock = {
  type: 'tableRow';
  content: (TableCellBlock | TableHeaderBlock)[];
};

type InlineContent =
  | { type: 'text'; text: string; marks?: Mark[] }
  | { type: 'hardBreak' };

type Mark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'strike' }
  | { type: 'code' }
  | { type: 'link'; attrs: { href: string; target?: string } };
```

### Block Identifier for Collaboration

Each block will have a unique identifier for future CRDT implementation:

```typescript
type BlockWithId = MarkdownBlock & {
  attrs: {
    id: string; // UUID v4
    version: number; // Incremented on each edit
  };
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following testable properties and examples. Here's the reflection to eliminate redundancy:

**Redundancy Analysis**:

1. **Extension Kit Properties (2.1-2.11)**: All of these test that specific extensions are present in the kit. These can be combined into a single comprehensive property that validates the extension kit contains all required extensions.

2. **Document Type Properties (1.2, 1.3, 1.4)**: Property 1.3 (backward compatibility) is subsumed by property 1.4 (type enforcement), since enforcing the constraint inherently maintains backward compatibility. Property 1.2 is a specific case of 1.4.

3. **Image Upload Properties (4.1, 4.5)**: Property 4.5 (display images inline) is a consequence of property 4.1 (store in document_assets). If storage succeeds, display should follow. These can be combined.

4. **PDF Export Properties (8.2-8.5)**: These all test format preservation during PDF export. They can be combined into a single comprehensive property about preserving document structure and formatting.

5. **Markdown Parsing Properties (9.1, 9.3, 9.4)**: Property 9.5 (round-trip) subsumes properties 9.1 and 9.4, since successful round-trip implies both parsing and serialization work correctly.

6. **Accessibility Properties (10.1, 10.4)**: Property 10.1 (full keyboard navigation) subsumes property 10.4 (standard shortcuts), since keyboard shortcuts are part of keyboard navigation.

7. **Accessibility Properties (10.2, 10.3, 10.5)**: These are all distinct aspects of accessibility and should remain separate.

**Properties to Keep**:
- Document type constraint enforcement (combines 1.2, 1.3, 1.4)
- Extension kit completeness (combines 2.1-2.11)
- Markdown shortcut auto-conversion (3.3)
- Auto-save persistence (3.7)
- Image upload and storage (combines 4.1, 4.5)
- Image format validation (4.9)
- Text formatting in table cells (5.6)
- Table structure preservation on copy/paste (5.10)
- Toolbar state reflection (7.6)
- PDF export with format preservation (combines 8.1, 8.2, 8.3, 8.4, 8.5)
- Markdown round-trip property (9.5 - subsumes 9.1, 9.4)
- Invalid markdown graceful handling (9.2)
- GFM syntax support (9.3)
- Whitespace preservation (9.6)
- Escape sequence handling (9.7)
- Full keyboard navigation (combines 10.1, 10.4)
- ARIA labels for interactive elements (10.2)
- Screen reader announcements (10.3)
- Focus indicator visibility (10.5)
- Block unique identifiers (12.2)
- Document version tracking (12.3)

### Correctness Properties

### Property 1: Document Type Constraint Enforcement

*For any* document creation or update operation, the system SHALL accept documents with document_type in ('screenplay', 'document', 'md') and SHALL reject documents with any other document_type value.

**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Extension Kit Completeness

*For any* markdown editor instance, the extension kit SHALL include all required extensions: headings (levels 1-3), paragraph, bold, italic, underline, ordered lists, unordered lists, task lists, blockquote, code blocks, inline code, horizontal rule, links, images, and tables.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

### Property 3: Markdown Shortcut Auto-Conversion

*For any* valid markdown syntax pattern (e.g., '# ', '## ', '- ', '1. ', '```'), when typed in the editor, the system SHALL automatically convert it to the corresponding block type.

**Validates: Requirements 3.3**

### Property 4: Auto-Save Persistence

*For any* content change in the markdown editor, after the debounce delay, the system SHALL persist the updated content to the database such that retrieving the document returns the latest content.

**Validates: Requirements 3.7**

### Property 5: Image Upload and Storage

*For any* valid image file upload, the system SHALL store the image in document_assets storage and SHALL insert the image into the document at the cursor position with a valid URL.

**Validates: Requirements 4.1, 4.5**

### Property 6: Image Format Validation

*For any* file upload attempt, the system SHALL accept files with MIME types (image/jpeg, image/png, image/gif, image/webp, image/svg+xml) and SHALL reject files with other MIME types.

**Validates: Requirements 4.9**

### Property 7: Text Formatting in Table Cells

*For any* text formatting operation (bold, italic, underline, strikethrough, code, link) applied within a table cell, the formatting SHALL be preserved and rendered correctly within that cell.

**Validates: Requirements 5.6**

### Property 8: Table Structure Preservation on Copy/Paste

*For any* table or table selection, copying and pasting SHALL preserve the table structure including row count, column count, header rows, and cell content.

**Validates: Requirements 5.10**

### Property 9: Toolbar State Reflection

*For any* text selection with active formatting (bold, italic, underline, etc.), the corresponding toolbar button SHALL be highlighted to indicate the active state.

**Validates: Requirements 7.6**

### Property 10: PDF Export with Format Preservation

*For any* markdown document, exporting to PDF SHALL produce a valid PDF file that preserves all text formatting (bold, italic, underline, strikethrough, code), renders images at appropriate sizes, renders tables with borders and alignment, and renders code blocks with monospace font and background color.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 11: Markdown Round-Trip Preservation

*For any* valid markdown document, parsing to internal structure then serializing back to markdown then parsing again SHALL produce an equivalent internal document structure (idempotent round-trip).

**Validates: Requirements 9.1, 9.4, 9.5**

### Property 12: Invalid Markdown Graceful Handling

*For any* invalid or malformed markdown input, the parser SHALL handle it gracefully without crashing and SHALL produce a best-effort document structure or clear error message.

**Validates: Requirements 9.2**

### Property 13: GFM Syntax Support

*For any* valid GitHub Flavored Markdown syntax (tables, task lists, strikethrough, autolinks), the parser SHALL correctly parse it into the internal document structure.

**Validates: Requirements 9.3**

### Property 14: Whitespace Preservation

*For any* markdown document containing whitespace and line breaks, parsing and serialization SHALL preserve the whitespace according to markdown specifications (e.g., two spaces for line break, blank line for paragraph separation).

**Validates: Requirements 9.6**

### Property 15: Escape Sequence Handling

*For any* markdown document containing escaped special characters (e.g., \*, \#, \[), the parser SHALL treat the escaped character as literal text and not as markdown syntax.

**Validates: Requirements 9.7**

### Property 16: Full Keyboard Navigation

*For any* editor functionality (formatting, inserting blocks, navigating blocks, opening menus), there SHALL exist a keyboard-only method to perform that action without requiring a mouse.

**Validates: Requirements 10.1, 10.4**

### Property 17: ARIA Labels for Interactive Elements

*For any* interactive element in the editor (buttons, inputs, menus, blocks), the element SHALL have an appropriate ARIA label or accessible name for screen readers.

**Validates: Requirements 10.2**

### Property 18: Screen Reader Announcements

*For any* content change in the editor (text insertion, block creation, formatting change), the change SHALL be announced to screen readers via ARIA live regions or equivalent mechanism.

**Validates: Requirements 10.3**

### Property 19: Focus Indicator Visibility

*For any* focusable element in the editor, when focused, a visible focus indicator SHALL be displayed with sufficient contrast to meet accessibility standards.

**Validates: Requirements 10.5**

### Property 20: Block Unique Identifiers

*For any* block in the markdown document, the block SHALL have a unique identifier (UUID) that persists across edits and is used for block identification and future conflict resolution.

**Validates: Requirements 12.2**

### Property 21: Document Version Tracking

*For any* document edit operation, the document version number SHALL increment, allowing change detection and version comparison.

**Validates: Requirements 12.3**

## Error Handling

### Error Categories

1. **Database Errors**
   - Constraint violations (invalid document_type)
   - Connection failures
   - Transaction rollbacks
   - **Handling**: Return structured error responses with error codes, log to monitoring system, display user-friendly messages

2. **Image Upload Errors**
   - Invalid file format
   - File size exceeds limit (>10MB)
   - Storage quota exceeded
   - Network failures during upload
   - **Handling**: Display specific error messages, allow retry, clean up partial uploads

3. **Parsing Errors**
   - Invalid markdown syntax
   - Corrupted JSON content
   - Unsupported markdown features
   - **Handling**: Graceful degradation, best-effort parsing, clear error messages, preserve original content

4. **Export Errors**
   - PDF generation failures
   - Missing images during export
   - Chromium/Puppeteer crashes
   - **Handling**: Retry with fallback renderer, provide partial export, log detailed error information

5. **Validation Errors**
   - Empty document title
   - Invalid image URLs
   - Malformed table structures
   - **Handling**: Client-side validation before submission, clear validation messages, prevent invalid state

### Error Response Format

```typescript
type ErrorResponse = {
  success: false;
  error: {
    code: string; // e.g., "INVALID_DOCUMENT_TYPE", "IMAGE_TOO_LARGE"
    message: string; // User-friendly message
    details?: unknown; // Additional error context
  };
};

type SuccessResponse<T> = {
  success: true;
  data: T;
};

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

### Error Recovery Strategies

1. **Auto-Save Failures**: Queue failed saves, retry with exponential backoff, show "Saving..." indicator
2. **Image Upload Failures**: Allow manual retry, show upload progress, clean up failed uploads
3. **Parse Failures**: Fall back to plain text mode, preserve original content, allow manual correction
4. **Export Failures**: Try alternative renderer (Playwright → Puppeteer), provide HTML export as fallback

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, UI interactions, and integration points
- **Property Tests**: Verify universal properties across all inputs using randomized testing

### Unit Testing

**Framework**: Jest with React Testing Library

**Test Categories**:

1. **Component Tests**
   - MarkdownEditor renders correctly
   - Slash command menu opens on '/' key
   - Toolbar buttons trigger correct commands
   - Image upload dialog opens
   - Block hover menu appears on hover

2. **Integration Tests**
   - Document creation with 'md' type
   - Image upload flow (presigned URL → upload → confirm)
   - Auto-save debouncing
   - PDF export flow

3. **Edge Cases**
   - Empty document handling
   - Very large documents (>1000 blocks)
   - Malformed JSON content recovery
   - Network failure during save
   - Concurrent edit conflicts

4. **Accessibility Tests**
   - Keyboard navigation through toolbar
   - Screen reader announcements (using jest-axe)
   - Focus management
   - ARIA label presence

**Example Unit Test**:
```typescript
describe('MarkdownEditor', () => {
  it('should open slash command menu when typing /', async () => {
    const { container } = render(<MarkdownEditor content={null} />);
    const editor = container.querySelector('.ProseMirror');
    
    await userEvent.type(editor, '/');
    
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Bulleted List')).toBeInTheDocument();
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Tag Format**: 
```typescript
// Feature: markdown-document-type, Property 1: Document Type Constraint Enforcement
```

**Property Test Categories**:

1. **Document Type Validation** (Property 1)
   - Generate random document_type values
   - Verify only valid types are accepted

2. **Markdown Round-Trip** (Property 11)
   - Generate random valid markdown documents
   - Verify parse → serialize → parse produces equivalent structure

3. **Image Format Validation** (Property 6)
   - Generate random MIME types
   - Verify only valid image formats are accepted

4. **Text Formatting Preservation** (Property 7, 10)
   - Generate random formatted text
   - Verify formatting preserved in tables and PDF export

5. **Whitespace Preservation** (Property 14)
   - Generate markdown with various whitespace patterns
   - Verify whitespace preserved according to spec

6. **Escape Sequence Handling** (Property 15)
   - Generate markdown with escaped characters
   - Verify escaped characters treated as literals

7. **Keyboard Navigation** (Property 16)
   - Generate random editor states
   - Verify all actions accessible via keyboard

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: markdown-document-type, Property 11: Markdown Round-Trip Preservation
describe('Markdown Parser', () => {
  it('should preserve structure through round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.record({
          headings: fc.array(fc.record({
            level: fc.integer({ min: 1, max: 3 }),
            text: fc.string(),
          })),
          paragraphs: fc.array(fc.string()),
          lists: fc.array(fc.array(fc.string())),
        }),
        (doc) => {
          const markdown = serializeToMarkdown(doc);
          const parsed = parseMarkdown(markdown);
          const markdown2 = serializeToMarkdown(parsed);
          const parsed2 = parseMarkdown(markdown2);
          
          expect(parsed2).toEqual(parsed);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Property Test Implementation

Each correctness property from the design document MUST be implemented as a property-based test:

| Property | Test File | Generator |
|----------|-----------|-----------|
| Property 1: Document Type Constraint | `__tests__/properties/documentType.test.ts` | `fc.oneof(fc.constant('screenplay'), fc.constant('document'), fc.constant('md'), fc.string())` |
| Property 11: Markdown Round-Trip | `__tests__/properties/markdownRoundTrip.test.ts` | Custom markdown document generator |
| Property 6: Image Format Validation | `__tests__/properties/imageFormat.test.ts` | `fc.oneof(validMimeTypes, fc.string())` |
| Property 14: Whitespace Preservation | `__tests__/properties/whitespace.test.ts` | Markdown with various whitespace patterns |
| Property 15: Escape Sequence Handling | `__tests__/properties/escapeSequence.test.ts` | Markdown with escaped characters |

### Test Coverage Goals

- **Unit Test Coverage**: >80% line coverage for all markdown-related code
- **Property Test Coverage**: All 21 correctness properties implemented
- **Integration Test Coverage**: All user workflows (create, edit, upload, export)
- **Accessibility Test Coverage**: All interactive elements tested with jest-axe

### Testing Tools

- **Unit Testing**: Jest, React Testing Library, @testing-library/user-event
- **Property Testing**: fast-check
- **Accessibility Testing**: jest-axe, axe-core
- **Visual Regression**: Playwright (for UI components)
- **E2E Testing**: Playwright (for full workflows)

## Implementation Plan

### Phase 1: Database and Core Infrastructure (Week 1)

1. Create database migration for 'md' document type
2. Update TypeScript types for document_type
3. Create markdownKit.ts with Tiptap extensions
4. Set up testing infrastructure (Jest, fast-check)

### Phase 2: Editor Component (Week 2-3)

1. Implement MarkdownEditor component
2. Add slash command menu
3. Implement markdown shortcuts
4. Add auto-save with debouncing
5. Implement block hover menu
6. Add drag-and-drop reordering

### Phase 3: Image Upload (Week 3)

1. Extend image upload actions for markdown
2. Implement image upload UI (drag-drop, file picker, paste)
3. Add image resizing and alignment
4. Implement alt text input

### Phase 4: Toolbar and UI (Week 4)

1. Create MarkdownToolbar component
2. Implement toolbar button states
3. Add document type selection to NewDocumentModal
4. Implement character/word count indicator

### Phase 5: Export System (Week 5)

1. Implement markdown serializer
2. Create HTML renderer for markdown
3. Extend PDF export system for markdown
4. Add page settings UI

### Phase 6: Accessibility and Polish (Week 6)

1. Add ARIA labels to all interactive elements
2. Implement keyboard shortcuts
3. Add screen reader announcements
4. Test with screen readers (NVDA, JAWS, VoiceOver)
5. Ensure WCAG AA compliance

### Phase 7: Performance Optimization (Week 7)

1. Implement virtualization for large documents
2. Add lazy loading for images
3. Optimize auto-save debouncing
4. Add caching for rendered content

### Phase 8: Testing and Documentation (Week 8)

1. Write unit tests (target >80% coverage)
2. Implement all property-based tests
3. Write integration tests
4. Perform accessibility audit
5. Write user documentation

## Dependencies

### External Libraries

- **@tiptap/react**: ^3.19.0 (already installed)
- **@tiptap/starter-kit**: ^3.19.0 (already installed)
- **@tiptap/extension-link**: New dependency
- **@tiptap/extension-image**: New dependency
- **@tiptap/extension-table**: New dependency
- **@tiptap/extension-table-row**: New dependency
- **@tiptap/extension-table-cell**: New dependency
- **@tiptap/extension-table-header**: New dependency
- **@tiptap/extension-code-block-lowlight**: New dependency
- **lowlight**: New dependency (syntax highlighting)
- **fast-check**: New dev dependency (property-based testing)
- **jest-axe**: New dev dependency (accessibility testing)

### Internal Dependencies

- Existing document CRUD actions
- Existing image upload system (document_assets)
- Existing PDF export system
- Existing Supabase client utilities

## Security Considerations

1. **Image Upload Security**
   - Validate file types on both client and server
   - Scan uploaded images for malware
   - Enforce file size limits (10MB)
   - Use presigned URLs with expiration
   - Sanitize filenames to prevent path traversal

2. **Content Security**
   - Sanitize markdown input to prevent XSS
   - Validate JSON content structure
   - Escape user-generated content in exports
   - Use Content Security Policy headers

3. **Access Control**
   - Verify document ownership before operations
   - Check project membership for document access
   - Validate asset ownership before deletion
   - Use row-level security in Supabase

4. **Rate Limiting**
   - Limit image upload frequency
   - Throttle auto-save requests
   - Rate limit PDF export requests

## Performance Considerations

1. **Editor Performance**
   - Use virtualization for documents >1000 blocks
   - Debounce auto-save (1000ms default)
   - Lazy load images as they enter viewport
   - Use React.memo for toolbar components
   - Optimize re-renders with useMemo/useCallback

2. **Image Optimization**
   - Compress images on upload
   - Generate thumbnails for large images
   - Use responsive image sizes
   - Implement progressive loading

3. **Export Performance**
   - Cache rendered HTML for repeated exports
   - Use worker threads for PDF generation
   - Stream large PDFs instead of buffering
   - Implement export queue for multiple requests

4. **Database Performance**
   - Index document_type column
   - Use partial indexes for markdown documents
   - Batch asset deletions
   - Optimize JSON content queries

## Monitoring and Observability

1. **Metrics to Track**
   - Document creation rate by type
   - Average document size (blocks, characters)
   - Image upload success/failure rate
   - PDF export duration and success rate
   - Auto-save frequency and latency
   - Editor load time

2. **Error Tracking**
   - Parse failures with sample content
   - Image upload failures with error codes
   - PDF export failures with renderer info
   - Database constraint violations

3. **User Analytics**
   - Most used markdown features
   - Slash command usage frequency
   - Keyboard shortcut adoption
   - Average editing session duration

## Future Enhancements

1. **Real-Time Collaboration**
   - Implement CRDT-based conflict resolution
   - Add presence indicators
   - Show cursor positions of other users
   - Implement operational transformation

2. **Advanced Features**
   - Math equation support (KaTeX)
   - Diagram support (Mermaid)
   - Embed support (YouTube, Twitter, etc.)
   - Custom block types
   - Template system

3. **Export Options**
   - Export to DOCX
   - Export to HTML
   - Export to plain markdown file
   - Custom export templates

4. **AI Integration**
   - AI-powered writing suggestions
   - Auto-completion
   - Grammar and style checking
   - Content summarization

## Conclusion

This design provides a comprehensive implementation plan for adding markdown document type support to the application. The architecture follows established patterns from existing editors while introducing modern features like slash commands and block-based editing. The dual testing approach with both unit tests and property-based tests ensures correctness and robustness. The implementation is designed for extensibility, with future collaboration features in mind through CRDT-compatible data structures.
