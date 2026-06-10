"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getOrders } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, BookOpen, IndianRupee, TrendingUp, ShoppingCart, Loader2 } from "lucide-react";

interface DashboardStats {
  totalCustomers: number;
  totalCourses: number;
  totalEarnings: number;
  dailyEarnings: number;
}

interface Order {
  id: string;
  transactionId: string;
  paidAmount: string;
  paymentType: string;
  createdAt: string;
  customer?: { name: string; user?: { email: string } };
}

function StatCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium">{label}</p>
        <p className="text-slate-900 text-xl font-bold mt-0.5">{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await getDashboardStats();
      const d = data?.Data;
      return {
        totalCustomers: d?.total_customer ?? 0,
        totalCourses: d?.total_courses ?? 0,
        totalEarnings: d?.total_earnings ?? 0,
        dailyEarnings: d?.todays_earnings ?? 0,
      } as DashboardStats;
    },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data } = await getOrders(1);
      return (data?.data?.orders || data?.orders || []) as Order[];
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const stats = statsData || { totalCustomers: 0, totalCourses: 0, totalEarnings: 0, dailyEarnings: 0 };
  const orders = ordersData || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={<Users size={22} className="text-blue-600" />}
          color="bg-blue-50"
          sub="Registered users"
        />
        <StatCard
          label="Total Courses"
          value={stats.totalCourses.toLocaleString()}
          icon={<BookOpen size={22} className="text-purple-600" />}
          color="bg-purple-50"
          sub="Published courses"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalEarnings)}
          icon={<IndianRupee size={22} className="text-emerald-600" />}
          color="bg-emerald-50"
          sub="All time earnings"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats.dailyEarnings)}
          icon={<TrendingUp size={22} className="text-orange-600" />}
          color="bg-orange-50"
          sub="Earnings today"
        />
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-800">Recent Orders</h2>
          </div>
          <a href="/orders" className="text-indigo-600 text-sm hover:underline">View all</a>
        </div>

        {ordersLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Transaction ID</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">
                      {order.transactionId?.slice(0, 16) || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-800">{order.customer?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{order.customer?.user?.email || "—"}</p>
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-800">
                      {formatCurrency(parseFloat(order.paidAmount || "0"))}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {order.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
