"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Filter } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Chưa xử lý",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Đã xử lý",
  BLOCKED: "Bị chặn",
  CANCELLED: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "#f87171",
  IN_PROGRESS: "#3b82f6",
  COMPLETED: "#22c55e",
  BLOCKED: "#f59e0b",
  CANCELLED: "#94a3b8",
};

const STATUS_ORDER = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"];

const PRIORITY_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "NOT_STARTED", label: "Chưa xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Đã xử lý" },
  { value: "BLOCKED", label: "Bị chặn" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `Tháng ${i + 1}`,
}));

type DailySeries = { date: string; created: number; completed: number };
type StatusDist = { status: string; count: number };
type Team = { id: number; name: string };

interface DashboardData {
  unstartedCount: number;
  unassignedCount: number;
  statusDistribution: StatusDist[];
  dailySeries: DailySeries[];
  isManager: boolean;
  categories: string[];
}

interface Props {
  userName: string;
  isManager: boolean;
  teams: Team[];
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[12px] text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 pr-8 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export default function DashboardClient({ userName, isManager, teams }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [teamId, setTeamId] = useState("");
  const [category, setCategory] = useState("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [activeTeam, setActiveTeam] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
        ...(teamId ? { teamId } : activeTeam ? { teamId: String(activeTeam) } : {}),
        ...(category ? { category } : {}),
      });
      const res = await fetch(`/api/dashboard?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [month, year, priority, status, teamId, activeTeam, category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalTasks = data?.statusDistribution.reduce((s, d) => s + d.count, 0) ?? 0;

  const sortedStatus = STATUS_ORDER.map((st) => ({
    status: st,
    count: data?.statusDistribution.find((d) => d.status === st)?.count ?? 0,
  })).filter((d) => d.count > 0);

  const categoryOptions = [
    { value: "", label: "Tất cả" },
    ...(data?.categories ?? []).map((c) => ({ value: c, label: c })),
  ];

  const teamOptions = [
    { value: "", label: "Tất cả" },
    ...teams.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  function handleTeamBtn(id: number) {
    if (activeTeam === id) {
      setActiveTeam(null);
      setTeamId("");
    } else {
      setActiveTeam(id);
      setTeamId(String(id));
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
          {isManager ? "Dashboard" : `Xin chào, ${userName}`}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE, dd/MM/yyyy")}
        </p>
      </div>

      {/* Top stat + Sub-team */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-0">
          {/* Unassigned count */}
          <div className="pr-8 mr-8 border-r border-slate-200">
            <p className="text-[12px] text-slate-500 mb-1">Task chưa được assign</p>
            <div className="flex items-center gap-2">
              <span className="text-[36px] font-bold text-slate-900 leading-none">
                {loading ? "—" : (data?.unassignedCount ?? 0)}
              </span>
              <button
                onClick={fetchData}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Unstarted count */}
          <div className="pr-8 mr-8 border-r border-slate-200">
            <p className="text-[12px] text-slate-500 mb-1">Task chưa bắt đầu</p>
            <div className="flex items-center gap-2">
              <span className="text-[36px] font-bold text-slate-900 leading-none">
                {loading ? "—" : (data?.unstartedCount ?? 0)}
              </span>
            </div>
          </div>

          {/* Sub-team buttons */}
          {teams.length > 0 && (
            <div className="flex-1">
              <p className="text-[12px] text-slate-500 mb-2">Sub-team</p>
              <div className="flex flex-wrap gap-2">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTeamBtn(t.id)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-medium border transition-colors ${
                      activeTeam === t.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workload overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Section header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">
            Khối lượng công việc tổng quan
          </h2>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[13px] text-blue-600 hover:text-blue-700 mt-2 font-medium"
          >
            <Filter className="w-3.5 h-3.5" />
            Bộ lọc Khối lượng công việc
            {filterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-4">
              <Select
                label="Thời gian tạo"
                value={String(month)}
                onChange={(v) => setMonth(Number(v))}
                options={MONTH_OPTIONS.map((m) => ({
                  value: String(m.value),
                  label: `${m.label} ${year}`,
                }))}
              />
              <Select
                label="Trạng thái"
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Ưu tiên"
                value={priority}
                onChange={setPriority}
                options={PRIORITY_OPTIONS}
              />
              <Select
                label="Team"
                value={teamId}
                onChange={(v) => {
                  setTeamId(v);
                  setActiveTeam(v ? Number(v) : null);
                }}
                options={teamOptions}
              />
              <Select
                label="Loại công việc"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
            </div>
          </div>
        )}

        {/* Line chart */}
        <div className="px-5 py-5">
          <p className="text-[13px] font-semibold text-slate-700 mb-4">
            Tổng Task phát sinh và Đã xử lý
          </p>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={data?.dailySeries ?? []}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={Math.floor((data?.dailySeries.length ?? 30) / 10)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number, name: string) => [value, name === "created" ? "Phát sinh" : "Đã xử lý"]}
                />
                <Legend
                  formatter={(value) => value === "created" ? "Tổng task phát sinh" : "Đã xử lý"}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Donut chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-[14px] font-semibold text-slate-800 mb-5">Phân bố trạng thái Task</p>
        {loading ? (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>
        ) : totalTasks === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Chưa có task nào</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <PieChart width={200} height={200}>
                <Pie
                  data={sortedStatus}
                  cx={100} cy={100}
                  innerRadius={60} outerRadius={95}
                  dataKey="count" nameKey="status"
                  paddingAngle={2}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {sortedStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#cbd5e1"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(value: number, _: any, props: any) => [
                    `${value} (${totalTasks > 0 ? ((value / totalTasks) * 100).toFixed(1) : 0}%)`,
                    STATUS_LABELS[props.payload.status] ?? props.payload.status,
                  ]}
                />
              </PieChart>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {sortedStatus.map((entry) => {
                const pct = totalTasks > 0 ? ((entry.count / totalTasks) * 100).toFixed(1) : "0.0";
                return (
                  <div key={entry.status} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 min-w-[220px]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[entry.status] ?? "#cbd5e1" }}
                      />
                      <span className="text-[13px] text-slate-700 font-medium">
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-slate-800">{entry.count}</span>
                      <span className="text-[12px] text-slate-500 w-[42px] text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
