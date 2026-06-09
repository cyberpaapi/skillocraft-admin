"use client";
import { useQuery } from "@tanstack/react-query";
import { getStaff } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Users, Loader2 } from "lucide-react";

interface Staff { id: string; name: string; createdAt: string; user?: { email: string }; StaffRole?: { name: string }; }

export default function StaffPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => { const { data } = await getStaff(); return (data?.data?.staff || data?.staff || []) as Staff[]; },
  });
  const items = data || [];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        : items.length === 0 ? <div className="text-center py-16 text-slate-400"><Users size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No staff members yet</p></div>
        : <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Email</th><th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium">Joined</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">{s.name?.charAt(0).toUpperCase()}</div><span className="font-medium text-slate-800">{s.name}</span></div></td>
                <td className="px-6 py-3 text-slate-500">{s.user?.email || "—"}</td>
                <td className="px-6 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{s.StaffRole?.name || "Staff"}</span></td>
                <td className="px-6 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
              </tr>))}</tbody>
          </table>}
    </div>
  );
}
