"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import PlaceholderExt from "@tiptap/extension-placeholder";
import LinkExt from "@tiptap/extension-link";
import UnderlineExt from "@tiptap/extension-underline";
import { TextStyle as TextStyleExt } from "@tiptap/extension-text-style";
import { Color as ColorExt } from "@tiptap/extension-color";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Undo2, Redo2, Baseline,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const TEXT_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b",
];

function ColorPicker({ editor }: { editor: import("@tiptap/react").Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = editor.getAttributes("textStyle").color as string | undefined;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Màu chữ"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="w-7 h-7 flex items-center justify-center rounded transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800"
      >
        <Baseline className="w-3.5 h-3.5" style={current ? { color: current } : undefined} />
      </button>
      {open && (
        <div className="absolute z-20 top-8 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 flex flex-wrap gap-1.5 w-[148px]">
          <button
            type="button"
            title="Mặc định"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setOpen(false); }}
            className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-500"
          >
            ×
          </button>
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setOpen(false); }}
              className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600"
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Strip inline color/background/font styles from pasted HTML so pasted text
 *  always inherits the editor's own theme color instead of the source page's. */
function stripPastedStyles(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    el.style.removeProperty("color");
    el.style.removeProperty("background");
    el.style.removeProperty("background-color");
    el.style.removeProperty("font-family");
    if (!el.getAttribute("style")) el.removeAttribute("style");
  });
  doc.querySelectorAll("font").forEach((el) => {
    el.removeAttribute("color");
    el.removeAttribute("face");
  });
  return doc.body.innerHTML;
}

export function RichTextEditor({ value, onChange, onBlur, placeholder, minHeight = 120, readOnly = false }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      TextStyleExt,
      ColorExt,
      PlaceholderExt.configure({
        placeholder: placeholder ?? "Add a description...",
      }),
      LinkExt.configure({ openOnClick: false }),
    ],
    content: value || "",
    editable: !readOnly,
    editorProps: {
      transformPastedHTML: stripPastedStyles,
    },
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
          <ColorPicker editor={editor} />
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
