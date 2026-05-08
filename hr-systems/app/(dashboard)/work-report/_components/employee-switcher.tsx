"use client";

import { useRouter } from "next/navigation";

interface Employee {
  id: number;
  fullName: string;
  department: string | null;
}

interface Props {
  employees: Employee[];
  currentId: number;
  dateStr: string;
}

export function EmployeeSwitcher({ employees, currentId, dateStr }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams({ date: dateStr, employeeId: e.target.value });
    router.push(`/work-report?${params}`);
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <span className="text-[12.5px] font-medium text-slate-600">Xem báo cáo của:</span>
      <select
        value={currentId}
        onChange={handleChange}
        className="form-select"
      >
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.fullName}{emp.department ? ` — ${emp.department}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
