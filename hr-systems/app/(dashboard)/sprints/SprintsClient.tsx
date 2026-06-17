"use client";

import { useState } from "react";

type Sprint = {
  id: number;
  name: string;
  goal: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  _count: { tasks: number };
};

type TaskItem = {
  id: number;
  code: string;
  title: string;
  status: string;
  priority: string;
  sprintId: number | null;
  assignedTo: { id: number; fullName: string };
  _count: { subTasks: number };
};

type Props = {
  sprints: Sprint[];
  tasks: TaskItem[];
  isManager: boolean;
  currentEmployeeId: number;
};

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Lên kế hoạch",
  ACTIVE: "Đang chạy",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_COLOR: Record<string, string> = {
  PLANNING: "var(--text-3)",
  ACTIVE: "var(--accent)",
  COMPLETED: "var(--ok)",
  CANCELLED: "var(--danger)",
};

const PRIO_DOT: Record<string, string> = {
  CRITICAL: "var(--danger)",
  HIGH: "#f97316",
  NORMAL: "var(--accent)",
  LOW: "var(--text-3)",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  IN_PROGRESS: "Đang làm",
  BLOCKED: "Bị chặn",
  REVIEW: "Review",
  DONE: "Xong",
  CANCELLED: "Đã hủy",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function SprintsClient({ sprints: initial, tasks: initialTasks, isManager }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>(initial);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(initial.filter((s) => s.status === "ACTIVE").map((s) => s.id)));
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null);

  const backlog = tasks.filter((t) => !t.sprintId);

  async function createSprint() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), goal: newGoal.trim() || null, startDate: newStart || null, endDate: newEnd || null }),
    });
    if (res.ok) {
      const j = await res.json();
      setSprints((p) => [...p, j.data]);
      setNewName(""); setNewGoal(""); setNewStart(""); setNewEnd("");
      setShowCreate(false);
    }
    setCreating(false);
  }

  async function updateSprintStatus(sprintId: number, status: string) {
    const res = await fetch(`/api/sprints/${sprintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const j = await res.json();
      setSprints((p) => p.map((s) => s.id === sprintId ? { ...s, status: j.data.status } : s));
    }
  }

  async function moveTaskToSprint(taskId: number, sprintId: number | null) {
    setMovingTaskId(taskId);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId }),
    });
    if (res.ok) {
      setTasks((p) => p.map((t) => t.id === taskId ? { ...t, sprintId } : t));
    }
    setMovingTaskId(null);
  }

  async function deleteSprint(sprintId: number) {
    if (!confirm("Xóa sprint này? Các task trong sprint sẽ được chuyển về Backlog.")) return;
    const res = await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((p) => p.map((t) => t.sprintId === sprintId ? { ...t, sprintId: null } : t));
      setSprints((p) => p.filter((s) => s.id !== sprintId));
    }
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Sprint</h1>
          <p style={{ fontSize: "0.84rem", color: "var(--text-3)", marginTop: 2 }}>
            Quản lý sprint và phân công task theo từng iteration
          </p>
        </div>
        {isManager && (
          <button className="abtn primary" onClick={() => setShowCreate(true)}>
            + Tạo Sprint
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 14, color: "var(--text)" }}>Sprint mới</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Tên sprint *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Sprint 1 — Tháng 6"
                style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 7, padding: "7px 12px", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Mục tiêu</label>
              <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Mục tiêu của sprint này…"
                style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 7, padding: "7px 12px", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Ngày bắt đầu</label>
              <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 7, padding: "7px 12px", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", color: "var(--text-3)", display: "block", marginBottom: 4 }}>Ngày kết thúc</label>
              <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                style={{ width: "100%", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 7, padding: "7px 12px", fontFamily: "inherit", fontSize: "0.9rem", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="abtn primary" onClick={createSprint} disabled={creating || !newName.trim()}>
              {creating ? "Đang tạo…" : "Tạo Sprint"}
            </button>
            <button className="abtn ghost" onClick={() => setShowCreate(false)}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Sprint list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sprints.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: "0.9rem" }}>
              Chưa có sprint nào. {isManager && <button style={{ background: "none", border: "none", color: "var(--accent-ink)", cursor: "pointer", fontSize: "inherit" }} onClick={() => setShowCreate(true)}>Tạo sprint đầu tiên →</button>}
            </div>
          )}

          {sprints.map((sprint) => {
            const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
            const done = sprintTasks.filter((t) => t.status === "DONE").length;
            const pct = sprintTasks.length ? Math.round((done / sprintTasks.length) * 100) : 0;
            const isOpen = expanded.has(sprint.id);

            return (
              <div key={sprint.id} style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                {/* Sprint header */}
                <div style={{ padding: "14px 18px", borderBottom: isOpen ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => toggleExpand(sprint.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex", transition: "transform 0.2s", transform: isOpen ? "" : "rotate(-90deg)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text)" }}>{sprint.name}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "var(--elev)", color: STATUS_COLOR[sprint.status], border: `1px solid ${STATUS_COLOR[sprint.status]}40` }}>
                        {STATUS_LABEL[sprint.status]}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{sprintTasks.length} task</span>
                      {(sprint.startDate || sprint.endDate) && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                          {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
                        </span>
                      )}
                    </div>
                    {sprint.goal && (
                      <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "var(--text-3)" }}>{sprint.goal}</p>
                    )}
                  </div>

                  {/* Progress */}
                  {sprintTasks.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ width: 80, height: 5, background: "var(--border)", borderRadius: 99 }}>
                        <div style={{ height: "100%", background: "var(--ok)", borderRadius: 99, width: `${pct}%`, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{done}/{sprintTasks.length}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {isManager && (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {sprint.status === "PLANNING" && (
                        <button className="abtn ghost" style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--accent)" }}
                          onClick={() => updateSprintStatus(sprint.id, "ACTIVE")}>
                          ▶ Bắt đầu
                        </button>
                      )}
                      {sprint.status === "ACTIVE" && (
                        <button className="abtn ghost" style={{ padding: "4px 10px", fontSize: "0.75rem", color: "var(--ok)" }}
                          onClick={() => updateSprintStatus(sprint.id, "COMPLETED")}>
                          ✓ Hoàn thành
                        </button>
                      )}
                      <button className="abtn ghost" style={{ padding: "4px 8px", fontSize: "0.75rem", color: "var(--danger)" }}
                        onClick={() => deleteSprint(sprint.id)}>🗑</button>
                    </div>
                  )}
                </div>

                {/* Task list */}
                {isOpen && (
                  <div>
                    {sprintTasks.length === 0 ? (
                      <p style={{ padding: "16px 18px", color: "var(--text-3)", fontSize: "0.84rem", margin: 0 }}>
                        Chưa có task. Kéo task từ Backlog vào sprint này.
                      </p>
                    ) : (
                      sprintTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          sprints={sprints}
                          onMove={moveTaskToSprint}
                          moving={movingTaskId === task.id}
                          isManager={isManager}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Backlog panel */}
        <div style={{ background: "var(--content)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", position: "sticky", top: 80 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>Backlog</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{backlog.length} task</span>
          </div>
          <div style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
            {backlog.length === 0 ? (
              <p style={{ padding: "20px 18px", color: "var(--text-3)", fontSize: "0.84rem", margin: 0 }}>
                Tất cả task đã được gán sprint.
              </p>
            ) : (
              backlog.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  sprints={sprints}
                  onMove={moveTaskToSprint}
                  moving={movingTaskId === task.id}
                  isManager={isManager}
                  compact
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task, sprints, onMove, moving, isManager, compact,
}: {
  task: TaskItem;
  sprints: Sprint[];
  onMove: (taskId: number, sprintId: number | null) => void;
  moving: boolean;
  isManager: boolean;
  compact?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: compact ? "8px 14px" : "10px 18px",
      borderBottom: "1px solid var(--border)", opacity: moving ? 0.5 : 1,
      background: moving ? "var(--elev)" : undefined,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIO_DOT[task.priority] ?? "var(--text-3)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.84rem", color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {task.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>{task.code}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{TASK_STATUS_LABEL[task.status] ?? task.status}</span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>{task.assignedTo.fullName.split(" ").pop()}</span>
        </div>
      </div>

      {isManager && (
        <select
          value={task.sprintId ?? ""}
          disabled={moving}
          onChange={(e) => onMove(task.id, e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: "0.75rem", background: "var(--elev)", border: "1px solid var(--border-2)", borderRadius: 6, padding: "3px 6px", color: "var(--text)", outline: "none", cursor: "pointer", maxWidth: 120 }}
        >
          <option value="">Backlog</option>
          {sprints.filter((s) => s.status !== "CANCELLED" && s.status !== "COMPLETED").map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
