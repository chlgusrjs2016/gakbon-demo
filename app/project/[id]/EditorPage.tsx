/**
 * 에디터 페이지 레이아웃 (Client Component)
 *
 * 3컬럼 레이아웃: 왼쪽 네비게이터 + 가운데 에디터 + 오른쪽 AI 어시스트.
 * 상단 헤더에는 Lucide 아이콘(세로 배치) 도구 버튼과 커스텀 노드타입 드롭다운이 있습니다.
 * 에디터 영역은 A4 표준(8.27×11.69인치, 794×1122px @ 96dpi)으로 렌더됩니다.
 * 배경/UI는 그레이스케일 톤입니다.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Check,
  FileText,
  Settings,
  Palette,
  SplitSquareHorizontal,
  List,
  Sparkles,
  GitBranch,
  Save,
  Send,
  Share2,
  Download,
  Undo2,
  Redo2,
} from "lucide-react";
import ScenarioEditor from "@/components/editor/ScenarioEditor";
import DocumentEditor from "@/components/editor/DocumentEditor";
import DocumentToolbar from "@/components/editor/DocumentToolbar";
import NavigatorSidebar from "@/components/editor/NavigatorSidebar";
import DocumentsSidebar from "@/components/editor/DocumentsSidebar";
import AssistSidebar from "@/components/editor/AssistSidebar";
import NodeTypeDropdown from "@/components/editor/NodeTypeDropdown";
import Ruler from "@/components/editor/Ruler";
import LineNumbers from "@/components/editor/LineNumbers";
import {
  PX_PER_INCH,
  PAGE_SIZE_PRESETS,
} from "@/lib/editor/pageEngine/config";
import { usePageRender } from "@/lib/editor/pageEngine/usePageRender";
import type { PageSizeKey, StoredPageRenderSettings } from "@/lib/editor/pageEngine/types";
import {
  createDocument,
  createDocumentFolder,
  duplicateDocument,
  duplicateDocumentFolder,
  getDocumentFolders,
  getDocuments,
  getTrashedDocuments,
  moveDocumentToTrash,
  moveFolderToTrash,
  renameDocument,
  renameDocumentFolder,
  reorderProjectDocuments,
  saveDocument,
  type DocumentFolder,
  type DocumentType,
} from "@/app/actions/document";
import {
  getProjectPageRenderSettings,
  upsertProjectPageRenderSettings,
} from "@/app/actions/pageRenderSettings";
import type { JSONContent, Editor } from "@tiptap/react";
import type { PdfExportRequest } from "@/lib/export/pdf/types";

const FORMAT_OPTIONS = [
  { value: "us", label: "미국" },
];

const PAGE_SIZE_OPTIONS: { value: PageSizeKey; label: string }[] = [
  { value: "a4", label: "A4 (8.27” × 11.69”)" },
  { value: "us_letter", label: "US Letter (8.5” × 11”)" },
];

const MENU_SURFACE_CLASS = [
  "rounded-xl py-1.5",
  "bg-white/40 dark:bg-zinc-900/40",
  "backdrop-blur-3xl saturate-150",
  "border border-white/60 dark:border-white/[0.1]",
  "shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_0.5px_0_rgba(255,255,255,0.5)]",
  "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
].join(" ");

const MENU_ITEM_BASE_CLASS = [
  "flex w-full items-center gap-2.5 px-3 py-2 text-xs",
  "transition-all duration-100",
].join(" ");

/* ── 포맷 선택 팝업 메뉴 ── */
function FormatMenu({
  currentFormat,
  currentPageSize,
  onFormatChange,
  onPageSizeChange,
  isScreenplay,
  onClose,
}: {
  currentFormat: string;
  currentPageSize: PageSizeKey;
  onFormatChange: (v: string) => void;
  onPageSizeChange: (v: PageSizeKey) => void;
  isScreenplay: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        "absolute left-0 top-full z-[100] mt-1.5",
        "min-w-[120px]",
        MENU_SURFACE_CLASS,
      ].join(" ")}
    >
      {FORMAT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onFormatChange(opt.value)}
          className={[
            MENU_ITEM_BASE_CLASS,
            "justify-between text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]",
          ].join(" ")}
        >
          <span>{opt.label}</span>
          {opt.value === currentFormat && (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
          )}
        </button>
      ))}
      {isScreenplay && (
        <>
          <div className="my-1 h-px bg-zinc-200/80 dark:bg-white/[0.08]" />
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPageSizeChange(opt.value)}
              className={[
                MENU_ITEM_BASE_CLASS,
                "justify-between text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]",
              ].join(" ")}
            >
              <span>{opt.label}</span>
              {opt.value === currentPageSize && (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

function SettingsMenu({
  onClose,
}: {
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        "absolute left-0 top-full z-[100] mt-1.5",
        "min-w-[140px]",
        MENU_SURFACE_CLASS,
      ].join(" ")}
    >
      <button
        type="button"
        className={[
          MENU_ITEM_BASE_CLASS,
          "text-zinc-600 dark:text-zinc-300",
        ].join(" ")}
      >
        <span>설정 항목 없음</span>
      </button>
    </div>
  );
}

function ExportMenu({
  loading,
  onExportPdf,
  onClose,
}: {
  loading: boolean;
  onExportPdf: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        "absolute right-0 top-full z-[100] mt-1.5",
        "min-w-[168px]",
        MENU_SURFACE_CLASS,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onExportPdf}
        disabled={loading}
        className={[
          MENU_ITEM_BASE_CLASS,
          "justify-between text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]",
          loading ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span>{loading ? "PDF 생성 중..." : "PDF로 내보내기"}</span>
      </button>
    </div>
  );
}

type Project = {
  id: string;
  title: string;
};

type Document = {
  id: string;
  title: string;
  content: JSONContent | null;
  project_id: string;
  sort_order?: number;
  folder_id?: string | null;
  document_type?: DocumentType;
};

export default function EditorPage({
  project,
  documents,
  folders,
  trashedDocuments,
}: {
  project: Project;
  documents: Document[];
  folders: DocumentFolder[];
  trashedDocuments: Document[];
}) {
  type LeftPanelType = "documents" | "navigator";
  const router = useRouter();

  /* ── 저장 상태 ── */
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved"
  >("saved");

  /* ── TipTap 에디터 참조 ── */
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  /* ── 현재 노드타입 ── */
  const [currentNodeType, setCurrentNodeType] = useState("paragraph");

  /* ── 현재 포맷 ── */
  const [currentFormat, setCurrentFormat] = useState("us");
  const [currentPageSize, setCurrentPageSize] = useState<PageSizeKey>("a4");
  const [screenplayRenderSettings, setScreenplayRenderSettings] =
    useState<StoredPageRenderSettings | null>(null);

  /* ── 포맷 메뉴 토글 ── */
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  /* ── 문서 상태 ── */
  const [documentList, setDocumentList] = useState<Document[]>(documents);
  const [trashedDocumentList, setTrashedDocumentList] = useState<Document[]>(trashedDocuments);
  const [folderList, setFolderList] = useState<DocumentFolder[]>(folders);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    documents[0]?.id ?? null
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null | "__trash__" | "__none__">(documents[0]?.folder_id ?? "__none__");

  /* ── 사이드바 토글 ── */
  const [leftPanel, setLeftPanel] = useState<LeftPanelType | null>(null);
  const [renderedLeftPanel, setRenderedLeftPanel] = useState<LeftPanelType | null>(null);
  const [showAssist, setShowAssist] = useState(false);
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [isRefreshingDocuments, setIsRefreshingDocuments] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const documentImageUploadTriggerRef = useRef<(() => void) | null>(null);

  /* ── 디바운스 타이머 ── */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftPanelUnmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (leftPanelUnmountTimerRef.current) clearTimeout(leftPanelUnmountTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getProjectPageRenderSettings(project.id);
      if (cancelled || !result.data) return;
      setScreenplayRenderSettings({
        screenplay_page_size: result.data.screenplay_page_size,
        screenplay_margins: result.data.screenplay_margins,
        node_break_policies: result.data.node_break_policies,
      });
      if (result.data.screenplay_page_size) {
        setCurrentPageSize(result.data.screenplay_page_size);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const openLeftPanel = useCallback((panel: LeftPanelType) => {
    if (leftPanelUnmountTimerRef.current) {
      clearTimeout(leftPanelUnmountTimerRef.current);
      leftPanelUnmountTimerRef.current = null;
    }
    setRenderedLeftPanel(panel);
    setLeftPanel(panel);
  }, []);

  const closeLeftPanel = useCallback(() => {
    setLeftPanel(null);
    if (leftPanelUnmountTimerRef.current) {
      clearTimeout(leftPanelUnmountTimerRef.current);
    }
    leftPanelUnmountTimerRef.current = setTimeout(() => {
      setRenderedLeftPanel(null);
      leftPanelUnmountTimerRef.current = null;
    }, 300);
  }, []);

  const toggleLeftPanel = useCallback(
    (panel: LeftPanelType) => {
      if (leftPanel === panel) {
        closeLeftPanel();
        return;
      }
      openLeftPanel(panel);
    },
    [leftPanel, openLeftPanel, closeLeftPanel]
  );

  /* ── 에디터 커서 위치 변경 시 현재 노드타입 추적 ── */
  useEffect(() => {
    if (!editorInstance) return;

    const updateNodeType = () => {
      const { $from } = editorInstance.state.selection;
      const nodeName = $from.parent.type.name;
      setCurrentNodeType(nodeName);
    };

    editorInstance.on("selectionUpdate", updateNodeType);
    editorInstance.on("transaction", updateNodeType);
    return () => {
      editorInstance.off("selectionUpdate", updateNodeType);
      editorInstance.off("transaction", updateNodeType);
    };
  }, [editorInstance]);

  /* ── 노드타입 변경 핸들러 ── */
  const handleNodeTypeChange = useCallback(
    (nodeType: string) => {
      if (!editorInstance) return;
      if (nodeType === "paragraph") {
        editorInstance.chain().focus().setParagraph().run();
      } else {
        editorInstance.chain().focus().setNode(nodeType).run();
      }
    },
    [editorInstance]
  );

  /* ── 자동 저장 핸들러 ── */
  const handleUpdate = useCallback(
    (content: JSONContent) => {
      const currentDocument = documentList.find((d) => d.id === currentDocumentId);
      if (!currentDocument) return;
      setDocumentList((prev) =>
        prev.map((doc) =>
          doc.id === currentDocument.id
            ? { ...doc, content }
            : doc
        )
      );
      setSaveStatus("unsaved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        const result = await saveDocument(currentDocument.id, content);
        setSaveStatus(result.success ? "saved" : "unsaved");
      }, 1500);
    },
    [documentList, currentDocumentId]
  );

  /* ── 에디터 준비 콜백 ── */
  const handleEditorReady = useCallback((editor: Editor) => {
    setEditorInstance(editor);
  }, []);

  const currentDocument = documentList.find((d) => d.id === currentDocumentId) ?? null;
  const currentType = currentDocument?.document_type ?? "screenplay";
  const isDocumentMode = currentType !== "screenplay";
  const render = usePageRender({
    editor: editorInstance,
    documentType: isDocumentMode ? "document" : "screenplay",
    pageSizeKey: isDocumentMode ? "a4" : currentPageSize,
    settings: isDocumentMode ? null : screenplayRenderSettings,
  });
  const screenplayPage = PAGE_SIZE_PRESETS[currentPageSize];
  const documentPage = PAGE_SIZE_PRESETS.a4;
  const activePage = isDocumentMode ? documentPage : render.pageSize;
  const activeRulerInches = activePage.width / PX_PER_INCH;
  const { pageCount, canvasHeight, pageGap, margins, lineNumberTopPadding } = render;

  const handlePageSizeChange = useCallback((nextPageSize: PageSizeKey) => {
    setCurrentPageSize(nextPageSize);
    setScreenplayRenderSettings((prev) => ({
      ...(prev ?? {}),
      screenplay_page_size: nextPageSize,
    }));
    void upsertProjectPageRenderSettings(project.id, {
      screenplayPageSize: nextPageSize,
    });
  }, [project.id]);

  const handleCreateDocument = useCallback(async (documentType: DocumentType = "screenplay") => {
    if (isCreatingDocument) return;
    setIsCreatingDocument(true);
    const targetFolderId =
      activeFolderId === "__trash__"
        ? null
        : activeFolderId === "__none__"
          ? (currentDocument?.folder_id ?? null)
          : activeFolderId;
    const countByType = documentList.filter(
      (doc) => (doc.document_type ?? "screenplay") === documentType
    ).length;
    const baseTitle = documentType === "screenplay" ? "시나리오" : "문서";
    const result = await createDocument(
      project.id,
      `${baseTitle} ${countByType + 1}`,
      documentType,
      targetFolderId
    );
    if (result.data) {
      setDocumentList((prev) => [...prev, result.data as Document]);
      setCurrentDocumentId(result.data.id);
      setSaveStatus("saved");
      openLeftPanel("documents");
    }
    setIsCreatingDocument(false);
  }, [isCreatingDocument, project.id, documentList, openLeftPanel, activeFolderId, currentDocument]);

  const handleCreateFolder = useCallback(async () => {
    const folderName = window.prompt("새 폴더 이름을 입력하세요", "새 폴더");
    if (!folderName?.trim()) return;
    const result = await createDocumentFolder(project.id, folderName);
    if (result.data) {
      setFolderList((prev) => [...prev, result.data as DocumentFolder]);
      setActiveFolderId(result.data.id);
      openLeftPanel("documents");
    } else if (result.error) {
      window.alert(result.error);
    }
  }, [project.id, openLeftPanel]);

  const handleRefreshDocuments = useCallback(async () => {
    if (isRefreshingDocuments) return;
    setIsRefreshingDocuments(true);
    const [docsResult, foldersResult, trashResult] = await Promise.all([
      getDocuments(project.id),
      getDocumentFolders(project.id),
      getTrashedDocuments(project.id),
    ]);
    if (docsResult.data) {
      setDocumentList(docsResult.data as Document[]);
      if (docsResult.data.length === 0) {
        setCurrentDocumentId(null);
      } else {
        const stillExists = docsResult.data.some((doc) => doc.id === currentDocumentId);
        if (!stillExists) setCurrentDocumentId(docsResult.data[0].id);
      }
    }
    if (foldersResult.data) {
      setFolderList(foldersResult.data as DocumentFolder[]);
      if (
        activeFolderId &&
        activeFolderId !== "__trash__" &&
        activeFolderId !== "__none__" &&
        !(foldersResult.data as DocumentFolder[]).some((folder) => folder.id === activeFolderId)
      ) {
        setActiveFolderId(null);
      }
    }
    if (trashResult.data) {
      setTrashedDocumentList(trashResult.data as Document[]);
    }
    setIsRefreshingDocuments(false);
  }, [isRefreshingDocuments, project.id, currentDocumentId, activeFolderId]);

  const handleSelectDocument = useCallback((documentId: string) => {
    if (documentId === currentDocumentId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus("saved");
    setCurrentDocumentId(documentId);
    setActiveFolderId("__none__");
  }, [currentDocumentId]);

  const handleMoveDocument = useCallback(async (args: {
    draggedDocumentId: string;
    targetFolderId: string | null;
    beforeDocumentId?: string | null;
  }) => {
    if (args.draggedDocumentId === args.beforeDocumentId) return;

    const dragged = documentList.find((d) => d.id === args.draggedDocumentId);
    if (!dragged) return;

    const byFolder = new Map<string | null, Document[]>();
    byFolder.set(null, []);
    for (const folder of folderList) byFolder.set(folder.id, []);

    for (const doc of documentList) {
      if (doc.id === args.draggedDocumentId) continue;
      const key = doc.folder_id ?? null;
      if (!byFolder.has(key)) byFolder.set(key, []);
      byFolder.get(key)!.push(doc);
    }

    const targetKey = args.targetFolderId ?? null;
    if (!byFolder.has(targetKey)) byFolder.set(targetKey, []);

    const targetDocs = byFolder.get(targetKey)!;
    let insertIndex = targetDocs.length;
    if (args.beforeDocumentId) {
      const idx = targetDocs.findIndex((doc) => doc.id === args.beforeDocumentId);
      if (idx >= 0) insertIndex = idx;
    }

    targetDocs.splice(insertIndex, 0, {
      ...dragged,
      folder_id: targetKey,
    });

    const ordered: Document[] = [];
    ordered.push(...(byFolder.get(null) ?? []));
    for (const folder of folderList) {
      ordered.push(...(byFolder.get(folder.id) ?? []));
    }

    const normalized = ordered.map((doc, idx) => ({
      ...doc,
      sort_order: idx,
      folder_id: doc.folder_id ?? null,
    }));

    setDocumentList(normalized);
    const updates = normalized.map((doc, idx) => ({
      id: doc.id,
      sort_order: idx,
      folder_id: doc.folder_id ?? null,
    }));

    const result = await reorderProjectDocuments(project.id, updates);
    if (!result.success) {
      window.alert(result.error ?? "문서 정렬 저장에 실패했습니다.");
      const refreshed = await getDocuments(project.id);
      if (refreshed.data) {
        setDocumentList(refreshed.data as Document[]);
      }
    }
  }, [documentList, folderList, project.id]);

  const handleRenameDocument = useCallback(async (documentId: string) => {
    const target = documentList.find((d) => d.id === documentId);
    if (!target) return;
    const next = window.prompt("문서 이름 변경", target.title || "");
    if (!next?.trim()) return;
    const result = await renameDocument(documentId, next);
    if (!result.success) {
      window.alert(result.error ?? "문서 이름 변경에 실패했습니다.");
      return;
    }
    setDocumentList((prev) => prev.map((doc) => (doc.id === documentId ? { ...doc, title: next.trim() } : doc)));
  }, [documentList]);

  const handleDuplicateDocument = useCallback(async (documentId: string) => {
    const result = await duplicateDocument(documentId);
    if (!result.success || !result.data) {
      window.alert(result.error ?? "문서 복제에 실패했습니다.");
      return;
    }
    await handleRefreshDocuments();
    setCurrentDocumentId(result.data.id);
  }, [handleRefreshDocuments]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    const ok = window.confirm("문서를 휴지통으로 이동할까요?");
    if (!ok) return;
    const result = await moveDocumentToTrash(documentId);
    if (!result.success) {
      window.alert(result.error ?? "문서 삭제에 실패했습니다.");
      return;
    }
    await handleRefreshDocuments();
    if (currentDocumentId === documentId) {
      const next = documentList.find((doc) => doc.id !== documentId);
      setCurrentDocumentId(next?.id ?? null);
    }
  }, [handleRefreshDocuments, currentDocumentId, documentList]);

  const handleRenameFolder = useCallback(async (folderId: string) => {
    const target = folderList.find((f) => f.id === folderId);
    if (!target) return;
    const next = window.prompt("폴더 이름 변경", target.name || "");
    if (!next?.trim()) return;
    const result = await renameDocumentFolder(folderId, next);
    if (!result.success) {
      window.alert(result.error ?? "폴더 이름 변경에 실패했습니다.");
      return;
    }
    setFolderList((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: next.trim() } : f)));
  }, [folderList]);

  const handleDuplicateFolder = useCallback(async (folderId: string) => {
    const result = await duplicateDocumentFolder(folderId);
    if (!result.success) {
      window.alert(result.error ?? "폴더 복제에 실패했습니다.");
      return;
    }
    await handleRefreshDocuments();
  }, [handleRefreshDocuments]);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    const ok = window.confirm("폴더를 휴지통으로 이동할까요? (폴더 내 문서도 함께 이동됩니다)");
    if (!ok) return;
    const result = await moveFolderToTrash(folderId);
    if (!result.success) {
      window.alert(result.error ?? "폴더 삭제에 실패했습니다.");
      return;
    }
    await handleRefreshDocuments();
    if (activeFolderId === folderId) {
      setActiveFolderId("__trash__");
    }
  }, [handleRefreshDocuments, activeFolderId]);

  const handleExportPdf = useCallback(async () => {
    if (!currentDocument || isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const payload: PdfExportRequest = {
        projectId: project.id,
        documentId: currentDocument.id,
        documentType: (currentDocument.document_type ?? "screenplay") as "screenplay" | "document",
        contentSnapshot:
          currentDocument.content && currentDocument.content.type === "doc"
            ? currentDocument.content
            : { type: "doc", content: [{ type: "paragraph" }] },
        pageSettings: {
          pageSize: isDocumentMode ? "a4" : currentPageSize,
          margins: {
            top: margins.top,
            bottom: margins.bottom,
            left: margins.left,
            right: margins.right,
          },
        },
      };

      const response = await fetch("/api/export/pdf?debug=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "PDF 내보내기에 실패했습니다.";
        try {
          const errorBody = (await response.json()) as {
            message?: string;
            debugId?: string;
            detail?: string;
          };
          if (errorBody?.message) message = errorBody.message;
          if (errorBody?.detail) {
            message = `${message}\n원인: ${errorBody.detail}`;
          }
        } catch {
          // no-op
        }
        window.alert(message);
        return;
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("application/pdf")) {
        const bodyText = await response.text();
        console.error("[export/pdf] expected application/pdf, got:", contentType, bodyText.slice(0, 500));
        window.alert("PDF 응답이 올바르지 않습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiMatch = disposition.match(/filename="([^"]+)"/i);
      const filenameFromHeader = utf8Match?.[1]
        ? decodeURIComponent(utf8Match[1])
        : asciiMatch?.[1];
      const filename = filenameFromHeader || `${(currentDocument.title || "document").trim() || "document"}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch {
      window.alert("PDF 내보내기 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [currentDocument, currentPageSize, isDocumentMode, isExportingPdf, margins.bottom, margins.left, margins.right, margins.top, project.id]);

  /* ── 헤더 버튼: 세로 아이콘+라벨 스타일 ── */
  const headerBtnClass = [
    "flex flex-col items-center gap-0.5 h-auto py-1.5 w-14",
    "rounded-lg font-medium text-zinc-500 dark:text-zinc-400",
    "transition-all duration-150",
    "hover:bg-zinc-100/60 dark:hover:bg-white/[0.06]",
    "active:scale-95",
  ].join(" ");

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* ── 배경 (그레이스케일) ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
      </div>

      {/* ===== 헤더 바 (Liquid Glass 둥근 박스) ===== */}
      <div className="shrink-0 z-50 mx-3 mt-3">
        <header
          className={[
            "relative flex items-center justify-between",
            "rounded-2xl px-4 py-3",
            "bg-white/30 dark:bg-white/[0.04]",
            "backdrop-blur-2xl",
            "border border-white/60 dark:border-white/[0.1]",
            "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
            "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
          ].join(" ")}
        >
        {/* ── 왼쪽: 뒤로가기 + 프로젝트명 + 도구 버튼 ── */}
        <div className="flex items-center gap-0.5">
          {/* 뒤로가기 */}
          <button
            onClick={() => router.push("/")}
            className={[
              "flex items-center justify-center h-8 w-8 rounded-lg",
              "text-zinc-500 dark:text-zinc-400",
              "transition-all duration-150",
              "hover:bg-zinc-100/60 dark:hover:bg-white/[0.06]",
              "active:scale-95",
            ].join(" ")}
            title="대시보드로 돌아가기"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* 구분선 */}
          <div className="mx-1.5 h-6 w-px bg-zinc-200/60 dark:bg-white/[0.06]" />

          {/* 포맷 버튼 + 드롭다운 (다른 버튼과 동일한 세로 배치) */}
          <button
            className={`${headerBtnClass} ${leftPanel === "documents" ? "bg-zinc-100/60 dark:bg-white/[0.06]" : ""}`}
            title="문서"
            onClick={() => toggleLeftPanel("documents")}
          >
            <FileText className="h-4 w-4" />
            <span className="text-[10px]">문서</span>
          </button>
          <div className="relative">
            <button
              className={headerBtnClass}
              title="포맷"
              onClick={() => {
                setShowSettingsMenu(false);
                setShowFormatMenu((v) => !v);
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="text-[10px]">포맷</span>
            </button>
            {showFormatMenu && (
              <FormatMenu
                currentFormat={currentFormat}
                currentPageSize={currentPageSize}
                isScreenplay={!isDocumentMode}
                onFormatChange={(v) => {
                  setCurrentFormat(v);
                  setShowFormatMenu(false);
                }}
                onPageSizeChange={(v) => {
                  handlePageSizeChange(v);
                  setShowFormatMenu(false);
                }}
                onClose={() => setShowFormatMenu(false)}
              />
            )}
          </div>
          <button className={headerBtnClass} title="스타일">
            <Palette className="h-4 w-4" />
            <span className="text-[10px]">스타일</span>
          </button>
          <div className="relative">
            <button
              className={headerBtnClass}
              title="설정"
              onClick={() => {
                setShowFormatMenu(false);
                setShowSettingsMenu((v) => !v);
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="text-[10px]">설정</span>
            </button>
            {showSettingsMenu && (
              <SettingsMenu
                onClose={() => setShowSettingsMenu(false)}
              />
            )}
          </div>
          <button className={headerBtnClass} title="분할">
            <SplitSquareHorizontal className="h-4 w-4" />
            <span className="text-[10px]">분할</span>
          </button>
          <button
            className={`${headerBtnClass} ${leftPanel === "navigator" ? "bg-zinc-100/60 dark:bg-white/[0.06]" : ""}`}
            title="네비게이터"
            onClick={() => toggleLeftPanel("navigator")}
          >
            <List className="h-4 w-4" />
            <span className="text-[10px]">네비게이터</span>
          </button>
          <button
            className={`${headerBtnClass} ${showAssist ? "bg-zinc-100/60 dark:bg-white/[0.06]" : ""}`}
            title="어시스트"
            onClick={() => setShowAssist((v) => !v)}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px]">어시스트</span>
          </button>
          <button className={headerBtnClass} title="브랜치">
            <GitBranch className="h-4 w-4" />
            <span className="text-[10px]">브랜치</span>
          </button>

        </div>

        {/* ── 오른쪽: 저장 상태 + 도구 버튼 ── */}
        <div className="flex items-center gap-0.5">
          {/* 저장 상태 */}
          <span className="mr-2 text-[11px]">
            {saveStatus === "saved" && (
              <span className="text-zinc-400 dark:text-zinc-500">저장됨</span>
            )}
            {saveStatus === "saving" && (
              <span className="text-zinc-500 dark:text-zinc-400">저장 중...</span>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500 dark:text-amber-400">
                저장되지 않음
              </span>
            )}
          </span>

          <button className={headerBtnClass} title="저장">
            <Save className="h-4 w-4" />
            <span className="text-[10px]">저장</span>
          </button>
          <button className={headerBtnClass} title="공유">
            <Share2 className="h-4 w-4" />
            <span className="text-[10px]">공유</span>
          </button>
          <div className="relative">
            <button
              className={headerBtnClass}
              title="내보내기"
              onClick={() => setShowExportMenu((prev) => !prev)}
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px]">내보내기</span>
            </button>
            {showExportMenu && (
              <ExportMenu
                loading={isExportingPdf}
                onExportPdf={handleExportPdf}
                onClose={() => setShowExportMenu(false)}
              />
            )}
          </div>
          <button className={headerBtnClass} title="발송">
            <Send className="h-4 w-4" />
            <span className="text-[10px]">발송</span>
          </button>
        </div>
        </header>
      </div>

      {/* ===== 본문 (에디터 전체 폭 + 사이드바 오버레이) ===== */}
      <div className="relative flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 (오버레이 + 슬라이딩) */}
        <div
          className={[
            "absolute left-0 top-0 bottom-0 z-30",
            "transition-transform duration-300 ease-in-out",
            leftPanel ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          {renderedLeftPanel === "documents" && (
            <DocumentsSidebar
              documents={documentList}
              trashedDocuments={trashedDocumentList}
              folders={folderList}
              projectTitle={project.title}
              currentDocumentId={currentDocumentId}
              activeFolderId={activeFolderId}
              onSelect={handleSelectDocument}
              onSelectFolder={setActiveFolderId}
              onCreateFile={handleCreateDocument}
              onCreateFolder={handleCreateFolder}
              onMoveDocument={handleMoveDocument}
              onRenameDocument={handleRenameDocument}
              onDuplicateDocument={handleDuplicateDocument}
              onDeleteDocument={handleDeleteDocument}
              onRenameFolder={handleRenameFolder}
              onDuplicateFolder={handleDuplicateFolder}
              onDeleteFolder={handleDeleteFolder}
              onRefresh={handleRefreshDocuments}
              isCreating={isCreatingDocument}
              isRefreshing={isRefreshingDocuments}
            />
          )}
          {renderedLeftPanel === "navigator" && (
            <NavigatorSidebar editor={editorInstance} />
          )}
        </div>

        {/* 에디터 (전체 폭) */}
        <main className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-gray-100/50 to-gray-50/50 dark:from-zinc-900/50 dark:to-zinc-950/50">
          {isDocumentMode ? (
            <div className="flex h-full flex-col">
              <DocumentToolbar
                editor={editorInstance}
                documentId={currentDocument?.id}
                onImageUploadReady={(fn) => {
                  documentImageUploadTriggerRef.current = fn;
                }}
              />

              <div className="flex flex-1 flex-col items-center overflow-y-auto px-8">
                {/* Ruler — A4 폭, 툴바 아래 */}
                <div className="sticky top-0 z-20 shrink-0 pt-4 pb-0 bg-gradient-to-b from-gray-100/80 via-gray-100/60 to-transparent dark:from-zinc-900/80 dark:via-zinc-900/60 dark:to-transparent" style={{ width: documentPage.width }}>
                  <Ruler
                    widthPx={documentPage.width}
                    totalInches={documentPage.width / PX_PER_INCH}
                    leftMarginPx={margins.left}
                    rightMarginPx={margins.right}
                  />
                </div>

                {/* 단일 페이지 캔버스 + 자연 스크롤 */}
                <div
                  className="relative shrink-0"
                  style={{
                    width: documentPage.width,
                    minHeight: canvasHeight,
                  }}
                >
                  {Array.from({ length: pageCount }, (_, i) => (
                    <div
                      key={i}
                      className={[
                        "absolute left-0 pointer-events-none",
                        "bg-white dark:bg-zinc-900",
                        "border border-zinc-200/60 dark:border-white/[0.06]",
                        "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.3)]",
                        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]",
                      ].join(" ")}
                      style={{
                        top: i * (documentPage.height + pageGap),
                        width: documentPage.width,
                        height: documentPage.height,
                      }}
                    />
                  ))}

                  {/* 라인 넘버 거터 — A4 왼쪽 바깥 */}
                  <LineNumbers
                    editor={editorInstance}
                    pageCount={pageCount}
                    topPadding={lineNumberTopPadding}
                  />

                  <div
                    className="relative"
                    style={{
                      minHeight: documentPage.height,
                      paddingTop: margins.top,
                      paddingRight: margins.right,
                      paddingBottom: margins.bottom,
                      paddingLeft: margins.left,
                      boxSizing: "border-box",
                    }}
                  >
                    {currentDocument ? (
                      <DocumentEditor
                        key={currentDocument.id}
                        content={currentDocument.content}
                        onUpdate={handleUpdate}
                        onEditorReady={handleEditorReady}
                        onRequestImageUpload={() => {
                          documentImageUploadTriggerRef.current?.();
                        }}
                      />
                    ) : (
                      <p className="text-center text-sm text-zinc-400">
                        문서를 찾을 수 없습니다.
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-12 shrink-0" />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Screenplay 툴바 */}
              <div className="shrink-0 px-8 pt-3">
                <div
                  className={[
                    "mx-auto flex w-full max-w-[980px] items-center gap-1 rounded-xl px-3 py-2",
                    "bg-white/35 dark:bg-white/[0.04]",
                    "backdrop-blur-2xl",
                    "border border-white/60 dark:border-white/[0.1]",
                    "shadow-[0_4px_24px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]",
                    "dark:shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-md",
                      "text-zinc-500 transition-colors",
                      "hover:bg-white/60 hover:text-zinc-800",
                      "dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100",
                    ].join(" ")}
                    title="뒤로가기"
                    onClick={() => editorInstance?.chain().focus().undo().run()}
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-md",
                      "text-zinc-500 transition-colors",
                      "hover:bg-white/60 hover:text-zinc-800",
                      "dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100",
                    ].join(" ")}
                    title="앞으로가기"
                    onClick={() => editorInstance?.chain().focus().redo().run()}
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>

                  <div className="mx-1 h-5 w-px bg-zinc-200/80 dark:bg-white/[0.08]" />

                  <NodeTypeDropdown
                    value={currentNodeType}
                    onChange={handleNodeTypeChange}
                  />
                </div>
              </div>

            <div className="flex flex-1 flex-col items-center overflow-y-auto px-8">
              {/* Ruler — A4 폭, 상단 고정 */}
              <div className="sticky top-0 z-20 shrink-0 pt-4 pb-0 bg-gradient-to-b from-gray-100/80 via-gray-100/60 to-transparent dark:from-zinc-900/80 dark:via-zinc-900/60 dark:to-transparent" style={{ width: screenplayPage.width }}>
                <Ruler
                  widthPx={screenplayPage.width}
                  totalInches={activeRulerInches}
                  leftMarginPx={margins.left}
                  rightMarginPx={margins.right}
                />
              </div>

              {/* 단일 페이지 캔버스 + 자연 스크롤 + 라인 넘버 래퍼 */}
              <div
                className="relative shrink-0"
                style={{
                  width: screenplayPage.width,
                  minHeight: canvasHeight,
                }}
              >
                {Array.from({ length: pageCount }, (_, i) => (
                  <div
                    key={i}
                    className={[
                      "absolute left-0 pointer-events-none",
                      "bg-white dark:bg-zinc-900",
                      "border border-zinc-200/60 dark:border-white/[0.06]",
                      "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.3)]",
                      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.04)]",
                    ].join(" ")}
                    style={{
                      top: i * (screenplayPage.height + pageGap),
                      width: screenplayPage.width,
                      height: screenplayPage.height,
                    }}
                  />
                ))}

                {/* 라인 넘버 거터 — A4 왼쪽 바깥 */}
                <LineNumbers
                  editor={editorInstance}
                  pageCount={pageCount}
                  topPadding={lineNumberTopPadding}
                />

                {/* 에디터 (연속 흐름, 첫 페이지 상단 여백) */}
                <div
                  className="relative"
                  style={{
                    minHeight: screenplayPage.height,
                    paddingTop: margins.top,
                    paddingBottom: margins.bottom,
                    boxSizing: "border-box",
                  }}
                >
                  {currentDocument ? (
                    <ScenarioEditor
                      key={currentDocument.id}
                      content={currentDocument.content}
                      onUpdate={handleUpdate}
                      onEditorReady={handleEditorReady}
                    />
                  ) : (
                    <p className="text-center text-sm text-zinc-400">
                      문서를 찾을 수 없습니다.
                    </p>
                  )}
                </div>
              </div>

              {/* 용지 아래 여백 */}
              <div className="h-12 shrink-0" />
            </div>
            </div>
          )}
        </main>

        {/* 오른쪽 사이드바 (오버레이 + 슬라이딩) */}
        <div
          className={[
            "absolute right-0 top-0 bottom-0 z-30",
            "transition-transform duration-300 ease-in-out",
            showAssist ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <AssistSidebar
            documentId={currentDocument?.id}
            projectId={project.id}
          />
        </div>
      </div>
    </div>
  );
}
