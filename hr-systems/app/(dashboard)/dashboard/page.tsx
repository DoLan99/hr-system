import { requireAuth } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getTaskStatusLabel(status: string) {
  if (status === "DONE") return { label: "Done", cls: "done" };
  if (status === "IN_PROGRESS") return { label: "▶ Đang làm", cls: "doing" };
  return { label: "Cần làm", cls: "todo" };
}

function getTaskDotColor(status: string) {
  if (status === "DONE") return "var(--ok)";
  if (status === "IN_PROGRESS") return "var(--danger)";
  return "var(--warn)";
}

export default async function DashboardPage() {
  const { employee, organization, role } = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [memberCount, completedTasksThisMonth, pendingApprovals, todayTasks, recentAuditLogs] =
    await Promise.all([
      prisma.employee.count({
        where: { organizationId: organization.id, status: "ACTIVE" },
      }),
      prisma.task.count({
        where: {
          organizationId: organization.id,
          status: "DONE",
          dateCompleted: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.leave.findMany({
        where: { organizationId: organization.id, status: "PENDING" },
        include: { employee: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.task.findMany({
        where: {
          organizationId: organization.id,
          assignedToId: employee.id,
          OR: [
            { dueDate: { gte: startOfToday, lte: endOfToday } },
            { dateStarted: { gte: startOfToday, lte: endOfToday } },
            { status: "IN_PROGRESS" },
          ],
        },
        orderBy: [{ status: "asc" }, { priority: "desc" }],
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: { organizationId: organization.id },
        include: { changedBy: { select: { fullName: true } } },
        orderBy: { changedAt: "desc" },
        take: 3,
      }),
    ]);

  return (
    <div className="content-inner">
      {/* Page head */}
      <div className="page-head">
        <h1>Xin chào, {employee.fullName} 👋</h1>
        <p>
          Workspace <b>{organization.name}</b> ·{" "}
          <span className="chip-role">{role.label}</span> · Tổng quan hoạt động
          team hôm nay, <b>{formatDate(now)}</b>
        </p>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="8" r="3" />
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
                <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" />
              </svg>
            </span>
            Nhân sự
          </div>
          <div className="kv">{memberCount}</div>
          <div className="kc up">▲ Nhân viên đang hoạt động</div>
        </div>

        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            Tasks hoàn thành
          </div>
          <div className="kv">{completedTasksThisMonth}</div>
          <div className="kc up">▲ Tháng này</div>
        </div>

        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Giờ làm tuần này
          </div>
          <div className="kv">
            1.842<span style={{ fontSize: "1rem", color: "var(--text-3)" }}>h</span>
          </div>
          <div className="kc up">▲ 4%</div>
        </div>

        <div className="kpi">
          <div className="kt">
            <span className="ki">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.6 6.3L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.7z" />
              </svg>
            </span>
            Tỷ lệ đúng hạn
          </div>
          <div className="kv">
            94<span style={{ fontSize: "1rem", color: "var(--text-3)" }}>%</span>
          </div>
          <div className="kc up">▲ 6%</div>
        </div>
      </div>

      {/* Main grid: productivity chart + pending approvals */}
      <div className="jh-grid cols-2-1">
        {/* Productivity chart */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>Năng suất team</h3>
            </div>
            <span className="sub">tasks / tuần · 8 tuần gần nhất</span>
          </div>
          <div className="jh-chart">
            <div className="jh-col">
              <div className="bar" style={{ height: "42%" }}></div>
              <span className="xl">T1</span>
            </div>
            <div className="jh-col">
              <div className="bar" style={{ height: "58%" }}></div>
              <span className="xl">T2</span>
            </div>
            <div className="jh-col">
              <div className="bar" style={{ height: "50%" }}></div>
              <span className="xl">T3</span>
            </div>
            <div className="jh-col">
              <div className="bar" style={{ height: "72%" }}></div>
              <span className="xl">T4</span>
            </div>
            <div className="jh-col">
              <div className="bar hi" style={{ height: "88%" }}></div>
              <span className="xl">T5</span>
            </div>
            <div className="jh-col">
              <div className="bar" style={{ height: "64%" }}></div>
              <span className="xl">T6</span>
            </div>
            <div className="jh-col">
              <div className="bar" style={{ height: "80%" }}></div>
              <span className="xl">T7</span>
            </div>
            <div className="jh-col">
              <div className="bar hi" style={{ height: "96%" }}></div>
              <span className="xl">T8</span>
            </div>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>Chờ phê duyệt</h3>
            </div>
            <Link href="/approvals">Hộp duyệt</Link>
          </div>
          <div className="rows">
            {pendingApprovals.length === 0 ? (
              <div className="jh-row">
                <div className="rmain">
                  <div className="rt">Không có yêu cầu chờ duyệt</div>
                </div>
              </div>
            ) : (
              pendingApprovals.map((leave, idx) => (
                <div className="jh-row" key={leave.id}>
                  <span className="av-sm">{getInitials(leave.employee.fullName)}</span>
                  <div className="rmain">
                    <div className="rt">Đơn nghỉ phép — {leave.employee.fullName}</div>
                    <div className="rs">
                      {leave.type} · {Number(leave.requestedHours)}h · {formatDate(leave.date)}
                    </div>
                  </div>
                  <button className={idx < 2 ? "mini-btn" : "mini-btn ghost"}>
                    {idx < 2 ? "Duyệt" : "Xem"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Second grid: today tasks + capacity/activity feed */}
      <div className="jh-grid cols-2" style={{ marginTop: 16 }}>
        {/* Today tasks */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>Công việc hôm nay</h3>
            </div>
            <span className="sub">{todayTasks.length} task</span>
          </div>
          <div className="rows">
            {todayTasks.length === 0 ? (
              <div className="jh-row">
                <div className="rmain">
                  <div className="rt">Không có task hôm nay</div>
                </div>
              </div>
            ) : (
              todayTasks.map((task) => {
                const s = getTaskStatusLabel(task.status);
                return (
                  <div className="jh-row" key={task.id}>
                    <span
                      className="dot-i"
                      style={{
                        background: getTaskDotColor(task.status),
                        boxShadow:
                          task.status === "IN_PROGRESS"
                            ? "0 0 8px rgba(255,107,107,0.6)"
                            : undefined,
                      }}
                    ></span>
                    <div className="rmain">
                      <div className="rt">{task.title}</div>
                      <div className="rs">
                        {task.priority} · {task.estimatedTime ? `est ${task.estimatedTime / 60}h` : ""}
                      </div>
                    </div>
                    <span className={`status ${s.cls}`}>{s.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Capacity + activity feed */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <h3>Năng lực theo nhóm</h3>
            </div>
            <Link href="/employees">Capacity</Link>
          </div>
          <div className="cap">
            <div className="cap-item">
              <div className="cap-h">
                <b>Frontend</b>
                <span style={{ color: "var(--warn)" }}>92% · quá tải</span>
              </div>
              <div className="cap-track">
                <i className="over" style={{ width: "92%" }}></i>
              </div>
            </div>
            <div className="cap-item">
              <div className="cap-h">
                <b>Backend</b>
                <span style={{ color: "var(--accent-ink)" }}>68%</span>
              </div>
              <div className="cap-track">
                <i style={{ width: "68%" }}></i>
              </div>
            </div>
            <div className="cap-item">
              <div className="cap-h">
                <b>Design</b>
                <span style={{ color: "var(--accent-ink)" }}>54%</span>
              </div>
              <div className="cap-track">
                <i style={{ width: "54%" }}></i>
              </div>
            </div>
            <div className="cap-item">
              <div className="cap-h">
                <b>QA</b>
                <span style={{ color: "var(--accent-ink)" }}>71%</span>
              </div>
              <div className="cap-track">
                <i style={{ width: "71%" }}></i>
              </div>
            </div>
          </div>

          <div className="panel-h" style={{ margin: "22px 0 14px" }}>
            <div>
              <h3 style={{ fontSize: "0.9rem" }}>Hoạt động gần đây</h3>
            </div>
          </div>
          <div className="feed">
            {recentAuditLogs.length === 0 ? (
              <div className="feed-item">
                <div>
                  <div className="ft">Chưa có hoạt động nào</div>
                </div>
              </div>
            ) : (
              recentAuditLogs.map((log, idx) => {
                const icClass = idx === 0 ? "ic-ok" : idx === 1 ? "ic-blue" : "ic-warn";
                const icon =
                  idx === 0 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 6" />
                    </svg>
                  ) : idx === 1 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.3 3.9l-7 12A2 2 0 0 0 5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  );
                return (
                  <div className="feed-item" key={log.id}>
                    <span className={`fi ${icClass}`}>{icon}</span>
                    <div>
                      <div className="ft">
                        {log.changedBy ? <b>{log.changedBy.fullName}</b> : <b>Hệ thống</b>}{" "}
                        {log.action} — {log.tableName}
                      </div>
                      <div className="fm">
                        {log.changedAt.getHours().toString().padStart(2, "0")}:
                        {log.changedAt.getMinutes().toString().padStart(2, "0")} ·{" "}
                        {log.tableName}.{log.action.toLowerCase()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section-title">Truy cập nhanh</div>
      <div className="qa">
        <Link className="qa-card" href="/employees/new">
          <span className="qi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
              <path d="M16 4a3 3 0 0 1 0 6M21 20a5 5 0 0 0-4-5" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <div className="qn">Thêm nhân sự</div>
            <div className="qd">Tạo hồ sơ mới</div>
          </div>
        </Link>
        <Link className="qa-card" href="/tasks/new">
          <span className="qi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </span>
          <div>
            <div className="qn">Giao task</div>
            <div className="qd">Tạo công việc</div>
          </div>
        </Link>
        <Link className="qa-card" href="/salary">
          <span className="qi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <div>
            <div className="qn">Chạy bảng lương</div>
            <div className="qd">
              Kỳ tháng {(now.getMonth() + 1).toString()}
            </div>
          </div>
        </Link>
        <Link className="qa-card" href="/admin/audit">
          <span className="qi">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 3 3 5-6" />
            </svg>
          </span>
          <div>
            <div className="qn">Xem báo cáo</div>
            <div className="qd">Summary &amp; KPI</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
