"use client";

import { useQuery } from "@tanstack/react-query";
import { getMonthlyRevenue, getOrders } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Loader2, IndianRupee, BookOpen, CalendarDays, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import SuperAdminGate from "@/components/SuperAdminGate";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Order {
  id: string;
  paidAmount?: string;
  createdAt: string;
  course?: { name: string; price: string; category?: { name: string } };
  customer?: { name: string; user?: { email: string } };
}

export default function RevenuePage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["monthly-revenue", year],
    queryFn: async () => {
      const { data } = await getMonthlyRevenue(year);
      return (data?.data || []) as { month: number; revenue: number; courseRevenue: number; eventRevenue: number; marketplaceRevenue: number }[];
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await getOrders(1);
      return (data?.data?.orders || []) as Order[];
    },
  });

  const chartData = MONTHS.map((month, i) => ({
    month,
    Courses: revenueData?.[i]?.courseRevenue || 0,
    Events: revenueData?.[i]?.eventRevenue || 0,
    Marketplace: revenueData?.[i]?.marketplaceRevenue || 0,
  }));

  const totalCourse = revenueData?.reduce((s, r) => s + (r.courseRevenue || 0), 0) || 0;
  const totalEvent = revenueData?.reduce((s, r) => s + (r.eventRevenue || 0), 0) || 0;
  const totalMarketplace = revenueData?.reduce((s, r) => s + (r.marketplaceRevenue || 0), 0) || 0;
  const totalRevenue = totalCourse + totalEvent + totalMarketplace;

  const orders = ordersData || [];

  return (
    <SuperAdminGate>
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: `Total Revenue ${year}`, value: totalRevenue, icon: IndianRupee, color: "emerald" },
            { label: "Course Revenue", value: totalCourse, icon: BookOpen, color: "indigo" },
            { label: "Event Revenue", value: totalEvent, icon: CalendarDays, color: "violet" },
            { label: "Marketplace Revenue", value: totalMarketplace, icon: ShoppingBag, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center`}>
                <Icon size={20} className={`text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(value)}</p>
              </div>
            </div>
          ))}
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stacked bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-6">Monthly Revenue by Source</h2>
        {revLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Legend />
              <Bar dataKey="Courses" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Events" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Marketplace" stackId="a" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Monthly Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-3 font-medium">Month</th>
              <th className="px-6 py-3 font-medium text-right">Courses</th>
              <th className="px-6 py-3 font-medium text-right">Events</th>
              <th className="px-6 py-3 font-medium text-right">Marketplace</th>
              <th className="px-6 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {chartData.map((row) => (
              <tr key={row.month} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-800">{row.month} {year}</td>
                <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.Courses)}</td>
                <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.Events)}</td>
                <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(row.Marketplace)}</td>
                <td className="px-6 py-3 text-right font-semibold text-slate-800">{formatCurrency(row.Courses + row.Events + row.Marketplace)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All orders table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">All Orders</h2>
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-3 font-medium text-slate-800 max-w-xs truncate">
                      {order.course?.name || "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {order.course?.category?.name || "Course"}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {order.customer?.name || order.customer?.user?.email || "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-800">
                      {formatCurrency(parseFloat(order.paidAmount || "0"))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </SuperAdminGate>
  );
}
