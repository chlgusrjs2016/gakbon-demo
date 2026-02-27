import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { mergeAttributes } from "@tiptap/core";

// Extend the Commands interface
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    markdownTable: {
      addRowBefore: () => ReturnType;
      addColumnBefore: () => ReturnType;
      mergeCells: () => ReturnType;
    };
  }
}

// Extended Table with additional commands
export const MarkdownTable = Table.extend({
  addCommands() {
    return {
      ...this.parent?.(),
      
      // Add row before current row
      addRowBefore:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find table and row
          let tableDepth = -1;
          let rowDepth = -1;
          
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table" && tableDepth === -1) {
              tableDepth = d;
            }
            if (node.type.name === "tableRow" && rowDepth === -1) {
              rowDepth = d;
            }
          }
          
          if (tableDepth < 0 || rowDepth < 0) return false;
          
          const tableNode = $from.node(tableDepth);
          const rowNode = $from.node(rowDepth);
          const tablePos = $from.before(tableDepth);
          
          // Find row index
          let rowIndex = -1;
          tableNode.forEach((child, _offset, idx) => {
            if (child === rowNode) rowIndex = idx;
          });
          
          if (rowIndex < 0) return false;
          
          // Create new row with same number of cells
          const cellCount = rowNode.childCount || 1;
          const newRow = state.schema.nodes.tableRow.create(
            {},
            Array.from({ length: cellCount }, () =>
              state.schema.nodes.tableCell.create({}, [
                state.schema.nodes.paragraph.create(),
              ])
            )
          );
          
          // Calculate insert position
          let insertPos = tablePos + 1;
          for (let i = 0; i < rowIndex; i++) {
            insertPos += tableNode.child(i).nodeSize;
          }
          
          if (dispatch) {
            const tr = state.tr.insert(insertPos, newRow);
            dispatch(tr);
          }
          
          return true;
        },
      
      // Add column before current column
      addColumnBefore:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find table, row, and cell
          let tableDepth = -1;
          let rowDepth = -1;
          let cellDepth = -1;
          let headerDepth = -1;
          
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table" && tableDepth === -1) {
              tableDepth = d;
            }
            if (node.type.name === "tableRow" && rowDepth === -1) {
              rowDepth = d;
            }
            if (node.type.name === "tableCell" && cellDepth === -1) {
              cellDepth = d;
            }
            if (node.type.name === "tableHeader" && headerDepth === -1) {
              headerDepth = d;
            }
          }
          
          if (tableDepth < 0 || rowDepth < 0) return false;
          
          const activeCellDepth = Math.max(cellDepth, headerDepth);
          if (activeCellDepth < 0) return false;
          
          const tableNode = $from.node(tableDepth);
          const rowNode = $from.node(rowDepth);
          const activeCellNode = $from.node(activeCellDepth);
          const tablePos = $from.before(tableDepth);
          
          // Find cell index
          let cellIndex = -1;
          rowNode.forEach((child, _offset, idx) => {
            if (child === activeCellNode) cellIndex = idx;
          });
          
          if (cellIndex < 0) return false;
          
          // Create new table with added column
          const rowNodes = Array.from({ length: tableNode.childCount }, (_, rowIdx) => {
            const srcRow = tableNode.child(rowIdx);
            const newCells = Array.from({ length: srcRow.childCount }, (_, colIdx) => 
              srcRow.child(colIdx)
            );
            
            // Determine cell type based on the cell at cellIndex
            const refCell = srcRow.child(Math.max(0, Math.min(cellIndex, srcRow.childCount - 1)));
            const insertedCellType =
              refCell.type.name === "tableHeader"
                ? state.schema.nodes.tableHeader
                : state.schema.nodes.tableCell;
            
            newCells.splice(
              cellIndex,
              0,
              insertedCellType.create({}, [state.schema.nodes.paragraph.create()])
            );
            
            return state.schema.nodes.tableRow.create({}, newCells);
          });
          
          const newTable = state.schema.nodes.table.create(tableNode.attrs, rowNodes);
          
          if (dispatch) {
            const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
            dispatch(tr);
          }
          
          return true;
        },
      
      // Merge cells (simplified version - merges with cell to the right)
      mergeCells:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          
          // Find table, row, and cell
          let tableDepth = -1;
          let rowDepth = -1;
          let cellDepth = -1;
          let headerDepth = -1;
          
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === "table" && tableDepth === -1) {
              tableDepth = d;
            }
            if (node.type.name === "tableRow" && rowDepth === -1) {
              rowDepth = d;
            }
            if (node.type.name === "tableCell" && cellDepth === -1) {
              cellDepth = d;
            }
            if (node.type.name === "tableHeader" && headerDepth === -1) {
              headerDepth = d;
            }
          }
          
          if (tableDepth < 0 || rowDepth < 0) return false;
          
          const activeCellDepth = Math.max(cellDepth, headerDepth);
          if (activeCellDepth < 0) return false;
          
          const tableNode = $from.node(tableDepth);
          const rowNode = $from.node(rowDepth);
          const activeCellNode = $from.node(activeCellDepth);
          const tablePos = $from.before(tableDepth);
          
          // Find cell index
          let cellIndex = -1;
          rowNode.forEach((child, _offset, idx) => {
            if (child === activeCellNode) cellIndex = idx;
          });
          
          if (cellIndex < 0 || cellIndex >= rowNode.childCount - 1) return false;
          
          // Find row index
          let rowIndex = -1;
          tableNode.forEach((child, _offset, idx) => {
            if (child === rowNode) rowIndex = idx;
          });
          
          if (rowIndex < 0) return false;
          
          // Merge current cell with next cell
          const currentCell = rowNode.child(cellIndex);
          const nextCell = rowNode.child(cellIndex + 1);
          
          // Combine content from both cells
          const mergedContent: any[] = [];
          currentCell.forEach((node) => mergedContent.push(node));
          nextCell.forEach((node) => mergedContent.push(node));
          
          // Create merged cell with colspan attribute
          const mergedCell = currentCell.type.create(
            { ...currentCell.attrs, colspan: (currentCell.attrs.colspan || 1) + (nextCell.attrs.colspan || 1) },
            mergedContent
          );
          
          // Create new row with merged cell
          const newCells: any[] = [];
          for (let i = 0; i < rowNode.childCount; i++) {
            if (i === cellIndex) {
              newCells.push(mergedCell);
            } else if (i === cellIndex + 1) {
              // Skip the next cell as it's merged
              continue;
            } else {
              newCells.push(rowNode.child(i));
            }
          }
          
          const newRow = state.schema.nodes.tableRow.create({}, newCells);
          
          // Create new table with updated row
          const rowNodes = Array.from({ length: tableNode.childCount }, (_, idx) => {
            if (idx === rowIndex) {
              return newRow;
            }
            return tableNode.child(idx);
          });
          
          const newTable = state.schema.nodes.table.create(tableNode.attrs, rowNodes);
          
          if (dispatch) {
            const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
            dispatch(tr);
          }
          
          return true;
        },
    };
  },
  
  addKeyboardShortcuts() {
    return {
      // Tab key navigation
      Tab: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're in a table cell
        let cellDepth = -1;
        let headerDepth = -1;
        
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === "tableCell" && cellDepth === -1) {
            cellDepth = d;
          }
          if (node.type.name === "tableHeader" && headerDepth === -1) {
            headerDepth = d;
          }
        }
        
        const activeCellDepth = Math.max(cellDepth, headerDepth);
        if (activeCellDepth < 0) return false;
        
        // Move to next cell
        return this.editor.commands.goToNextCell();
      },
      
      // Shift+Tab for previous cell
      "Shift-Tab": () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're in a table cell
        let cellDepth = -1;
        let headerDepth = -1;
        
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === "tableCell" && cellDepth === -1) {
            cellDepth = d;
          }
          if (node.type.name === "tableHeader" && headerDepth === -1) {
            headerDepth = d;
          }
        }
        
        const activeCellDepth = Math.max(cellDepth, headerDepth);
        if (activeCellDepth < 0) return false;
        
        // Move to previous cell
        return this.editor.commands.goToPreviousCell();
      },
    };
  },
});

// Extended TableCell with active cell highlighting
export const MarkdownTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const colspan = element.getAttribute("colspan");
          return colspan ? parseInt(colspan, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (attributes.colspan === 1) {
            return {};
          }
          return { colspan: attributes.colspan };
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const rowspan = element.getAttribute("rowspan");
          return rowspan ? parseInt(rowspan, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (attributes.rowspan === 1) {
            return {};
          }
          return { rowspan: attributes.rowspan };
        },
      },
    };
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "markdown-table-cell",
      }),
      0,
    ];
  },
});

// Extended TableHeader with active cell highlighting
export const MarkdownTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const colspan = element.getAttribute("colspan");
          return colspan ? parseInt(colspan, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (attributes.colspan === 1) {
            return {};
          }
          return { colspan: attributes.colspan };
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const rowspan = element.getAttribute("rowspan");
          return rowspan ? parseInt(rowspan, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (attributes.rowspan === 1) {
            return {};
          }
          return { rowspan: attributes.rowspan };
        },
      },
    };
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      "th",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "markdown-table-header",
      }),
      0,
    ];
  },
});

// Export TableRow as is
export const MarkdownTableRow = TableRow;
