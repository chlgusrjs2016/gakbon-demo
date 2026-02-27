import { describe, expect, it } from "vitest";
import { nextDocumentVersion } from "@/lib/editor/collaboration/versioning";

describe("Property 21: Document Version Tracking", () => {
  it("should increment version monotonically", () => {
    const v1 = nextDocumentVersion(null);
    const v2 = nextDocumentVersion(v1);
    expect(v2.version).toBe(v1.version + 1);
  });
});
