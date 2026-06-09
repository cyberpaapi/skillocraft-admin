"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, MessageSquare, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface Testimonial { id: string; name: string; review: string; rating?: number; status: string; createdAt: string; }

export default function TestimonialsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => { const { data } = await api.get("/testimonials"); return (data?.data?.testimonials || data?.data || []) as Testimonial[]; },
  });
  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/testimonials/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["testimonials"] }); },
    onError: () => toast.error("Failed to delete"),
  });
  const items = data || [];
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add Testimonial</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          : items.length === 0 ? <div className="text-center py-16 text-slate-400"><MessageSquare size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No testimonials yet</p></div>
          : <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100"><th className="px-6 py-3 font-medium">Name</th><th className="px-6 py-3 font-medium">Review</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Date</th><th className="px-6 py-3 font-medium text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{items.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{t.name}</td>
                  <td className="px-6 py-3 text-slate-500 max-w-xs truncate">{t.review}</td>
                  <td className="px-6 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${t.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{t.status}</span></td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="px-6 py-3 text-right"><button onClick={() => { if (confirm("Delete?")) remove(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button></td>
                </tr>))}</tbody>
            </table>}
      </div>
    </div>
  );
}
