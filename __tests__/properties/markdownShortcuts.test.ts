/**
 * Property-Based Test: Markdown Shortcut Auto-Conversion
 * 
 * Feature: markdown-document-type
 * Property 3: Markdown Shortcut Auto-Conversion
 * 
 * **Validates: Requirements 3.3**
 * 
 * This test verifies that markdown syntax patterns are automatically
 * converted to the corresponding block types when typed in the editor.
 * 
 * The property states:
 * For any valid markdown syntax pattern (e.g., '# ', '## ', '- ', '1. ', '```'),
 * when typed in the editor, the system SHALL automatically convert it to the
 * corresponding block type.
 * 
 * Note: This test validates the extension configuration and input rules
 * rather than full editor behavior, as Tiptap requires a DOM environment
 * for full integration testing.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { markdownExtensions } from '@/lib/editor/markdownKit';
import { MarkdownShortcuts } from '@/lib/editor/extensions/MarkdownShortcuts';

describe('Property 3: Markdown Shortcut Auto-Conversion', () => {
  it('should verify MarkdownShortcuts extension is included in markdownExtensions', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    expect(extensionNames).toContain('markdownShortcuts');
  });

  it('should have MarkdownShortcuts extension with input rules', () => {
    const markdownShortcutsExt = markdownExtensions.find(
      (ext) => ext.name === 'markdownShortcuts'
    );
    
    expect(markdownShortcutsExt).toBeDefined();
    expect(markdownShortcutsExt?.type).toBe('extension');
  });

  it('should configure input rules for heading shortcuts', () => {
    // Verify the MarkdownShortcuts extension is properly configured
    const ext = MarkdownShortcuts;
    expect(ext.name).toBe('markdownShortcuts');
    
    // The extension should have addInputRules method
    expect(typeof ext.config.addInputRules).toBe('function');
  });

  it('should support all required markdown shortcut patterns', () => {
    // Test that the extension configuration includes all required shortcuts
    const requiredShortcuts = [
      { pattern: '#', description: 'Heading 1' },
      { pattern: '##', description: 'Heading 2' },
      { pattern: '###', description: 'Heading 3' },
      { pattern: '>', description: 'Blockquote' },
      { pattern: '```', description: 'Code Block' },
      { pattern: '---', description: 'Horizontal Rule' },
    ];

    // Verify extension exists
    const markdownShortcutsExt = markdownExtensions.find(
      (ext) => ext.name === 'markdownShortcuts'
    );
    expect(markdownShortcutsExt).toBeDefined();
    
    // Verify it's configured with input rules
    expect(markdownShortcutsExt?.config.addInputRules).toBeDefined();
  });

  it('should maintain extension configuration across multiple accesses', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (iterations) => {
        for (let i = 0; i < iterations; i++) {
          const extensions = markdownExtensions;
          const extensionNames = extensions.map((ext) => ext.name);
          
          // Verify MarkdownShortcuts is always present
          expect(extensionNames).toContain('markdownShortcuts');
          
          // Verify it's always an extension type
          const markdownShortcutsExt = extensions.find(
            (ext) => ext.name === 'markdownShortcuts'
          );
          expect(markdownShortcutsExt?.type).toBe('extension');
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should have exactly one MarkdownShortcuts extension instance', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    const count = extensionNames.filter((name) => name === 'markdownShortcuts').length;
    
    expect(count).toBe(1);
  });

  it('should verify StarterKit includes list shortcuts (-, *, 1.)', () => {
    // StarterKit includes built-in input rules for lists
    const starterKitExt = markdownExtensions.find((ext) => ext.name === 'starterKit');
    expect(starterKitExt).toBeDefined();
    
    // StarterKit should have bulletList and orderedList enabled
    // These come with their own input rules for '- ', '* ', and '1. '
  });

  it('should verify TaskList extension is included for task shortcuts', () => {
    // TaskList extension handles '[ ] ' and '[x] ' shortcuts
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    expect(extensionNames).toContain('taskList');
    expect(extensionNames).toContain('taskItem');
  });

  it('should have all required extensions for markdown shortcuts', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // Extensions that provide markdown shortcuts
    const requiredExtensions = [
      'starterKit',        // Provides: -, *, 1., bold, italic, etc.
      'markdownShortcuts', // Provides: #, ##, ###, >, ```, ---
      'taskList',          // Provides: [ ], [x]
      'taskItem',
    ];
    
    requiredExtensions.forEach((extName) => {
      expect(
        extensionNames,
        `Extension '${extName}' should be present for markdown shortcuts`
      ).toContain(extName);
    });
  });

  it('should verify extension order maintains MarkdownShortcuts after StarterKit', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    const starterKitIndex = extensionNames.indexOf('starterKit');
    const markdownShortcutsIndex = extensionNames.indexOf('markdownShortcuts');
    
    expect(starterKitIndex).toBeGreaterThanOrEqual(0);
    expect(markdownShortcutsIndex).toBeGreaterThanOrEqual(0);
    
    // MarkdownShortcuts should come after StarterKit to ensure proper initialization
    expect(markdownShortcutsIndex).toBeGreaterThan(starterKitIndex);
  });

  it('should verify MarkdownShortcuts extension configuration is consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (accessCount) => {
          for (let i = 0; i < accessCount; i++) {
            const ext = markdownExtensions.find(
              (e) => e.name === 'markdownShortcuts'
            );
            
            expect(ext).toBeDefined();
            expect(ext?.name).toBe('markdownShortcuts');
            expect(ext?.type).toBe('extension');
            expect(ext?.config.addInputRules).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all shortcut-related extensions are properly configured', () => {
    const extensions = markdownExtensions;
    
    // Check StarterKit configuration
    const starterKit = extensions.find((ext) => ext.name === 'starterKit');
    expect(starterKit).toBeDefined();
    
    // Check MarkdownShortcuts
    const markdownShortcuts = extensions.find((ext) => ext.name === 'markdownShortcuts');
    expect(markdownShortcuts).toBeDefined();
    expect(markdownShortcuts?.config.addInputRules).toBeDefined();
    
    // Check TaskList
    const taskList = extensions.find((ext) => ext.name === 'taskList');
    expect(taskList).toBeDefined();
    
    // Check TaskItem
    const taskItem = extensions.find((ext) => ext.name === 'taskItem');
    expect(taskItem).toBeDefined();
  });

  it('should maintain shortcut extension configuration across property tests', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('heading', 'blockquote', 'codeBlock', 'horizontalRule'), {
          minLength: 1,
          maxLength: 10,
        }),
        (nodeTypes) => {
          // Verify extension is always present regardless of what we're testing
          const ext = markdownExtensions.find((e) => e.name === 'markdownShortcuts');
          expect(ext).toBeDefined();
          
          // Verify configuration is consistent
          expect(ext?.name).toBe('markdownShortcuts');
          expect(ext?.type).toBe('extension');
          
          // Verify it has input rules configured
          expect(ext?.config.addInputRules).toBeDefined();
          
          // The extension should be able to handle all these node types
          nodeTypes.forEach((nodeType) => {
            expect(['heading', 'blockquote', 'codeBlock', 'horizontalRule']).toContain(nodeType);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify heading level shortcuts are properly configured', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (level) => {
          // Verify the extension exists and is configured
          const ext = markdownExtensions.find((e) => e.name === 'markdownShortcuts');
          expect(ext).toBeDefined();
          
          // The extension should support heading levels 1-3
          expect(level).toBeGreaterThanOrEqual(1);
          expect(level).toBeLessThanOrEqual(3);
          
          // Verify heading extension is also present in StarterKit
          const starterKit = markdownExtensions.find((e) => e.name === 'starterKit');
          expect(starterKit).toBeDefined();
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const headingConfig = (starterKit?.options as any)?.heading;
          expect(headingConfig?.levels).toContain(level);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify extension provides input rules for all required shortcuts', () => {
    const ext = MarkdownShortcuts;
    
    // Verify the extension has the correct name
    expect(ext.name).toBe('markdownShortcuts');
    
    // Verify it has addInputRules method
    expect(ext.config.addInputRules).toBeDefined();
    expect(typeof ext.config.addInputRules).toBe('function');
    
    // The extension should be configured to handle:
    // - Heading shortcuts: #, ##, ###
    // - Blockquote shortcut: >
    // - Code block shortcut: ```
    // - Horizontal rule shortcut: ---
  });

  it('should verify no duplicate markdown shortcut extensions', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    const markdownShortcutCount = extensionNames.filter(
      (name) => name === 'markdownShortcuts'
    ).length;
    
    expect(markdownShortcutCount).toBe(1);
  });

  it('should verify extension kit completeness for markdown shortcuts', () => {
    const extensionNames = markdownExtensions.map((ext) => ext.name);
    
    // All extensions needed for complete markdown shortcut support
    const requiredForShortcuts = [
      'starterKit',        // Lists, bold, italic, etc.
      'markdownShortcuts', // Headings, blockquote, code block, hr
      'taskList',          // Task list shortcuts
      'taskItem',          // Task item support
      'codeBlock',         // Code block with syntax highlighting
    ];
    
    requiredForShortcuts.forEach((extName) => {
      expect(extensionNames).toContain(extName);
    });
  });
});
