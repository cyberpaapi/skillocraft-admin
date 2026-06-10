"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReferralSettings, updateReferralSettings, getPayoutRequests, updatePayoutRequest } from "@/lib/api";
import { Loader2, Save, Users, TrendingUp, Gift, Wallet, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatDate } from "@/lib/utils";

interface Settings {
  discountPercent: number;
  earningsPercent: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  upiId: string;
  status: string;
  note: string | null;
  createdAt: string;
  customer: { id: string; name: string; user: { email: string } };
}

export default function ReferralSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"settings" | "payouts">("settings");
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<Settings>({
    defaultValues: { discountPercent: 20, earningsPercent: 20 },
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["referral-settings"],
    queryFn: async () => {
      const { data } = await getReferralSettings();
      return data as Settings;
    },
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ["payout-requests"],
    queryFn: async () => {
      const { data } = await getPayoutRequests();
      return (data?.requests || []) as PayoutRequest[];
    },
  });

  useEffect(() => {
    if (settingsData) reset(settingsData);
  }, [settingsData, reset]);

  const { mutate: saveSettings, isPending: savingSettings } = useMutation({
    mutationFn: (values: Settings) => updateReferralSettings(values),
    onSuccess: () => {
      toast.success("Referral settings updated");
      queryClient.invalidateQueries({ queryKey: ["referral-settings"] });
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const { mutate: updatePayout } = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      updatePayoutRequest(id, { status, note }),
    onSuccess: () => {
      toast.success("Payout request updated");
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      setSettlingId(null);
    },
    onError: () => { toast.error("Failed to update payout request"); setSettlingId(null); },
  });

  const discountVal = watch("discountPercent");
  const earningsVal = watch("earningsPercent");

  const pending = payoutsData?.filter(p => p.status === "PENDING") ?? [];
  const settled = payoutsData?.filter(p => p.status === "SETTLED") ?? [];
  const rejected = payoutsData?.filter(p => p.status === "REJECTED") ?? [];

  const statusBadge = (status: string) => {
    if (status === "SETTLED") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle size={10} /> Settled</span>;
    if (status === "REJECTED") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={10} /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock size={10} /> Pending</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Referral Program</h1>
        <p className="text-sm text-slate-500 mt-1">Manage referral settings and payout requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "settings" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "payouts" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Payout Requests
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pending.length}</span>
          )}
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        settingsLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <form onSubmit={handleSubmit((v) => saveSettings(v))} className="space-y-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Friend's Discount (%)</label>
                    <p className="text-xs text-slate-400 mb-2">How much discount the referred user gets on their first purchase.</p>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={80} step={1} {...register("discountPercent", { valueAsNumber: true, required: true, min: 1, max: 80 })} className="flex-1 accent-indigo-600" />
                      <div className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50">{discountVal}%</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Referrer's Earnings (%)</label>
                    <p className="text-xs text-slate-400 mb-2">How much the person who shared the code earns from each referred purchase.</p>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={80} step={1} {...register("earningsPercent", { valueAsNumber: true, required: true, min: 1, max: 80 })} className="flex-1 accent-indigo-600" />
                      <div className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50">{earningsVal}%</div>
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={savingSettings} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-60">
                  {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Settings
                </button>
              </form>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Live Preview</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                    <Users size={18} className="text-indigo-600 flex-shrink-0" />
                    <div><p className="text-xs text-slate-500">Friend signs up</p><p className="text-sm font-semibold text-slate-800">Gets {discountVal}% off</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <TrendingUp size={18} className="text-emerald-600 flex-shrink-0" />
                    <div><p className="text-xs text-slate-500">Referrer earns</p><p className="text-sm font-semibold text-slate-800">{earningsVal}% per purchase</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                    <Gift size={18} className="text-amber-600 flex-shrink-0" />
                    <div><p className="text-xs text-slate-500">Example: ₹1000 order</p><p className="text-sm font-semibold text-slate-800">Friend pays ₹{Math.round(1000 * (1 - discountVal / 100))}, you earn ₹{Math.round(1000 * (earningsVal / 100))}</p></div>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                <p className="font-medium">Defaults</p>
                <p>If no settings are saved, the platform uses <strong>20% discount</strong> and <strong>20% earnings</strong> as defaults.</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Payout Requests Tab */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          {payoutsLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          ) : (payoutsData?.length ?? 0) === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              <Wallet size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No payout requests yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">UPI ID</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutsData!.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-800">{req.customer.name}</p>
                        <p className="text-xs text-slate-400">{req.customer.user.email}</p>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-600">{req.upiId}</td>
                      <td className="px-6 py-3 font-semibold text-slate-800">₹{req.amount.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-3">{statusBadge(req.status)}</td>
                      <td className="px-6 py-3 text-slate-500 text-xs">{formatDate(req.createdAt)}</td>
                      <td className="px-6 py-3">
                        {req.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSettlingId(req.id); updatePayout({ id: req.id, status: "SETTLED" }); }}
                              disabled={settlingId === req.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-60"
                            >
                              {settlingId === req.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                              Mark Settled
                            </button>
                            <button
                              onClick={() => updatePayout({ id: req.id, status: "REJECTED" })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                            >
                              <XCircle size={10} /> Reject
                            </button>
                          </div>
                        )}
                        {req.status !== "PENDING" && <span className="text-xs text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
