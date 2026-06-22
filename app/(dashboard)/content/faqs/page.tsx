"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, HelpCircle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface FAQ { id: string; question: string; answer: string; status: string; location?: string; }
interface FormValues { question: string; answer: string; location: string; }

const LOCATIONS: { value: string; label: string }[] = [
  { value: "homepage", label: "Homepage" },
  { value: "live_online", label: "Live Online" },
  { value: "live_offline", label: "Live Offline" },
  { value: "marketplace", label: "Marketplace" },
  { value: "blogs", label: "Blogs" },
];
const locationLabel = (v?: string) => LOCATIONS.find((l) => l.value === v)?.label || "Homepage";

export default function FAQsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { location: "homepage" } });

  const { data, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await api.get("/general-faqs");
      return (data?.data || []) as FAQ[];
    },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (values: FormValues) => api.post("/adminpanel/general-faqs", values),
    onSuccess: () => {
      toast.success("FAQ added");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setShowModal(false);
      reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/general-faqs/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["faqs"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><HelpCircle size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No FAQs yet</p></div>
        ) : (
          items.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{faq.question}</p>
                  <p className="text-sm text-slate-500 mt-1">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{locationLabel(faq.location)}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${faq.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{faq.status}</span>
                  <button onClick={() => { if (confirm("Delete this FAQ?")) remove(faq.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add FAQ</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit((v) => create(v))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Question *</label>
                <input {...register("question", { required: true })} placeholder="e.g. What courses do you offer?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Answer *</label>
                <textarea {...register("answer", { required: true })} rows={4} placeholder="Detailed answer..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display on *</label>
                <select {...register("location", { required: true })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Where this FAQ appears. Course pages have their own FAQs set per course.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Adding..." : "Add FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
