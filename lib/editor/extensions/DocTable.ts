import { Node, mergeAttributes } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

type InsertTableOptions = {
  rows?: number;
  cols?: number;
  withHeaderRow?: boolean;
};

function findAncestorDepthByName(selection: { $from: { depth: number; node: (depth: number) => ProseMirrorNode } }, nodeName: string) {
  for (let depth = selection.$from.depth; depth > 0; depth--) {
    if (selection.$from.node(depth).type.name === nodeName) return depth;
  }
  return -1;
}

function getAncestorPos(selection: { $from: { before: (depth: number) => number } }, depth: number) {
  return selection.$from.before(depth);
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docTable: {
      insertTable: (options?: InsertTableOptions) => ReturnType;
      addRowAfter: () => ReturnType;
      addColumnAfter: () => ReturnType;
      deleteRow: () => ReturnType;
      deleteColumn: () => ReturnType;
    };
  }
}

export const DocTable = Node.create({
  name: "table",

  group: "block",

  content: "tableRow+",

  isolating: true,

  parseHTML() {
    return [{ tag: "table" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "table",
      mergeAttributes(HTMLAttributes, { class: "doc-table" }),
      ["tbody", 0],
    ];
  },

  addCommands() {
    return {
      insertTable:
        (options = {}) =>
        ({ commands }) => {
          const rows = Math.max(1, Math.min(options.rows ?? 3, 20));
          const cols = Math.max(1, Math.min(options.cols ?? 3, 10));
          const withHeaderRow = options.withHeaderRow ?? true;

          const makeCellContent = (rowIndex: number, colIndex: number, isHeader: boolean) => {
            const text = isHeader
              ? `제목 ${colIndex + 1}`
              : `내용 ${rowIndex}${colIndex + 1}`;
            return [{ type: "paragraph", content: [{ type: "text", text }] }];
          };

          const normalizedRows = Array.from({ length: rows }, (_, rowIdx) => ({
            type: "tableRow",
            content: Array.from({ length: cols }, (_, colIdx) => ({
              type: withHeaderRow && rowIdx === 0 ? "tableHeader" : "tableCell",
              content: makeCellContent(
                withHeaderRow ? rowIdx : rowIdx + 1,
                colIdx,
                withHeaderRow && rowIdx === 0
              ),
            })),
          }));

          return commands.insertContent({
            type: "table",
            content: normalizedRows,
          });
        },

      addRowAfter:
        () =>
        ({ state, dispatch }) => {
          const tableDepth = findAncestorDepthByName(state.selection, "table");
          const rowDepth = findAncestorDepthByName(state.selection, "tableRow");
          if (tableDepth < 0 || rowDepth < 0) return false;

          const tableNode = state.selection.$from.node(tableDepth);
          const rowNode = state.selection.$from.node(rowDepth);
          const tablePos = getAncestorPos(state.selection, tableDepth);

          let rowIndex = -1;
          tableNode.forEach((child, _offset, idx) => {
            if (child === rowNode) rowIndex = idx;
          });
          if (rowIndex < 0) return false;

          const cellCount = rowNode.childCount || 1;
          const newRow = state.schema.nodes.tableRow.create(
            {},
            Array.from({ length: cellCount }, () =>
              state.schema.nodes.tableCell.create({}, [
                state.schema.nodes.paragraph.create(),
              ])
            )
          );

          let insertPos = tablePos + 1;
          for (let i = 0; i <= rowIndex; i++) {
            insertPos += tableNode.child(i).nodeSize;
          }

          const tr = state.tr.insert(insertPos, newRow);
          if (dispatch) dispatch(tr);
          return true;
        },

      addColumnAfter:
        () =>
        ({ state, dispatch }) => {
          const tableDepth = findAncestorDepthByName(state.selection, "table");
          const rowDepth = findAncestorDepthByName(state.selection, "tableRow");
          const cellDepth = findAncestorDepthByName(state.selection, "tableCell");
          const headerDepth = findAncestorDepthByName(state.selection, "tableHeader");
          if (tableDepth < 0 || rowDepth < 0) return false;

          const activeCellDepth = Math.max(cellDepth, headerDepth);
          if (activeCellDepth < 0) return false;

          const tableNode = state.selection.$from.node(tableDepth);
          const rowNode = state.selection.$from.node(rowDepth);
          const activeCellNode = state.selection.$from.node(activeCellDepth);
          const tablePos = getAncestorPos(state.selection, tableDepth);

          let cellIndex = -1;
          rowNode.forEach((child, _offset, idx) => {
            if (child === activeCellNode) cellIndex = idx;
          });
          if (cellIndex < 0) return false;

          const rowNodes = Array.from({ length: tableNode.childCount }, (_, rowIdx) => {
            const srcRow = tableNode.child(rowIdx);
            const newCells = Array.from({ length: srcRow.childCount }, (_, colIdx) => {
              const original = srcRow.child(colIdx);
              if (colIdx === cellIndex + 1) {
                return original;
              }
              return original;
            });
            const insertedCellType =
              srcRow.child(Math.max(0, Math.min(cellIndex, srcRow.childCount - 1))).type.name ===
              "tableHeader"
                ? state.schema.nodes.tableHeader
                : state.schema.nodes.tableCell;
            newCells.splice(
              cellIndex + 1,
              0,
              insertedCellType.create({}, [state.schema.nodes.paragraph.create()])
            );
            return state.schema.nodes.tableRow.create({}, newCells);
          });

          const newTable = state.schema.nodes.table.create(tableNode.attrs, rowNodes);
          const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
          if (dispatch) dispatch(tr);
          return true;
        },

      deleteRow:
        () =>
        ({ state, dispatch }) => {
          const tableDepth = findAncestorDepthByName(state.selection, "table");
          const rowDepth = findAncestorDepthByName(state.selection, "tableRow");
          if (tableDepth < 0 || rowDepth < 0) return false;

          const tableNode = state.selection.$from.node(tableDepth);
          const rowNode = state.selection.$from.node(rowDepth);
          if (tableNode.childCount <= 1) return false;

          const tablePos = getAncestorPos(state.selection, tableDepth);

          let rowIndex = -1;
          tableNode.forEach((child, _offset, idx) => {
            if (child === rowNode) rowIndex = idx;
          });
          if (rowIndex < 0) return false;

          let deleteFrom = tablePos + 1;
          for (let i = 0; i < rowIndex; i++) {
            deleteFrom += tableNode.child(i).nodeSize;
          }
          const deleteTo = deleteFrom + rowNode.nodeSize;
          const tr = state.tr.delete(deleteFrom, deleteTo);
          if (dispatch) dispatch(tr);
          return true;
        },

      deleteColumn:
        () =>
        ({ state, dispatch }) => {
          const tableDepth = findAncestorDepthByName(state.selection, "table");
          const rowDepth = findAncestorDepthByName(state.selection, "tableRow");
          const cellDepth = findAncestorDepthByName(state.selection, "tableCell");
          const headerDepth = findAncestorDepthByName(state.selection, "tableHeader");
          if (tableDepth < 0 || rowDepth < 0) return false;

          const activeCellDepth = Math.max(cellDepth, headerDepth);
          if (activeCellDepth < 0) return false;

          const tableNode = state.selection.$from.node(tableDepth);
          const rowNode = state.selection.$from.node(rowDepth);
          const activeCellNode = state.selection.$from.node(activeCellDepth);
          if (rowNode.childCount <= 1) return false;

          const tablePos = getAncestorPos(state.selection, tableDepth);
          let cellIndex = -1;
          rowNode.forEach((child, _offset, idx) => {
            if (child === activeCellNode) cellIndex = idx;
          });
          if (cellIndex < 0) return false;

          const rowNodes = Array.from({ length: tableNode.childCount }, (_, rowIdx) => {
            const srcRow = tableNode.child(rowIdx);
            const newCells = Array.from({ length: srcRow.childCount }, (_, colIdx) => srcRow.child(colIdx));
            if (cellIndex >= newCells.length) return srcRow;
            newCells.splice(cellIndex, 1);
            return state.schema.nodes.tableRow.create({}, newCells);
          });

          const newTable = state.schema.nodes.table.create(tableNode.attrs, rowNodes);
          const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

export const DocTableRow = Node.create({
  name: "tableRow",

  content: "(tableCell|tableHeader)+",

  parseHTML() {
    return [{ tag: "tr" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

export const DocTableCell = Node.create({
  name: "tableCell",

  content: "block+",

  isolating: true,

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

export const DocTableHeader = Node.create({
  name: "tableHeader",

  content: "block+",

  isolating: true,

  parseHTML() {
    return [{ tag: "th" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});
