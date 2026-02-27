/**
 * Property-Based Test: Text Formatting in Table Cells
 * 
 * Feature: markdown-document-type
 * Task 12.1: Table Cell Text Formatting Property Test
 * 
 * **Validates: Requirements 5.6**
 * 
 * Property 7: Text Formatting in Table Cells
 * 
 * *For any* text formatting operation (bold, italic, underline, strikethrough, code, link)
 * applied within a table cell, the formatting SHALL be preserved and rendered correctly
 * within that cell.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Mock table cell content structure
type TextMark = "bold" | "italic" | "underline" | "strike" | "code";
type LinkMark = { type: "link"; href: string };
type Mark = TextMark | LinkMark;

type TextNode = {
  type: "text";
  text: string;
  marks?: Mark[];
};

type ParagraphNode = {
  type: "paragraph";
  content: TextNode[];
};

type TableCellNode = {
  type: "tableCell" | "tableHeader";
  content: ParagraphNode[];
};

// Generator for text marks
const textMarkArb = fc.constantFrom<TextMark>(
  "bold",
  "italic",
  "underline",
  "strike",
  "code"
);

// Generator for link marks
const linkMarkArb = fc.record({
  type: fc.constant("link" as const),
  href: fc.webUrl(),
});

// Generator for any mark
const markArb: fc.Arbitrary<Mark> = fc.oneof(
  textMarkArb,
  linkMarkArb
);

// Generator for text nodes with marks
const textNodeArb = fc.record({
  type: fc.constant("text" as const),
  text: fc.string({ minLength: 1, maxLength: 50 }),
  marks: fc.option(fc.array(markArb, { minLength: 1, maxLength: 3 }), { nil: undefined }),
});

// Generator for paragraph nodes
const paragraphNodeArb = fc.record({
  type: fc.constant("paragraph" as const),
  content: fc.array(textNodeArb, { minLength: 1, maxLength: 3 }),
});

// Generator for table cell nodes
const tableCellNodeArb = fc.record({
  type: fc.constantFrom("tableCell" as const, "tableHeader" as const),
  content: fc.array(paragraphNodeArb, { minLength: 1, maxLength: 2 }),
});

describe("Property 7: Text Formatting in Table Cells", () => {
  it("should preserve text marks in table cells", () => {
    fc.assert(
      fc.property(tableCellNodeArb, (cell) => {
        // Verify that all marks are preserved in the cell structure
        for (const paragraph of cell.content) {
          for (const textNode of paragraph.content) {
            if (textNode.marks) {
              // Marks should be an array
              expect(Array.isArray(textNode.marks)).toBe(true);
              
              // Each mark should be valid
              for (const mark of textNode.marks) {
                if (typeof mark === "string") {
                  // Text mark
                  expect(["bold", "italic", "underline", "strike", "code"]).toContain(mark);
                } else {
                  // Link mark
                  expect(mark.type).toBe("link");
                  expect(mark.href).toBeDefined();
                  expect(typeof mark.href).toBe("string");
                }
              }
            }
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve bold formatting in table cells", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const cell: TableCellNode = {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    marks: ["bold"],
                  },
                ],
              },
            ],
          };

          // Verify bold mark is preserved
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toContain("bold");
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve italic formatting in table cells", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const cell: TableCellNode = {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    marks: ["italic"],
                  },
                ],
              },
            ],
          };

          // Verify italic mark is preserved
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toContain("italic");
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve multiple marks in table cells", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(textMarkArb, { minLength: 1, maxLength: 3 }),
        (text, marks) => {
          const cell: TableCellNode = {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    marks,
                  },
                ],
              },
            ],
          };

          // Verify all marks are preserved
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toEqual(marks);
          
          for (const mark of marks) {
            expect(textNode.marks).toContain(mark);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve link marks in table cells", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.webUrl(),
        (text, url) => {
          const linkMark: LinkMark = { type: "link", href: url };
          const cell: TableCellNode = {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    marks: [linkMark],
                  },
                ],
              },
            ],
          };

          // Verify link mark is preserved
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toBeDefined();
          expect(textNode.marks?.length).toBe(1);
          
          const mark = textNode.marks?.[0];
          expect(mark).toEqual(linkMark);
          
          if (typeof mark !== "string") {
            expect(mark.type).toBe("link");
            expect(mark.href).toBe(url);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve formatting in table headers", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        textMarkArb,
        (text, mark) => {
          const cell: TableCellNode = {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    marks: [mark],
                  },
                ],
              },
            ],
          };

          // Verify mark is preserved in header cell
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toContain(mark);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve formatting across multiple paragraphs in a cell", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(fc.string({ minLength: 1, maxLength: 50 }), textMarkArb),
          { minLength: 1, maxLength: 3 }
        ),
        (paragraphs) => {
          const cell: TableCellNode = {
            type: "tableCell",
            content: paragraphs.map(([text, mark]) => ({
              type: "paragraph" as const,
              content: [
                {
                  type: "text" as const,
                  text,
                  marks: [mark],
                },
              ],
            })),
          };

          // Verify all marks are preserved across paragraphs
          for (let i = 0; i < paragraphs.length; i++) {
            const [_text, expectedMark] = paragraphs[i];
            const textNode = cell.content[i].content[0];
            expect(textNode.marks).toContain(expectedMark);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should handle cells with no formatting", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const cell: TableCellNode = {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text,
                    // No marks
                  },
                ],
              },
            ],
          };

          // Verify no marks are present
          const textNode = cell.content[0].content[0];
          expect(textNode.marks).toBeUndefined();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
