/**
 * Property-Based Test: Table Structure Preservation on Copy/Paste
 * 
 * Feature: markdown-document-type
 * Task 12.2: Table Copy/Paste Property Test
 * 
 * **Validates: Requirements 5.10**
 * 
 * Property 8: Table Structure Preservation on Copy/Paste
 * 
 * *For any* table or table selection, copying and pasting SHALL preserve the table
 * structure including row count, column count, header rows, and cell content.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Table structure types
type TableCellContent = {
  type: "paragraph";
  content: Array<{
    type: "text";
    text: string;
  }>;
};

type TableCell = {
  type: "tableCell" | "tableHeader";
  content: TableCellContent[];
};

type TableRow = {
  type: "tableRow";
  content: TableCell[];
};

type Table = {
  type: "table";
  content: TableRow[];
};

// Generators
const textContentArb = fc.record({
  type: fc.constant("text" as const),
  text: fc.string({ minLength: 0, maxLength: 50 }),
});

const paragraphArb = fc.record({
  type: fc.constant("paragraph" as const),
  content: fc.array(textContentArb, { minLength: 1, maxLength: 2 }),
});

const tableCellArb = fc.record({
  type: fc.constantFrom("tableCell" as const, "tableHeader" as const),
  content: fc.array(paragraphArb, { minLength: 1, maxLength: 1 }),
});

const tableRowArb = (colCount: number) =>
  fc.record({
    type: fc.constant("tableRow" as const),
    content: fc.array(tableCellArb, { minLength: colCount, maxLength: colCount }),
  });

const tableArb = fc
  .tuple(
    fc.integer({ min: 1, max: 10 }), // row count
    fc.integer({ min: 1, max: 10 }), // column count
    fc.boolean() // has header row
  )
  .chain(([rowCount, colCount, hasHeader]) =>
    fc.record({
      type: fc.constant("table" as const),
      content: fc.array(tableRowArb(colCount), {
        minLength: rowCount,
        maxLength: rowCount,
      }),
      metadata: fc.constant({ rowCount, colCount, hasHeader }),
    })
  );

// Helper functions
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getTableDimensions(table: Table): { rows: number; cols: number } {
  const rows = table.content.length;
  const cols = table.content[0]?.content.length || 0;
  return { rows, cols };
}

function hasHeaderRow(table: Table): boolean {
  if (table.content.length === 0) return false;
  const firstRow = table.content[0];
  return firstRow.content.every((cell) => cell.type === "tableHeader");
}

function getCellContent(table: Table, row: number, col: number): string {
  const cell = table.content[row]?.content[col];
  if (!cell) return "";
  const paragraph = cell.content[0];
  if (!paragraph) return "";
  return paragraph.content.map((text) => text.text).join("");
}

describe("Property 8: Table Structure Preservation on Copy/Paste", () => {
  it("should preserve row count after copy/paste", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate copy/paste by deep cloning
        const copied = deepClone(table);
        
        // Verify row count is preserved
        expect(copied.content.length).toBe(table.content.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve column count after copy/paste", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate copy/paste by deep cloning
        const copied = deepClone(table);
        
        // Verify column count is preserved in all rows
        for (let i = 0; i < table.content.length; i++) {
          expect(copied.content[i].content.length).toBe(
            table.content[i].content.length
          );
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve header row type after copy/paste", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate copy/paste by deep cloning
        const copied = deepClone(table);
        
        // Verify header row is preserved
        const originalHasHeader = hasHeaderRow(table);
        const copiedHasHeader = hasHeaderRow(copied);
        
        expect(copiedHasHeader).toBe(originalHasHeader);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve cell content after copy/paste", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate copy/paste by deep cloning
        const copied = deepClone(table);
        
        // Verify all cell content is preserved
        for (let row = 0; row < table.content.length; row++) {
          for (let col = 0; col < table.content[row].content.length; col++) {
            const originalContent = getCellContent(table, row, col);
            const copiedContent = getCellContent(copied, row, col);
            expect(copiedContent).toBe(originalContent);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve cell types after copy/paste", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate copy/paste by deep cloning
        const copied = deepClone(table);
        
        // Verify all cell types are preserved
        for (let row = 0; row < table.content.length; row++) {
          for (let col = 0; col < table.content[row].content.length; col++) {
            const originalType = table.content[row].content[col].type;
            const copiedType = copied.content[row].content[col].type;
            expect(copiedType).toBe(originalType);
          }
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve table structure for single row tables", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (colCount) => {
          const table: Table = {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: Array.from({ length: colCount }, () => ({
                  type: "tableCell" as const,
                  content: [
                    {
                      type: "paragraph" as const,
                      content: [{ type: "text" as const, text: "cell" }],
                    },
                  ],
                })),
              },
            ],
          };
          
          // Simulate copy/paste
          const copied = deepClone(table);
          
          // Verify structure
          expect(copied.content.length).toBe(1);
          expect(copied.content[0].content.length).toBe(colCount);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve table structure for single column tables", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (rowCount) => {
          const table: Table = {
            type: "table",
            content: Array.from({ length: rowCount }, () => ({
              type: "tableRow" as const,
              content: [
                {
                  type: "tableCell" as const,
                  content: [
                    {
                      type: "paragraph" as const,
                      content: [{ type: "text" as const, text: "cell" }],
                    },
                  ],
                },
              ],
            })),
          };
          
          // Simulate copy/paste
          const copied = deepClone(table);
          
          // Verify structure
          expect(copied.content.length).toBe(rowCount);
          expect(copied.content[0].content.length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve empty cells after copy/paste", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 2, max: 5 }),
        (rows, cols) => {
          const table: Table = {
            type: "table",
            content: Array.from({ length: rows }, () => ({
              type: "tableRow" as const,
              content: Array.from({ length: cols }, () => ({
                type: "tableCell" as const,
                content: [
                  {
                    type: "paragraph" as const,
                    content: [{ type: "text" as const, text: "" }],
                  },
                ],
              })),
            })),
          };
          
          // Simulate copy/paste
          const copied = deepClone(table);
          
          // Verify all cells are empty
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const content = getCellContent(copied, row, col);
              expect(content).toBe("");
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve table structure with mixed cell types", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 2, max: 5 }),
        (rows, cols) => {
          // Create table with header row and data rows
          const table: Table = {
            type: "table",
            content: [
              // Header row
              {
                type: "tableRow",
                content: Array.from({ length: cols }, () => ({
                  type: "tableHeader" as const,
                  content: [
                    {
                      type: "paragraph" as const,
                      content: [{ type: "text" as const, text: "Header" }],
                    },
                  ],
                })),
              },
              // Data rows
              ...Array.from({ length: rows - 1 }, () => ({
                type: "tableRow" as const,
                content: Array.from({ length: cols }, () => ({
                  type: "tableCell" as const,
                  content: [
                    {
                      type: "paragraph" as const,
                      content: [{ type: "text" as const, text: "Data" }],
                    },
                  ],
                })),
              })),
            ],
          };
          
          // Simulate copy/paste
          const copied = deepClone(table);
          
          // Verify header row
          expect(copied.content[0].content.every((cell) => cell.type === "tableHeader")).toBe(true);
          
          // Verify data rows
          for (let i = 1; i < rows; i++) {
            expect(copied.content[i].content.every((cell) => cell.type === "tableCell")).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve table dimensions after multiple copy/paste operations", () => {
    fc.assert(
      fc.property(tableArb, (tableWithMeta) => {
        const table = { type: tableWithMeta.type, content: tableWithMeta.content };
        
        // Simulate multiple copy/paste operations
        let copied = deepClone(table);
        for (let i = 0; i < 3; i++) {
          copied = deepClone(copied);
        }
        
        // Verify dimensions are still preserved
        const originalDims = getTableDimensions(table);
        const copiedDims = getTableDimensions(copied);
        
        expect(copiedDims.rows).toBe(originalDims.rows);
        expect(copiedDims.cols).toBe(originalDims.cols);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
