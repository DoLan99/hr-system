"use client";

import { useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  return (
    <div className="ck-editor-wrap">
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        config={{
          licenseKey: "GPL",
          placeholder: placeholder ?? "Nhập mô tả chi tiết...",
          toolbar: [
            "bold", "italic", "underline", "|",
            "bulletedList", "numberedList", "|",
            "link", "blockQuote", "|",
            "undo", "redo",
          ],
        }}
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
