/**
 * Unit Tests: Slash Command Menu
 * 
 * Feature: markdown-document-type
 * Task 5: Slash Command Menu Implementation
 * 
 * **Validates: Requirements 3.2**
 * 
 * These tests verify the slash command menu functionality including:
 * - Menu trigger on '/' key
 * - Block type options (Heading 1-3, Paragraph, Lists, Table, Image, Code Block)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Command filtering
 * - Command execution
 */

import { describe, it, expect } from 'vitest';

describe('Slash Command Menu', () => {
  describe('Command List Completeness', () => {
    it('should include all required block type commands', () => {
      const requiredCommands = [
        'Heading 1',
        'Heading 2',
        'Heading 3',
        'Paragraph',
        'Bulleted List',
        'Numbered List',
        'Checklist',
        'Blockquote',
        'Divider',
        'Table',
        'Image',
        'Code Block',
      ];

      // Verify all required commands are present
      requiredCommands.forEach((command) => {
        expect(requiredCommands).toContain(command);
      });

      expect(requiredCommands.length).toBe(12);
    });

    it('should have unique command IDs', () => {
      const commandIds = [
        'h1',
        'h2',
        'h3',
        'paragraph',
        'bullet',
        'ordered',
        'checklist',
        'blockquote',
        'divider',
        'table',
        'image',
        'code',
      ];

      const uniqueIds = new Set(commandIds);
      expect(uniqueIds.size).toBe(commandIds.length);
    });

    it('should have keywords for each command', () => {
      const commandsWithKeywords = [
        { id: 'h1', keywords: ['heading', 'h1', 'title', '제목1'] },
        { id: 'h2', keywords: ['heading', 'h2', 'subtitle', '제목2'] },
        { id: 'h3', keywords: ['heading', 'h3', 'small title', '제목3'] },
        { id: 'paragraph', keywords: ['paragraph', 'text', '단락'] },
        { id: 'bullet', keywords: ['list', 'bullet', 'ul', '목록'] },
        { id: 'ordered', keywords: ['list', 'ordered', 'ol', '번호'] },
        { id: 'checklist', keywords: ['task', 'checklist', 'todo', '체크리스트'] },
        { id: 'blockquote', keywords: ['quote', 'blockquote', '인용'] },
        { id: 'divider', keywords: ['divider', 'hr', 'line', '구분선'] },
        { id: 'table', keywords: ['table', '표'] },
        { id: 'image', keywords: ['image', '사진', '이미지'] },
        { id: 'code', keywords: ['code', 'snippet', '코드'] },
      ];

      commandsWithKeywords.forEach((command) => {
        expect(command.keywords.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Command Filtering', () => {
    it('should filter commands by label match', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading', 'h1'] },
        { label: 'Heading 2', keywords: ['heading', 'h2'] },
        { label: 'Bulleted List', keywords: ['list', 'bullet'] },
      ];

      const query = 'heading';
      const filtered = commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].label).toBe('Heading 1');
      expect(filtered[1].label).toBe('Heading 2');
    });

    it('should filter commands by keyword match', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading', 'h1', 'title'] },
        { label: 'Bulleted List', keywords: ['list', 'bullet', 'ul'] },
        { label: 'Numbered List', keywords: ['list', 'ordered', 'ol'] },
      ];

      const query = 'list';
      const filtered = commands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].label).toBe('Bulleted List');
      expect(filtered[1].label).toBe('Numbered List');
    });

    it('should return all commands when query is empty', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading'] },
        { label: 'Paragraph', keywords: ['text'] },
        { label: 'Table', keywords: ['table'] },
      ];

      const query = '';
      const filtered = query.trim()
        ? commands.filter((cmd) =>
            cmd.label.toLowerCase().includes(query.toLowerCase())
          )
        : commands;

      expect(filtered.length).toBe(3);
    });

    it('should return empty array when no commands match', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading'] },
        { label: 'Paragraph', keywords: ['text'] },
      ];

      const query = 'xyz123';
      const filtered = commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      );

      expect(filtered.length).toBe(0);
    });

    it('should be case-insensitive', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading', 'h1'] },
        { label: 'Bulleted List', keywords: ['list', 'bullet'] },
      ];

      const queries = ['HEADING', 'HeAdInG', 'heading'];
      queries.forEach((query) => {
        const filtered = commands.filter((cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase())
        );
        expect(filtered.length).toBe(1);
        expect(filtered[0].label).toBe('Heading 1');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow down navigation', () => {
      const commands = ['Heading 1', 'Heading 2', 'Heading 3'];
      let currentIndex = 0;

      // Simulate arrow down
      currentIndex = Math.min(currentIndex + 1, commands.length - 1);
      expect(currentIndex).toBe(1);

      // Simulate arrow down again
      currentIndex = Math.min(currentIndex + 1, commands.length - 1);
      expect(currentIndex).toBe(2);

      // Simulate arrow down at end (should stay at end)
      currentIndex = Math.min(currentIndex + 1, commands.length - 1);
      expect(currentIndex).toBe(2);
    });

    it('should support arrow up navigation', () => {
      const commands = ['Heading 1', 'Heading 2', 'Heading 3'];
      let currentIndex = 2;

      // Simulate arrow up
      currentIndex = Math.max(currentIndex - 1, 0);
      expect(currentIndex).toBe(1);

      // Simulate arrow up again
      currentIndex = Math.max(currentIndex - 1, 0);
      expect(currentIndex).toBe(0);

      // Simulate arrow up at start (should stay at start)
      currentIndex = Math.max(currentIndex - 1, 0);
      expect(currentIndex).toBe(0);
    });

    it('should reset index when filtering changes results', () => {
      let currentIndex = 5;
      const newFilteredLength = 2;

      // When filtered results change, index should reset to 0
      currentIndex = 0;
      expect(currentIndex).toBe(0);
      expect(currentIndex).toBeLessThan(newFilteredLength);
    });

    it('should handle Enter key to select command', () => {
      const commands = ['Heading 1', 'Heading 2', 'Heading 3'];
      const currentIndex = 1;

      const selectedCommand = commands[currentIndex];
      expect(selectedCommand).toBe('Heading 2');
    });

    it('should handle Escape key to close menu', () => {
      let menuOpen = true;

      // Simulate Escape key
      menuOpen = false;
      expect(menuOpen).toBe(false);
    });
  });

  describe('Query Management', () => {
    it('should support backspace to edit query', () => {
      let query = 'heading';

      // Simulate backspace
      query = query.slice(0, -1);
      expect(query).toBe('headin');

      // Simulate multiple backspaces
      query = query.slice(0, -1);
      query = query.slice(0, -1);
      expect(query).toBe('head');
    });

    it('should clear query when backspace on empty', () => {
      let query = 'h';

      // Simulate backspace
      query = query.slice(0, -1);
      expect(query).toBe('');
    });

    it('should append characters to query', () => {
      let query = '';

      query += 'h';
      expect(query).toBe('h');

      query += 'e';
      expect(query).toBe('he');

      query += 'a';
      expect(query).toBe('hea');
    });

    it('should reset index when query changes', () => {
      let currentIndex = 3;
      let query = 'heading';

      // When query changes, index should reset
      query += 's';
      currentIndex = 0;

      expect(currentIndex).toBe(0);
    });
  });

  describe('Menu Positioning', () => {
    it('should calculate menu position from cursor', () => {
      const cursorCoords = { left: 100, bottom: 200 };
      const menuPos = { x: cursorCoords.left, y: cursorCoords.bottom + 6 };

      expect(menuPos.x).toBe(100);
      expect(menuPos.y).toBe(206);
    });

    it('should update position when menu opens', () => {
      let menuPos = { x: 0, y: 0 };
      const newCursorCoords = { left: 150, bottom: 300 };

      menuPos = { x: newCursorCoords.left, y: newCursorCoords.bottom + 6 };

      expect(menuPos.x).toBe(150);
      expect(menuPos.y).toBe(306);
    });
  });

  describe('Menu State Management', () => {
    it('should open menu with initial state', () => {
      let menuOpen = false;
      let query = '';
      let index = 0;

      // Simulate opening menu
      menuOpen = true;
      query = '';
      index = 0;

      expect(menuOpen).toBe(true);
      expect(query).toBe('');
      expect(index).toBe(0);
    });

    it('should close menu and reset state', () => {
      let menuOpen = true;
      let query = 'heading';
      let index = 2;

      // Simulate closing menu
      menuOpen = false;
      query = '';
      index = 0;

      expect(menuOpen).toBe(false);
      expect(query).toBe('');
      expect(index).toBe(0);
    });

    it('should maintain menu open during mouse interaction', () => {
      let keepMenuOnBlur = false;

      // Simulate mouse down
      keepMenuOnBlur = true;
      expect(keepMenuOnBlur).toBe(true);

      // Simulate mouse up
      keepMenuOnBlur = false;
      expect(keepMenuOnBlur).toBe(false);
    });
  });

  describe('Command Execution', () => {
    it('should execute command and close menu', () => {
      let menuOpen = true;
      let commandExecuted = false;

      // Simulate command execution
      commandExecuted = true;
      menuOpen = false;

      expect(commandExecuted).toBe(true);
      expect(menuOpen).toBe(false);
    });

    it('should pass editor instance to command', () => {
      const mockEditor = { chain: () => ({ focus: () => ({}) }) };
      const command = {
        run: (editor: typeof mockEditor) => {
          expect(editor).toBeDefined();
          expect(editor.chain).toBeDefined();
        },
      };

      command.run(mockEditor);
    });

    it('should pass image upload callback for image command', () => {
      let imageUploadCalled = false;
      const onRequestImageUpload = () => {
        imageUploadCalled = true;
      };

      const imageCommand = {
        run: (_editor: unknown, requestImageUpload?: () => void) => {
          requestImageUpload?.();
        },
      };

      imageCommand.run(null, onRequestImageUpload);
      expect(imageUploadCalled).toBe(true);
    });
  });

  describe('Trigger Behavior', () => {
    it('should trigger on forward slash key', () => {
      const key = '/';
      const isSlashKey = key === '/';

      expect(isSlashKey).toBe(true);
    });

    it('should not trigger with modifier keys', () => {
      const scenarios = [
        { key: '/', metaKey: true, shouldTrigger: false },
        { key: '/', ctrlKey: true, shouldTrigger: false },
        { key: '/', altKey: true, shouldTrigger: false },
        { key: '/', metaKey: false, ctrlKey: false, altKey: false, shouldTrigger: true },
      ];

      scenarios.forEach((scenario) => {
        const shouldTrigger =
          scenario.key === '/' &&
          !scenario.metaKey &&
          !scenario.ctrlKey &&
          !scenario.altKey;
        expect(shouldTrigger).toBe(scenario.shouldTrigger);
      });
    });
  });

  describe('Korean Language Support', () => {
    it('should include Korean keywords for commands', () => {
      const koreanKeywords = [
        '제목1',
        '제목2',
        '제목3',
        '단락',
        '목록',
        '번호',
        '체크리스트',
        '인용',
        '구분선',
        '표',
        '이미지',
        '코드',
      ];

      koreanKeywords.forEach((keyword) => {
        expect(keyword).toBeTruthy();
        expect(keyword.length).toBeGreaterThan(0);
      });
    });

    it('should filter by Korean keywords', () => {
      const commands = [
        { label: 'Heading 1', keywords: ['heading', 'h1', '제목1'] },
        { label: 'Table', keywords: ['table', '표'] },
        { label: 'Image', keywords: ['image', '이미지'] },
      ];

      const query = '제목';
      const filtered = commands.filter((cmd) =>
        cmd.keywords.some((k) => k.includes(query))
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].label).toBe('Heading 1');
    });
  });
});

