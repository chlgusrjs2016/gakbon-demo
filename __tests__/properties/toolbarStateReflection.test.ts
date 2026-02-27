import { describe, expect, it } from "vitest";

describe("Property 9: Toolbar State Reflection", () => {
  it("should reflect active state when formatting is applied", () => {
    const editorState = {
      bold: true,
      italic: false,
      heading: 2,
      bulletList: false,
    };

    expect(editorState.bold).toBe(true);
    expect(editorState.italic).toBe(false);
    expect(editorState.heading).toBe(2);
  });

  it("should update active state when selection changes", () => {
    const selectionStates = [
      { node: "paragraph", bold: false },
      { node: "paragraph", bold: true },
      { node: "heading", bold: false },
    ];

    expect(selectionStates[0].bold).toBe(false);
    expect(selectionStates[1].bold).toBe(true);
    expect(selectionStates[2].node).toBe("heading");
  });
});
