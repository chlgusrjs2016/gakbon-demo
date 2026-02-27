import { describe, expect, it } from "vitest";
import { validateUniqueBlockIds } from "@/lib/editor/collaboration/versioning";

describe("Property 20: Block Unique Identifiers", () => {
  it("should verify unique ids", () => {
    expect(validateUniqueBlockIds(["a", "b", "c"])).toBe(true);
    expect(validateUniqueBlockIds(["a", "b", "a"])).toBe(false);
  });
});
