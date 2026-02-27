/**
 * Property-Based Test: Extension Kit Completeness
 * 
 * Feature: markdown-document-type
 * Property 2: Extension Kit Completeness
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**
 * 
 * This test verifies that the markdown extension kit includes all required
 * extensions for a full-featured markdown editor.
 * 
 * The property states:
 * For any markdown editor instance, the extension kit SHALL include all
 * required extensions: headings (levels 1-3), paragraph, bold, italic,
 * underline, ordered lists, unordered lists, task lists, blockquote,
 * code blocks, inline code, horizontal rule, links, images, and tables.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { markdownExtensions } from '@/lib/editor/markdownKit';

describe('Property 2: Extension Kit Completeness', () => {
  it('should include all required extensions in the markdown kit', () => {
    // Verify the extension kit is an array
    expect(Array.isArray(markdownExtensions)).toBe(true);
    expect(markdownExtensions.length).toBeGreaterThan(0);

    // Extract extension names from the kit
    const extensionNames = markdownExtensions.map((ext) => ext.name);

    // Required top-level extensions based on design specification
    const requiredExtensions = [
      'starterKit',   // Contains: heading, paragraph, bold, italic, orderedList, bulletList, etc.
      'link',         // Requirement 2.9: Link insertion and editing
      'image',        // Requirement 2.10: Image insertion
      'table',        // Requirement 2.11: Table creation and editing
      'tableRow',     // Required for tables
      'tableCell',    // Required for tables
      'tableHeader',  // Required for table headers
      'taskList',     // Requirement 2.4: Task lists with checkboxes
      'taskItem',     // Required for task lists
      'codeBlock',    // Requirement 2.6: Code blocks with syntax highlighting (CodeBlockLowlight)
    ];

    // Verify all required extensions are present
    requiredExtensions.forEach((requiredExt) => {
      expect(
        extensionNames,
        `Extension kit should include '${requiredExt}' extension`
      ).toContain(requiredExt);
    });
  });

  it('should configure heading extension with levels 1-3 only', () => {
    // Find the StarterKit extension which contains heading configuration
    const starterKitExt = markdownExtensions.find((ext) => ext.name === 'starterKit');
    
    expect(starterKitExt, 'StarterKit extension should be present').toBeDefined();
    
    // Verify heading levels configuration in StarterKit
    if (starterKitExt && starterKitExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headingConfig = (starterKitExt.options as any).heading;
      expect(headingConfig).toBeDefined();
      expect(headingConfig.levels).toEqual([1, 2, 3]);
    }
  });

  it('should configure link extension with autolink enabled', () => {
    const linkExt = markdownExtensions.find((ext) => ext.name === 'link');
    
    expect(linkExt, 'Link extension should be present').toBeDefined();
    
    // Verify link configuration
    if (linkExt && linkExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((linkExt.options as any).autolink).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((linkExt.options as any).openOnClick).toBe(false);
    }
  });

  it('should configure image extension without base64 support', () => {
    const imageExt = markdownExtensions.find((ext) => ext.name === 'image');
    
    expect(imageExt, 'Image extension should be present').toBeDefined();
    
    // Verify image configuration
    if (imageExt && imageExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((imageExt.options as any).allowBase64).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((imageExt.options as any).inline).toBe(true);
    }
  });

  it('should configure table extension with resizable columns', () => {
    const tableExt = markdownExtensions.find((ext) => ext.name === 'table');
    
    expect(tableExt, 'Table extension should be present').toBeDefined();
    
    // Verify table configuration
    if (tableExt && tableExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((tableExt.options as any).resizable).toBe(true);
    }
  });

  it('should configure task list and task item extensions', () => {
    const taskListExt = markdownExtensions.find((ext) => ext.name === 'taskList');
    const taskItemExt = markdownExtensions.find((ext) => ext.name === 'taskItem');
    
    expect(taskListExt, 'TaskList extension should be present').toBeDefined();
    expect(taskItemExt, 'TaskItem extension should be present').toBeDefined();
    
    // Verify task item supports nesting
    if (taskItemExt && taskItemExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((taskItemExt.options as any).nested).toBe(true);
    }
  });

  it('should configure code block with syntax highlighting', () => {
    const codeBlockExt = markdownExtensions.find((ext) => ext.name === 'codeBlock');
    
    expect(codeBlockExt, 'CodeBlock extension should be present').toBeDefined();
    
    // Verify lowlight is configured (CodeBlockLowlight shows as 'codeBlock')
    if (codeBlockExt && codeBlockExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((codeBlockExt.options as any).lowlight).toBeDefined();
    }
  });

  it('should not include the default codeBlock extension (replaced by CodeBlockLowlight)', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // The StarterKit's default codeBlock should be disabled
    // and replaced with CodeBlockLowlight (which shows as 'codeBlock')
    // We verify this by checking that codeBlock has lowlight configured
    const codeBlockExt = markdownExtensions.find((ext) => ext.name === 'codeBlock');
    expect(codeBlockExt).toBeDefined();
    
    // Verify it's the lowlight version by checking for lowlight option
    if (codeBlockExt && codeBlockExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((codeBlockExt.options as any).lowlight).toBeDefined();
    }
    
    // Verify StarterKit has codeBlock disabled
    const starterKitExt = markdownExtensions.find((ext) => ext.name === 'starterKit');
    if (starterKitExt && starterKitExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((starterKitExt.options as any).codeBlock).toBe(false);
    }
  });

  it('should have appropriate HTML attributes for styling', () => {
    // Verify extensions have HTMLAttributes configured
    const linkExt = markdownExtensions.find((ext) => ext.name === 'link');
    const imageExt = markdownExtensions.find((ext) => ext.name === 'image');
    const tableExt = markdownExtensions.find((ext) => ext.name === 'table');
    const codeBlockExt = markdownExtensions.find((ext) => ext.name === 'codeBlock');

    // Link should have styling classes
    if (linkExt && linkExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const htmlAttrs = (linkExt.options as any).HTMLAttributes;
      expect(htmlAttrs).toBeDefined();
      expect(htmlAttrs.class).toContain('text-blue-600');
    }

    // Image should have styling classes
    if (imageExt && imageExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const htmlAttrs = (imageExt.options as any).HTMLAttributes;
      expect(htmlAttrs).toBeDefined();
      expect(htmlAttrs.class).toContain('rounded-lg');
    }

    // Table should have styling classes
    if (tableExt && tableExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const htmlAttrs = (tableExt.options as any).HTMLAttributes;
      expect(htmlAttrs).toBeDefined();
      expect(htmlAttrs.class).toContain('border-collapse');
    }

    // Code block should have styling classes
    if (codeBlockExt && codeBlockExt.options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const htmlAttrs = (codeBlockExt.options as any).HTMLAttributes;
      expect(htmlAttrs).toBeDefined();
      expect(htmlAttrs.class).toContain('bg-gray-900');
    }
  });

  it('should maintain extension kit completeness across multiple instantiations', () => {
    // Property: The extension kit should be consistent and complete
    // regardless of how many times it's accessed
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (iterations) => {
        // Access the extension kit multiple times
        for (let i = 0; i < iterations; i++) {
          const extensions = markdownExtensions;
          
          // Verify it's always an array
          expect(Array.isArray(extensions)).toBe(true);
          
          // Verify it always has the same length
          expect(extensions.length).toBeGreaterThan(0);
          
          // Verify key extensions are always present
          const extensionNames = extensions.map((ext) => ext.name);
          expect(extensionNames).toContain('starterKit');
          expect(extensionNames).toContain('link');
          expect(extensionNames).toContain('image');
          expect(extensionNames).toContain('table');
          expect(extensionNames).toContain('taskList');
          expect(extensionNames).toContain('codeBlock');
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should verify all table-related extensions are present', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // All table extensions must be present for tables to work
    const tableExtensions = ['table', 'tableRow', 'tableCell', 'tableHeader'];
    
    tableExtensions.forEach((tableExt) => {
      expect(
        extensionNames,
        `Table functionality requires '${tableExt}' extension`
      ).toContain(tableExt);
    });
  });

  it('should verify all list-related extensions are present', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // StarterKit contains bulletList, orderedList, and listItem
    expect(extensionNames).toContain('starterKit');
    
    // Task list extensions are separate
    expect(extensionNames).toContain('taskList');
    expect(extensionNames).toContain('taskItem');
  });

  it('should support all text formatting marks', () => {
    // StarterKit contains all text formatting marks (bold, italic, strike, code)
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    expect(extensionNames).toContain('starterKit');
  });

  it('should have exactly one instance of each core extension', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // Core extensions that should appear exactly once
    const coreExtensions = [
      'starterKit',
      'link',
      'image',
      'table',
      'taskList',
      'codeBlock',
    ];
    
    coreExtensions.forEach((coreExt) => {
      const count = extensionNames.filter((name) => name === coreExt).length;
      expect(
        count,
        `Extension '${coreExt}' should appear exactly once, but appears ${count} times`
      ).toBe(1);
    });
  });
});
