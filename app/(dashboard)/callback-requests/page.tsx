"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PhoneCall, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  courseId?: string | null;
  courseName?: string | null;
  message?: string | null;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["PENDING", "CONTACTED", "CLOSED"];

const statusStyle = (status: string) => {
  switch (status) {
    case "CONTACTED": return "bg-blue-100 text-blue-700";
    case "CLOSED": return "bg-emerald-100 text-emerald-700";
    default: return "bg-amber-100 text-amber-700";
  }
};

export default function CallbackRequestsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["callback-requests"],
    queryFn: async () => {
      const { data } = await api.get("/adminpanel/callback-requests");
      return (data?.data || []) as CallbackRequest[];
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/adminpanel/callback-requests/${id}`, { status }),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["callback-requests"] }); },
    onError: () => toast.error("Failed to update status"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/callback-requests/${id}`),
    onSuccess: () => { toast.success("Request deleted"); queryClient.invalidateQueries({ queryKey: ["callback-requests"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const requests = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><PhoneCall size={20} /> Callback Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Visitors who asked to be called back about a course.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><PhoneCall size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No callback requests yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Course</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{r.name}</td>
                  <td className="px-6 py-3 text-slate-600">
                    <a href={`tel:${r.phone}`} className="text-indigo-600 hover:underline">{r.phone}</a>
                  </td>
                  <td className="px-6 py-3 text-slate-500 max-w-xs truncate">{r.courseName || "—"}</td>
                  <td className="px-6 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus({ id: r.id, status: e.target.value })}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer ${statusStyle(r.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { if (confirm("Delete this request?")) remove(r.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
