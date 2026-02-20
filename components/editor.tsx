"use client";

import {
  PartialBlock,
  createCodeBlockSpec,
  BlockNoteSchema,
  BlockNoteEditor,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  createReactBlockSpec,
  DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { useEdgeStore } from "@/lib/edgestore";
import { codeBlockOptions } from "@blocknote/code-block";
import { FileText } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useRef, useEffect } from "react";
import "@blocknote/core/style.css";
import "@blocknote/mantine/style.css";

// --- Helpers ---

function filterItems<T extends { title: string; aliases?: readonly string[] }>(
  items: T[],
  query: string,
): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.aliases?.some((a) => a.toLowerCase().includes(q)),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectPageIds(blocks: any[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.type === "page" && block.props?.pageId) {
      ids.add(block.props.pageId);
    }
    if (Array.isArray(block.children) && block.children.length > 0) {
      for (const id of collectPageIds(block.children)) ids.add(id);
    }
  }
  return ids;
}

function initPageIds(initialContent?: string): Set<string> {
  if (!initialContent) return new Set();
  try {
    return collectPageIds(JSON.parse(initialContent));
  } catch {
    return new Set();
  }
}

// --- Page link block ---

const PageBlockView = ({ pageId }: { pageId: string }) => {
  const router = useRouter();
  const doc = useQuery(
    api.documents.getById,
    pageId ? { documentId: pageId as Id<"documents"> } : "skip",
  );

  return (
    <div
      role="button"
      contentEditable={false}
      onClick={() => pageId && router.push(`/documents/${pageId}`)}
      className="my-1 flex cursor-pointer select-none items-center gap-x-2 rounded-md border border-border px-3 py-2 text-sm transition-colors duration-150 hover:bg-accent"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="font-medium text-foreground">
        {doc === undefined ? "Loading…" : doc?.title || "Untitled"}
      </span>
    </div>
  );
};

// createReactBlockSpec returns a factory function — call it () to get the BlockSpec
const PageLinkBlock = createReactBlockSpec(
  {
    type: "page" as const,
    propSchema: { pageId: { default: "" } },
    content: "none",
  },
  {
    render: ({ block }) => <PageBlockView pageId={block.props.pageId} />,
  },
);

// --- Schema ---

const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    codeBlock: createCodeBlockSpec({
      ...codeBlockOptions,
      defaultLanguage: "typescript",
      supportedLanguages: {
        typescript: { name: "TypeScript", aliases: ["ts"] },
        javascript: { name: "JavaScript", aliases: ["js"] },
        python: { name: "Python", aliases: ["py"] },
        cpp: { name: "C++", aliases: ["cpp", "c++"] },
        java: { name: "Java" },
        rust: { name: "Rust", aliases: ["rs"] },
        go: { name: "Go" },
        sql: { name: "SQL" },
        html: { name: "HTML" },
        css: { name: "CSS" },
      },
    }),
    // PageLinkBlock is a factory — invoke it to produce the BlockSpec
    page: PageLinkBlock(),
  },
});

// --- Editor ---

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
  onCreatePage?: (title: string) => Promise<string>;
  onArchivePage?: (pageId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditorReady?: (editor: BlockNoteEditor<any, any, any>) => void;
}

const Editor = ({
  onChange,
  initialContent,
  editable,
  onCreatePage,
  onArchivePage,
  onEditorReady,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  // Track which page-block IDs exist in the document so we can detect deletions
  const prevPageIdsRef = useRef<Set<string>>(initPageIds(initialContent));

  const handleUpload = async (file: File) => {
    const res = await edgestore.publicFiles.upload({ file });
    return res.url;
  };

  const editor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
    schema,
  });

  useEffect(() => {
    onEditorReady?.(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once after mount — editor ref is stable

  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2));

    if (onArchivePage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentPageIds = collectPageIds(editor.document as any[]);
      for (const id of prevPageIdsRef.current) {
        if (!currentPageIds.has(id)) {
          onArchivePage(id);
        }
      }
      prevPageIdsRef.current = currentPageIds;
    }
  };

  const getSlashMenuItems = async (
    query: string,
  ): Promise<DefaultReactSuggestionItem[]> => {
    const defaultItems = getDefaultReactSlashMenuItems(editor);

    if (!onCreatePage) {
      return filterItems(defaultItems, query);
    }

    const pageItem: DefaultReactSuggestionItem = {
      title: "Page",
      aliases: ["page", "subpage", "child"],
      group: "Pages",
      icon: <FileText size={18} />,
      subtext: "Create a linked sub-page",
      onItemClick: async () => {
        const currentBlock = editor.getTextCursorPosition().block;
        const pageId = await onCreatePage("Untitled");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).updateBlock(currentBlock, {
          type: "page",
          props: { pageId },
        });
      },
    };

    return filterItems([pageItem, ...defaultItems], query);
  };

  return (
    <BlockNoteView
      editable={editable}
      editor={editor}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onChange={handleEditorChange}
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={getSlashMenuItems}
      />
    </BlockNoteView>
  );
};

export default Editor;
