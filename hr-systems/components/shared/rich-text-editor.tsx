"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PlaceholderExt from "@tiptap/extension-placeholder";
import LinkExt from "@tiptap/extension-link";
import UnderlineExt from "@tiptap/extension-underline";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Undo2, Redo2,
} from "lucide-react";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number;
  readOnly?: boolean;
}

function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-slate-700 text-white"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 disabled:opacity-30"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-slate-300 mx-0.5 self-center flex-shrink-0" />;
}

export function RichTextEditor({ value, onChange, onBlur, placeholder, minHeight = 120, readOnly = false }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      PlaceholderExt.configure({
        placeholder: placeholder ?? "Add a description...",
      }),
      LinkExt.configure({ openOnClick: false }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    onBlur() {
      onBlur?.();
    },
  });

  // Sync external value changes (e.g. form reset or switching tasks)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming) {
      editor.commands.setContent(incoming);
    }
  }, [value, editor]);

  // Toggle editable when readOnly changes
  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [readOnly, editor]);

  if (!editor) return null;

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 ${!readOnly ? "focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-300 transition-all" : ""}`}>
      {/* Toolbar — hidden in read-only mode */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex-wrap">
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
            <Italic className="w-3.5 h-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
            <Underline className="w-3.5 h-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </Btn>
          <Divider />
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </Btn>
          <Divider />
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote className="w-3.5 h-3.5" />
          </Btn>
          <Divider />
          <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <Redo2 className="w-3.5 h-3.5" />
          </Btn>
        </div>
      )}

      {/* Editor area */}
      <div
        className="px-3 py-2.5 prose prose-sm max-w-none cursor-text"
        style={{ minHeight }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/** Renders saved HTML as read-only prose — no editor overhead */
export function RichTextContent({ html, className }: { html: string | null; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
