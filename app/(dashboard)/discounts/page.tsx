"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDiscounts, createDiscount, deleteDiscount } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Tag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface Discount {
  id: string;
  name: string;
  couponId: string;
  amount: string;
  amountType: "FIXED" | "PERCENT";
  discountStartDate: string;
  diacountEndDate: string;
  status: string;
}

interface FormValues {
  name: string;
  couponId: string;
  amount: string;
  amountType: "FIXED" | "PERCENT";
  discountStartDate: string;
  discountEndDate: string;
}

export default function DiscountsPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { amountType: "PERCENT" } });

  const { data, isLoading } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const { data } = await getDiscounts();
      return (data?.data || data?.discountCoupons || []) as Discount[];
    },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      createDiscount({
        name: values.name,
        couponId: values.couponId.toUpperCase(),
        amount: String(values.amount),
        amountType: values.amountType,
        discountStartDate: new Date(values.discountStartDate).toISOString(),
        discountEndDate: new Date(values.discountEndDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Coupon created");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setShowModal(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || "Failed to create coupon"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteDiscount(id),
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const discounts = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><Tag size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No coupons yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Discount</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Expires</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-700">{d.name}</td>
                  <td className="px-6 py-3 font-mono font-semibold text-indigo-600">{d.couponId}</td>
                  <td className="px-6 py-3 font-semibold">
                    {d.amountType === "PERCENT" ? `${d.amount}%` : `₹${d.amount}`}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.amountType === "PERCENT" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {d.amountType === "PERCENT" ? "Percentage" : "Fixed"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{d.diacountEndDate ? formatDate(d.diacountEndDate) : "No expiry"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { if (confirm("Delete this coupon?")) remove(d.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800 text-lg">Create Coupon</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Name</label>
                <input {...register("name", { required: true })} placeholder="e.g. Summer Sale"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                <input {...register("couponId", { required: true })} placeholder="e.g. SAVE20"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input {...register("amount", { required: true })} type="number" placeholder="20"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select {...register("amountType")}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input {...register("discountStartDate", { required: true })} type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input {...register("discountEndDate", { required: true })} type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60">
                  {isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
