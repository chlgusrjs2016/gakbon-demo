"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FilePlus2,
  FileText,
  Film,
  FolderPlus,
  MoreHorizontal,
  PenLine,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { DocumentFolder, DocumentType } from "@/app/actions/document";
import SidebarPanel from "@/components/editor/SidebarPanel";

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

const INDENT_STEP = 20;

type DocumentItem = {
  id: string;
  title: string;
  folder_id?: string | null;
  document_type?: "screenplay" | "document";
};

type FolderItem = DocumentFolder & {
  parent_folder_id?: string | null;
};

type Props = {
  documents: DocumentItem[];
  trashedDocuments: DocumentItem[];
  folders: DocumentFolder[];
  projectTitle: string;
  currentDocumentId: string | null;
  activeFolderId: string | null | "__trash__" | "__none__";
  onSelect: (documentId: string) => void;
  onSelectFolder: (folderId: string | null | "__trash__" | "__none__") => void;
  onCreateFile: (documentType: DocumentType) => void;
  onCreateFolder?: () => void;
  onMoveDocument?: (args: {
    draggedDocumentId: string;
    targetFolderId: string | null;
    beforeDocumentId?: string | null;
  }) => void;
  onRenameDocument?: (documentId: string) => void;
  onDuplicateDocument?: (documentId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
  onRenameFolder?: (folderId: string) => void;
  onDuplicateFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRefresh?: () => void;
  isCreating?: boolean;
  isRefreshing?: boolean;
};

function DocumentRow({
  doc,
  active,
  onClick,
  onRename,
  onDuplicate,
  onDelete,
}: {
  doc: DocumentItem;
  active: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(onRename || onDuplicate || onDelete);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showMenu]);

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        className={[
          "w-full rounded-lg px-3 py-2 text-left transition-colors",
          active
            ? "bg-white/60 text-zinc-900 dark:bg-white/[0.1] dark:text-zinc-100"
            : "text-zinc-600 hover:bg-white/45 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
        ].join(" ")}
      >
        <div className="flex items-center gap-1.5 pr-8">
          {doc.document_type === "document" ? (
            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          ) : (
            <Film className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
          )}
          <p className="truncate text-xs font-medium">
            {doc.title || "제목 없음"}
          </p>
        </div>
      </button>
      {hasActions && (
        <div ref={menuRef} className="absolute right-1 top-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 rounded-md p-1 text-zinc-500 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/[0.08]"
            title="메뉴"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {showMenu && (
            <div className={["absolute right-0 top-6 z-[120] min-w-[130px]", MENU_SURFACE_CLASS].join(" ")}>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]"].join(" ")}
                onClick={() => { setShowMenu(false); onRename?.(); }}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>이름변경</span>
              </button>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]"].join(" ")}
                onClick={() => { setShowMenu(false); onDuplicate?.(); }}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>복제</span>
              </button>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10"].join(" ")}
                onClick={() => { setShowMenu(false); onDelete?.(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentsSidebar({
  documents,
  trashedDocuments,
  folders,
  projectTitle,
  currentDocumentId,
  activeFolderId,
  onSelect,
  onSelectFolder,
  onCreateFile,
  onCreateFolder,
  onMoveDocument,
  onRenameDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onRenameFolder,
  onDuplicateFolder,
  onDeleteFolder,
  onRefresh,
  isCreating = false,
  isRefreshing = false,
}: Props) {
  const folderItems = folders as FolderItem[];
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [rootExpanded, setRootExpanded] = useState(true);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    }
    if (showCreateMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCreateMenu]);

  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);

  const docsByFolder = useMemo(() => {
    const map = new Map<string | null, DocumentItem[]>();
    map.set(null, []);
    for (const folder of folderItems) map.set(folder.id, []);
    for (const doc of documents) {
      const key = doc.folder_id ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(doc);
    }
    return map;
  }, [documents, folderItems]);

  const foldersByParent = useMemo(() => {
    const map = new Map<string | null, FolderItem[]>();
    map.set(null, []);
    for (const folder of folderItems) {
      const parentId = folder.parent_folder_id ?? null;
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(folder);
    }
    return map;
  }, [folderItems]);

  const [draggingDocumentId, setDraggingDocumentId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{ folderId: string | null; beforeDocumentId?: string | null } | null>(null);

  const renderFolderNode = (folder: FolderItem, depth: number) => {
    const expanded = expandedFolders[folder.id] ?? true;
    const folderDocs = docsByFolder.get(folder.id) ?? [];
    const childFolders = foldersByParent.get(folder.id) ?? [];

    return (
      <div key={folder.id} className="pt-1" style={{ marginLeft: depth * INDENT_STEP }}>
        <div className="group relative">
          <button
            type="button"
            onClick={() => {
              onSelectFolder(folder.id);
              setExpandedFolders((prev) => ({ ...prev, [folder.id]: !expanded }));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDropHint({ folderId: folder.id, beforeDocumentId: null });
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData("text/plain");
              if (!draggedId) return;
              onMoveDocument?.({
                draggedDocumentId: draggedId,
                targetFolderId: folder.id,
                beforeDocumentId: null,
              });
              setDraggingDocumentId(null);
              setDropHint(null);
            }}
            className={[
              "flex w-full items-center gap-1.5 rounded-md px-3 py-2 pr-8 text-left text-xs transition-colors",
              activeFolderId === folder.id
                ? "bg-white/60 text-zinc-900 dark:bg-white/[0.1] dark:text-zinc-100"
                : "text-zinc-500 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
              dropHint?.folderId === folder.id && !dropHint.beforeDocumentId
                ? "ring-1 ring-emerald-400/70"
                : "",
            ].join(" ")}
          >
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
            </span>
            <span className="truncate">{folder.name}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenFolderMenuId((prev) => (prev === folder.id ? null : folder.id));
            }}
            className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 rounded-md p-1 text-zinc-500 hover:bg-white/60 dark:text-zinc-300 dark:hover:bg-white/[0.08]"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {openFolderMenuId === folder.id && (
            <div className={["absolute right-1 top-6 z-[120] min-w-[130px]", MENU_SURFACE_CLASS].join(" ")}>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]"].join(" ")}
                onClick={() => { setOpenFolderMenuId(null); onRenameFolder?.(folder.id); }}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span>이름변경</span>
              </button>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-zinc-600 dark:text-zinc-300 hover:bg-white/40 dark:hover:bg-white/[0.06]"].join(" ")}
                onClick={() => { setOpenFolderMenuId(null); onDuplicateFolder?.(folder.id); }}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>복제</span>
              </button>
              <button
                className={[MENU_ITEM_BASE_CLASS, "text-rose-600 dark:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-rose-500/10"].join(" ")}
                onClick={() => { setOpenFolderMenuId(null); onDeleteFolder?.(folder.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
        {expanded && (
          <div className="mt-1 space-y-1">
            {folderDocs.length > 0 ? (
              folderDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{ marginLeft: INDENT_STEP }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", doc.id);
                    setDraggingDocumentId(doc.id);
                  }}
                  onDragEnd={() => {
                    setDraggingDocumentId(null);
                    setDropHint(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropHint({ folderId: folder.id, beforeDocumentId: doc.id });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData("text/plain");
                    if (!draggedId) return;
                    onMoveDocument?.({
                      draggedDocumentId: draggedId,
                      targetFolderId: folder.id,
                      beforeDocumentId: doc.id,
                    });
                    setDraggingDocumentId(null);
                    setDropHint(null);
                  }}
                  className={draggingDocumentId === doc.id ? "opacity-60" : ""}
                >
                  <DocumentRow
                    doc={doc}
                    active={doc.id === currentDocumentId}
                    onClick={() => onSelect(doc.id)}
                    onRename={() => onRenameDocument?.(doc.id)}
                    onDuplicate={() => onDuplicateDocument?.(doc.id)}
                    onDelete={() => onDeleteDocument?.(doc.id)}
                  />
                </div>
              ))
            ) : (
              <p className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500" style={{ marginLeft: INDENT_STEP }}>
                폴더가 비어 있습니다.
              </p>
            )}

            {childFolders.map((childFolder) => renderFolderNode(childFolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const headerActions = (
    <>
      <div className="relative" ref={createMenuRef}>
        <button
          type="button"
          disabled={isCreating}
          onClick={() => setShowCreateMenu((prev) => !prev)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/50 hover:text-zinc-700 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
          title="New File"
        >
          <FilePlus2 className="h-4 w-4" />
        </button>
        {showCreateMenu && (
          <div className="absolute right-0 top-full z-[100] mt-1.5 min-w-[150px] rounded-xl border border-white/60 bg-white/40 py-1.5 backdrop-blur-3xl saturate-150 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(255,255,255,0.4),inset_0_0.5px_0_rgba(255,255,255,0.5)] dark:border-white/[0.1] dark:bg-zinc-900/40 dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.06),inset_0_0.5px_0_rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => {
                onCreateFile("screenplay");
                setShowCreateMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-600 transition-all duration-100 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            >
              <Film className="h-3.5 w-3.5" />
              <span>시나리오</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateFile("document");
                setShowCreateMenu(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-600 transition-all duration-100 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>문서</span>
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCreateFolder}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/50 hover:text-zinc-700 dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
        title="New Folder"
      >
        <FolderPlus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/50 hover:text-zinc-700 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100"
        title="Refresh"
      >
        <RefreshCw className={["h-4 w-4", isRefreshing ? "animate-spin" : ""].join(" ")} />
      </button>
    </>
  );

  return (
    <SidebarPanel
      side="left"
      title="문서"
      icon={<FileText className="h-4 w-4" />}
      headerActions={headerActions}
      bodyClassName="min-h-0 overflow-y-auto px-2 py-2"
    >
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setDropHint({ folderId: null, beforeDocumentId: null });
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            if (!draggedId) return;
            onMoveDocument?.({
              draggedDocumentId: draggedId,
              targetFolderId: null,
              beforeDocumentId: null,
            });
            setDraggingDocumentId(null);
            setDropHint(null);
          }}
          className={[
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            activeFolderId === null
              ? "bg-white/60 text-zinc-900 dark:bg-white/[0.1] dark:text-zinc-100"
              : "text-zinc-500 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
            dropHint?.folderId === null && !dropHint.beforeDocumentId ? "ring-1 ring-emerald-400/70" : "",
          ].join(" ")}
        >
          <span
            className="inline-flex h-3.5 w-3.5 items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setRootExpanded((prev) => !prev);
            }}
          >
            {rootExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </span>
          <span>{projectTitle}</span>
        </button>
        {rootExpanded && (
          <div>
            {(docsByFolder.get(null) ?? []).map((doc) => (
              <div
                key={doc.id}
                style={{ marginLeft: INDENT_STEP }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", doc.id);
                  setDraggingDocumentId(doc.id);
                }}
                onDragEnd={() => {
                  setDraggingDocumentId(null);
                  setDropHint(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropHint({ folderId: null, beforeDocumentId: doc.id });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  if (!draggedId) return;
                  onMoveDocument?.({
                    draggedDocumentId: draggedId,
                    targetFolderId: null,
                    beforeDocumentId: doc.id,
                  });
                  setDraggingDocumentId(null);
                  setDropHint(null);
                }}
                className={draggingDocumentId === doc.id ? "opacity-60" : ""}
              >
                <DocumentRow
                  doc={doc}
                  active={doc.id === currentDocumentId}
                  onClick={() => onSelect(doc.id)}
                  onRename={() => onRenameDocument?.(doc.id)}
                  onDuplicate={() => onDuplicateDocument?.(doc.id)}
                  onDelete={() => onDeleteDocument?.(doc.id)}
                />
              </div>
            ))}

            {(foldersByParent.get(null) ?? []).map((folder) => renderFolderNode(folder, 1))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-500">아직 문서가 없습니다.</p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onSelectFolder("__trash__")}
            className={[
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
              activeFolderId === "__trash__"
                ? "bg-white/60 text-zinc-900 dark:bg-white/[0.1] dark:text-zinc-100"
                : "text-zinc-500 hover:bg-white/40 dark:text-zinc-300 dark:hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>휴지통</span>
            <span className="ml-auto text-[10px] text-zinc-400">{trashedDocuments.length}</span>
          </button>
          {activeFolderId === "__trash__" && (
            <div className="mt-1 space-y-1 pl-4">
              {trashedDocuments.length > 0 ? (
                trashedDocuments.map((doc) => <DocumentRow key={doc.id} doc={doc} active={false} onClick={() => {}} />)
              ) : (
                <p className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-500">휴지통이 비어 있습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarPanel>
  );
}
