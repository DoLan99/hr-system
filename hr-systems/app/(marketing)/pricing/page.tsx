import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Check, ArrowRight } from "lucide-react";
import { PLANS, formatVnd } from "@/lib/pricing";

export const metadata = { title: "Bảng giá — jobihome.vn" };

export default async function PricingPage() {
  const session = await auth();
  const isSignedIn = !!session.userId;

  return (
    <div className="px-4 sm:px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold">Bảng giá đơn giản</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Bắt đầu miễn phí 14 ngày. Không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border-2 p-6 flex flex-col ${
                plan.recommended ? "border-blue-500 relative" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  Phổ biến
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-4 text-3xl font-bold">
                {plan.priceVnd === 0 ? "0đ" : formatVnd(plan.priceVnd)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{plan.priceVnd === 0 ? "Mãi mãi" : "/tháng"}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{plan.seatLimit} thành viên</p>

              <ul className="mt-5 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={isSignedIn ? "/billing" : "/sign-up"}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  plan.recommended
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                }`}
              >
                {plan.priceVnd === 0 ? "Dùng miễn phí" : isSignedIn ? "Upgrade ngay" : "Bắt đầu trial"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-xl font-bold">So sánh chi tiết</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Tính năng</th>
                  {Object.values(PLANS).map((p) => (
                    <th key={p.id} className="text-center py-2 px-3 font-semibold">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <Row feature="Số thành viên" values={Object.values(PLANS).map(p => p.seatLimit.toString())} />
                <Row feature="Task Management" values={["✓", "✓", "✓"]} />
                <Row feature="Time Tracking" values={["✓", "✓", "✓"]} />
                <Row feature="Customers (CRM)" values={["✓", "✓", "✓"]} />
                <Row feature="Salary + Payroll" values={["—", "✓", "✓"]} />
                <Row feature="Office Time + Approval" values={["—", "✓", "✓"]} />
                <Row feature="Password Vault" values={["—", "—", "✓"]} />
                <Row feature="Anomaly Detection" values={["—", "—", "✓"]} />
                <Row feature="Activity Heatmap" values={["—", "—", "✓"]} />
                <Row feature="Audit Log retention" values={["30 ngày", "90 ngày", "Không giới hạn"]} />
                <Row feature="Priority support" values={["—", "—", "✓"]} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 text-center space-y-3">
          <h3 className="text-2xl font-bold">Cần gói custom cho team lớn hơn?</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Email <a href="mailto:support@jobihome.vn" className="text-blue-600 hover:underline">support@jobihome.vn</a> để được tư vấn enterprise.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ feature, values }: { feature: string; values: string[] }) {
  return (
    <tr>
      <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">{feature}</td>
      {values.map((v, i) => (
        <td key={i} className="text-center py-2 px-3 text-slate-700 dark:text-slate-300">{v}</td>
      ))}
    </tr>
  );
}
