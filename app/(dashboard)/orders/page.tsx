"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingCart, Loader2, Search } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  transactionId: string;
  totalAmount: string;
  paidAmount: string;
  paymentType: string;
  status: string;
  createdAt: string;
  customer?: { name: string; user?: { email: string } };
  course?: { name: string }[];
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await getOrders();
      return (data?.data?.orders || data?.orders || []) as Order[];
    },
  });

  const orders = (data || []).filter((o) =>
    o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or transaction..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Transaction</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Courses</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">
                    {order.transactionId?.slice(0, 18) || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-medium text-slate-800">{order.customer?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{order.customer?.user?.email}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{order.course?.length || 0} course(s)</td>
                  <td className="px-6 py-3 font-semibold">{formatCurrency(parseFloat(order.paidAmount || '0'))}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {order.paymentType}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
