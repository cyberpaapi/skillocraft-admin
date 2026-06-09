"use client";
import { useQuery } from "@tanstack/react-query";
import { getAdmins } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Shield, Loader2 } from "lucide-react";

interface Admin { id: string; name: string; email?: string; createdAt: string; user?: { email: string }; }

export default function AdminsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => { const { data } = await getAdmins(); return (data?.data?.admins || data?.admins || []) as Admin[]; },
  });
  const items = data || [];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        : items.length === 0 ? <div className="text-center py-16 text-slate-400"><Shield size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No admins found</p></div>
        : <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Email</th><th className="px-6 py-3 font-medium">Joined</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium text-sm">{a.name?.charAt(0).toUpperCase()}</div><span className="font-medium text-slate-800">{a.name}</span></div></td>
                <td className="px-6 py-3 text-slate-500">{a.user?.email || a.email || "—"}</td>
                <td className="px-6 py-3 text-slate-500">{formatDate(a.createdAt)}</td>
              </tr>))}</tbody>
          </table>}
    </div>
  );
}
