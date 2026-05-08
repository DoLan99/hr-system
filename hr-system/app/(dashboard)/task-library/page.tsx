import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TaskLibraryClient } from "./_components/task-library-client";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Task Library — HR System",
};

export default async function TaskLibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const tasks = await prisma.taskLibrary.findMany({
    orderBy: [{ department: "asc" }, { taskId: "asc" }],
  });

  const activeCount = tasks.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Library"
        description={`${activeCount} task đang active · ${tasks.length} tổng`}
      >
        {/* Action buttons được render trong client component để có role check */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <BookOpen className="w-4 h-4" />
          <span>Thư viện task chuẩn của công ty</span>
        </div>
      </PageHeader>

      {/* Quick guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">Hướng dẫn sử dụng Task ID</p>
        <ul className="space-y-0.5 text-blue-600">
          <li>• Dùng Task ID khi nhập <strong>Work Report</strong> — chọn đúng ID để thời gian chuẩn (Std time) tự điền</li>
          <li>• <strong>1001</strong> — Học & tìm hiểu: bắt buộc link tài liệu + note + video</li>
          <li>• <strong>2001 / 2002</strong> — Việc mới chưa có: Qty = số phút, bắt buộc video + link</li>
          <li>• Nếu Actual &gt; Std time: bắt buộc quay video minh chứng → ghi vào Time Check</li>
        </ul>
      </div>

      <TaskLibraryClient initialTasks={tasks} />
    </div>
  );
}
