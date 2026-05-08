"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { TaskLibrary } from "@prisma/client";
import { TaskFormModal } from "./task-form-modal";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMinutes } from "@/lib/utils";

const DEPARTMENTS_ORDER = ["All", "Dev", "Admin", "Sales", "Design", "QA", "Khác"];
const SPECIAL_IDS = ["1001", "2001", "2002"];
const WRITE_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

interface Props {
  initialTasks: TaskLibrary[];
}

export function TaskLibraryClient({ initialTasks }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role ?? "";
  const canWrite = WRITE_ROLES.includes(role);

  const [tasks, setTasks] = useState<TaskLibrary[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskLibrary | null>(null);
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Filtered + grouped ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (activeOnly && !t.isActive) return false;
      if (filterDept && t.department !== filterDept) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.taskId.toLowerCase().includes(q) ||
          t.taskName.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, search, filterDept, activeOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, TaskLibrary[]>();
    for (const t of filtered) {
      const dept = t.department ?? "Khác";
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(t);
    }
    // Sort departments theo thứ tự ưu tiên
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ia = DEPARTMENTS_ORDER.indexOf(a);
      const ib = DEPARTMENTS_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [filtered]);

  const allDepts = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => t.department && s.add(t.department));
    return Array.from(s).sort((a, b) => {
      const ia = DEPARTMENTS_ORDER.indexOf(a);
      const ib = DEPARTMENTS_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [tasks]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task: TaskLibrary) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleSaved(saved: TaskLibrary) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    router.refresh();
  }

  async function toggleActive(task: TaskLibrary) {
    if (togglingId) return;
    setTogglingId(task.id);
    try {
      const res = await fetch(`/api/task-library/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setTasks((prev) => prev.map((t: TaskLibrary) => (t.id === data.id ? data : t)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  function toggleCollapse(dept: string) {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) { next.delete(dept); } else { next.add(dept); }
      return next;
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm Task ID hoặc tên..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Department filter */}
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tất cả phòng ban</option>
          {allDepts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Active toggle */}
        <button
          onClick={() => setActiveOnly(!activeOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition ${
            activeOnly
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-300 text-slate-600"
          }`}
        >
          {activeOnly ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          Active only
        </button>

        {/* Add button */}
        {canWrite && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Thêm task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>
          Hiển thị <strong className="text-slate-800">{filtered.length}</strong> /{" "}
          <strong className="text-slate-800">{tasks.length}</strong> tasks
        </span>
        {!activeOnly && (
          <span>
            Ẩn:{" "}
            <strong className="text-slate-800">
              {tasks.filter((t) => !t.isActive).length}
            </strong>
          </span>
        )}
      </div>

      {/* Table grouped by department */}
      {grouped.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Không có task nào"
          description={
            search
              ? `Không tìm thấy kết quả cho "${search}"`
              : "Chưa có task nào trong thư viện"
          }
          action={
            canWrite ? (
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Thêm task đầu tiên
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {grouped.map(([dept, deptTasks]) => {
            const collapsed = collapsedDepts.has(dept);
            return (
              <div
                key={dept}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Dept header */}
                <button
                  onClick={() => toggleCollapse(dept)}
                  className="w-full flex items-center gap-3 px-5 py-3 bg-slate-50 hover:bg-slate-100 transition text-left"
                >
                  {collapsed ? (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-semibold text-slate-700">
                    {dept}
                  </span>
                  <Badge variant="info">{deptTasks.length}</Badge>
                </button>

                {/* Tasks */}
                {!collapsed && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium">
                        <th className="text-left px-5 py-2.5 w-28">Task ID</th>
                        <th className="text-left px-3 py-2.5">Tên task & mô tả</th>
                        <th className="text-center px-3 py-2.5 w-24">Std time</th>
                        <th className="text-center px-3 py-2.5 w-24">Status</th>
                        {canWrite && (
                          <th className="text-right px-5 py-2.5 w-32">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {deptTasks.map((task) => {
                        const isSpecial = SPECIAL_IDS.includes(task.taskId);
                        return (
                          <tr
                            key={task.id}
                            className={`border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition ${
                              !task.isActive ? "opacity-50" : ""
                            }`}
                          >
                            {/* Task ID */}
                            <td className="px-5 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono font-semibold text-slate-800 text-xs">
                                  {task.taskId}
                                </span>
                                {isSpecial && (
                                  <Badge variant="warning" className="w-fit">
                                    <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                                    Đặc biệt
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Name + description */}
                            <td className="px-3 py-3">
                              <p className="font-medium text-slate-800">{task.taskName}</p>
                              {task.description && (
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {(task.note1 || task.note2) && (
                                <div className="flex gap-2 mt-1">
                                  {task.note1 && (
                                    <Badge variant="ghost">{task.note1}</Badge>
                                  )}
                                  {task.note2 && (
                                    <Badge variant="ghost">{task.note2}</Badge>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Std time */}
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`font-mono text-xs px-2 py-1 rounded-lg ${
                                  task.stdTime === 1
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-blue-50 text-blue-700 font-semibold"
                                }`}
                              >
                                {formatMinutes(task.stdTime)}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 text-center">
                              <Badge variant={task.isActive ? "success" : "ghost"}>
                                {task.isActive ? "Active" : "Ẩn"}
                              </Badge>
                            </td>

                            {/* Actions */}
                            {canWrite && (
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openEdit(task)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Chỉnh sửa"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleActive(task)}
                                    disabled={togglingId === task.id}
                                    className={`p-1.5 rounded-lg transition ${
                                      task.isActive
                                        ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                        : "text-slate-400 hover:text-green-600 hover:bg-green-50"
                                    }`}
                                    title={task.isActive ? "Ẩn task" : "Kích hoạt lại"}
                                  >
                                    {task.isActive ? (
                                      <ToggleRight className="w-3.5 h-3.5" />
                                    ) : (
                                      <ToggleLeft className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <TaskFormModal
        open={modalOpen}
        task={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}
