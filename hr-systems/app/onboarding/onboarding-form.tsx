"use client";

import { useState, useTransition } from "react";
import { createOrganization } from "./actions";
import { slugify } from "@/lib/org-slug";

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const [name, setName] = useState(defaultName ?? "");
  const [slug, setSlug] = useState(defaultName ? slugify(defaultName) : "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) {
      setSlug(slugify(v));
    }
  };

  const handleSlugChange = (v: string) => {
    setSlugTouched(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createOrganization({ name, slug });
      if (!result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tạo workspace của bạn</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Mỗi workspace là 1 tổ chức riêng, dữ liệu hoàn toàn cách ly với org khác.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tên tổ chức
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="VD: Acme Studio"
          required
          minLength={2}
          maxLength={50}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Subdomain (slug)
        </label>
        <div className="flex items-center">
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="acme"
            required
            minLength={2}
            maxLength={32}
            pattern="[a-z0-9-]+"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-l-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-700 rounded-r-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            .jobihome.vn
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Chỉ chứa chữ thường, số, dấu gạch ngang. Workspace sẽ truy cập tại{" "}
          <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">{slug || "your-slug"}.jobihome.vn</code>
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !name || !slug}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition"
      >
        {isPending ? "Đang tạo..." : "Tạo workspace"}
      </button>
    </form>
  );
}
