"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMarketplaceOrders, updateMarketplaceOrderStatus } from "@/lib/api";
import { formatDate, imgSrc } from "@/lib/utils";
import { ShoppingBag, Loader2, Search, MapPin, Package } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

interface MarketplaceOrder {
  id: string;
  quantity: number;
  totalAmount: string;
  status: OrderStatus;
  recipientName?: string;
  phone?: string;
  addressLine: string;
  city?: string;
  state?: string;
  pinCode: string;
  country?: string;
  createdAt: string;
  customer?: { id: string; name: string; user?: { email: string } };
  product?: { id: string; name: string; images?: string[]; price: string };
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const ALL_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function MarketplaceOrdersPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-orders", filterStatus],
    queryFn: async () => {
      const { data } = await getMarketplaceOrders(1, filterStatus || undefined);
      return (data?.data?.orders || []) as MarketplaceOrder[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateMarketplaceOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-orders"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const orders = (data || []).filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      o.customer?.name?.toLowerCase().includes(q) ||
      o.product?.name?.toLowerCase().includes(q) ||
      o.recipientName?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, product..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No marketplace orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Delivery Address</th>
                  <th className="px-4 py-3 font-medium">Qty / Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 align-top">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[220px]">
                        {order.product?.images?.[0] ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image
                              src={imgSrc(order.product.images[0])}
                              alt={order.product.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Package size={16} className="text-slate-400" />
                          </div>
                        )}
                        <p className="font-medium text-slate-800 text-xs leading-tight line-clamp-2">
                          {order.product?.name || "—"}
                        </p>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{order.customer?.name || "—"}</p>
                      <p className="text-xs text-slate-400">{order.customer?.user?.email || ""}</p>
                      {order.recipientName && order.recipientName !== order.customer?.name && (
                        <p className="text-xs text-slate-500 mt-0.5">Ships to: {order.recipientName}</p>
                      )}
                      {order.phone && (
                        <p className="text-xs text-slate-400">{order.phone}</p>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1 text-xs text-slate-600 max-w-[180px]">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0 text-slate-400" />
                        <span>
                          {order.addressLine}
                          {order.city && `, ${order.city}`}
                          {order.state && `, ${order.state}`}
                          {` - ${order.pinCode}`}
                          {order.country && `, ${order.country}`}
                        </span>
                      </div>
                    </td>

                    {/* Qty / Amount */}
                    <td className="px-4 py-3">
                      <p className="text-slate-700">×{order.quantity}</p>
                      <p className="font-semibold text-slate-900">₹{parseFloat(order.totalAmount).toLocaleString()}</p>
                    </td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[order.status]}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
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
