"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trophy, Loader2 } from "lucide-react";

interface SuccessStory { id: string; name: string; designation?: string; earning?: number; status: string; createdAt: string; }

export default function SuccessPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => { const { data } = await api.get("/success"); return (data?.data || []) as SuccessStory[]; },
  });
  const items = data || [];
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add Story</button></div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          : items.length === 0 ? <div className="text-center py-16 text-slate-400"><Trophy size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No success stories yet</p></div>
          : <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Designation</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{items.map((s) => (<tr key={s.id} className="hover:bg-slate-50"><td className="px-6 py-3 font-medium text-slate-800">{s.name}</td><td className="px-6 py-3 text-slate-500">{s.designation || "—"}</td><td className="px-6 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span></td><td className="px-6 py-3 text-slate-500">{formatDate(s.createdAt)}</td></tr>))}</tbody>
            </table>}
      </div>
    </div>
  );
}
