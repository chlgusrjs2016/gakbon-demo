import type { JSONContent } from "@tiptap/core";
import type { PageSizeKey } from "@/lib/editor/pageEngine/types";

export type PdfPageSettings = {
  pageSize: PageSizeKey;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

export type PdfExportRequest = {
  projectId: string;
  documentId: string;
  documentType: "screenplay" | "document";
  contentSnapshot: JSONContent;
  pageSettings: PdfPageSettings;
};

export type PdfExportErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INVALID_PAYLOAD"
  | "PDF_RENDER_FAILED";
