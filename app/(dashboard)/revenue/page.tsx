"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonthlyRevenue } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Loader2, IndianRupee } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RevenuePage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["monthly-revenue", year],
    queryFn: async () => {
      const { data } = await getMonthlyRevenue(year);
      return data?.data || [];
    },
  });

  const chartData = MONTHS.map((month, i) => ({
    month,
    revenue: (data as any[])?.[i]?.revenue || 0,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Year selector + total */}
      <div className="flex items-center justify-between">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <IndianRupee size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Revenue {year}</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-6">Monthly Revenue</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Month</th>
              <th className="px-6 py-3 font-medium text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {chartData.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{row.month} {year}</td>
                <td className="px-6 py-3 text-right font-semibold text-slate-800">
                  {formatCurrency(row.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
