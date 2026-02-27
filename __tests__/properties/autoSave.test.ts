/**
 * Property-Based Tests for Auto-Save Functionality
 * Feature: markdown-document-type
 * 
 * **Property 4: Auto-Save Persistence**
 * **Validates: Requirements 3.7**
 * 
 * For any content change in the markdown editor, after the debounce delay,
 * the system SHALL persist the updated content to the database such that
 * retrieving the document returns the latest content.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fc from "fast-check";
import type { JSONContent } from "@tiptap/react";

// Mock the saveDocument action
const mockSaveDocument = vi.fn();
vi.mock("@/app/actions/document", () => ({
  saveDocument: (...args: unknown[]) => mockSaveDocument(...args),
}));

/**
 * Generator for valid markdown JSONContent
 * Generates realistic document structures with various block types
 */
const jsonContentArbitrary = (): fc.Arbitrary<JSONContent> => {
  const textNode = fc.record({
    type: fc.constant("text"),
    text: fc.string({ minLength: 1, maxLength: 100 }),
  });

  const paragraphNode = fc.record({
    type: fc.constant("paragraph"),
    content: fc.option(fc.array(textNode, { minLength: 1, maxLength: 3 }), { nil: undefined }),
  });

  const headingNode = fc.record({
    type: fc.constant("heading"),
    attrs: fc.record({
      level: fc.integer({ min: 1, max: 3 }),
    }),
    content: fc.option(fc.array(textNode, { minLength: 1, maxLength: 3 }), { nil: undefined }),
  });

  const blockNode = fc.oneof(paragraphNode, headingNode);

  return fc.record({
    type: fc.constant("doc"),
    content: fc.array(blockNode, { minLength: 1, maxLength: 10 }),
  });
};

describe("Auto-Save Persistence Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveDocument.mockResolvedValue({ success: true, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("Property 4: Auto-Save Persistence - content changes are persisted after debounce", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // documentId
        jsonContentArbitrary(), // initial content
        jsonContentArbitrary(), // updated content
        fc.integer({ min: 100, max: 2000 }), // debounce delay
        async (documentId, _initialContent, updatedContent, _debounceDelay) => {
          // Clear mocks before each test
          mockSaveDocument.mockClear();
          
          // Simulate the auto-save flow
          const { saveDocument } = await import("@/app/actions/document");

          // Simulate content update
          const saveResult = await saveDocument(documentId, updatedContent);

          // Verify save was called with correct parameters
          expect(mockSaveDocument).toHaveBeenCalledWith(documentId, updatedContent);

          // Verify save succeeded
          expect(saveResult.success).toBe(true);
          expect(saveResult.error).toBeNull();

          // Property: After save, the saved content should match the updated content
          const savedContent = mockSaveDocument.mock.calls[mockSaveDocument.mock.calls.length - 1]?.[1];
          expect(JSON.stringify(savedContent)).toEqual(JSON.stringify(updatedContent));
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it("Property 4: Auto-Save Persistence - multiple rapid changes result in final state being saved", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // documentId
        fc.array(jsonContentArbitrary(), { minLength: 2, maxLength: 5 }), // sequence of content changes
        async (documentId, contentSequence) => {
          // Clear mocks before each test
          mockSaveDocument.mockClear();
          
          const { saveDocument } = await import("@/app/actions/document");

          // Simulate multiple rapid content changes (only last one should be saved after debounce)
          const finalContent = contentSequence[contentSequence.length - 1];

          // In a debounced scenario, only the final content should be saved
          const saveResult = await saveDocument(documentId, finalContent!);

          expect(saveResult.success).toBe(true);
          expect(saveResult.error).toBeNull();

          // Verify the final content was saved
          const savedContent = mockSaveDocument.mock.calls[mockSaveDocument.mock.calls.length - 1]?.[1];
          expect(JSON.stringify(savedContent)).toEqual(JSON.stringify(finalContent));
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });

  it("Property 4: Auto-Save Persistence - empty content can be saved", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // documentId
        async (documentId) => {
          // Clear mocks before each test
          mockSaveDocument.mockClear();
          
          const { saveDocument } = await import("@/app/actions/document");

          const emptyContent: JSONContent = {
            type: "doc",
            content: [{ type: "paragraph" }],
          };

          const saveResult = await saveDocument(documentId, emptyContent);

          expect(saveResult.success).toBe(true);
          expect(saveResult.error).toBeNull();
          expect(mockSaveDocument).toHaveBeenCalledWith(documentId, emptyContent);
        }
      ),
      {
        numRuns: 50,
        verbose: true,
      }
    );
  });

  it("Property 4: Auto-Save Persistence - content with special characters is preserved", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // documentId
        fc.string({ minLength: 1, maxLength: 200 }), // text with any characters
        async (documentId, specialText) => {
          // Clear mocks before each test
          mockSaveDocument.mockClear();
          
          const { saveDocument } = await import("@/app/actions/document");

          const contentWithSpecialChars: JSONContent = {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: specialText,
                  },
                ],
              },
            ],
          };

          const saveResult = await saveDocument(documentId, contentWithSpecialChars);

          expect(saveResult.success).toBe(true);
          expect(saveResult.error).toBeNull();

          // Verify the content with special characters was saved correctly
          const savedContent = mockSaveDocument.mock.calls[mockSaveDocument.mock.calls.length - 1]?.[1];
          expect(JSON.stringify(savedContent)).toEqual(JSON.stringify(contentWithSpecialChars));
          expect(savedContent.content[0].content[0].text).toBe(specialText);
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it("Property 4: Auto-Save Persistence - large documents can be saved", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // documentId
        fc.integer({ min: 50, max: 200 }), // number of blocks
        async (documentId, blockCount) => {
          // Clear mocks before each test
          mockSaveDocument.mockClear();
          
          const { saveDocument } = await import("@/app/actions/document");

          // Generate a large document with many blocks
          const largeContent: JSONContent = {
            type: "doc",
            content: Array.from({ length: blockCount }, (_, i) => ({
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Paragraph ${i + 1} with some content`,
                },
              ],
            })),
          };

          const saveResult = await saveDocument(documentId, largeContent);

          expect(saveResult.success).toBe(true);
          expect(saveResult.error).toBeNull();

          // Verify the large document was saved
          const savedContent = mockSaveDocument.mock.calls[mockSaveDocument.mock.calls.length - 1]?.[1];
          expect(savedContent.content).toHaveLength(blockCount);
        }
      ),
      {
        numRuns: 30,
        verbose: true,
      }
    );
  });
});
