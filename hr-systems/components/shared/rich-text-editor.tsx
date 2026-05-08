"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CDN_SCRIPT = "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js";
const CDN_CSS = "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.css";
const SCRIPT_ID = "ck-cdn-script";

let ckReady = false;
const waiters: Array<() => void> = [];

function loadCKEditor(cb: () => void) {
  if (ckReady) { cb(); return; }
  waiters.push(cb);
  if (document.getElementById(SCRIPT_ID)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CDN_CSS;
  document.head.appendChild(link);

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = CDN_SCRIPT;
  script.onload = () => {
    ckReady = true;
    waiters.splice(0).forEach((fn) => fn());
  };
  document.head.appendChild(script);
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let destroyed = false;

    loadCKEditor(() => {
      if (destroyed || !mountRef.current) return;

      (window as any).ClassicEditor.create(mountRef.current, {
        initialData: value,
        placeholder: placeholder ?? "Nhập mô tả chi tiết...",
        toolbar: [
          "bold", "italic", "underline", "|",
          "bulletedList", "numberedList", "|",
          "link", "blockQuote", "|",
          "undo", "redo",
        ],
      }).then((editor: any) => {
        if (destroyed) { editor.destroy(); return; }
        editorRef.current = editor;
        editor.model.document.on("change:data", () => {
          onChangeRef.current(editor.getData());
        });
      });
    });

    return () => {
      destroyed = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync khi form reset hoặc value thay đổi từ bên ngoài
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getData() !== value) editor.setData(value ?? "");
  }, [value]);

  return (
    <div className="ck-editor-wrap">
      <div ref={mountRef} />
    </div>
  );
}
