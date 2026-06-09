"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, HelpCircle, Loader2 } from "lucide-react";

interface FAQ { id: string; question: string; answer: string; status: string; }

export default function FAQsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => { const { data } = await api.get("/general-faqs"); return (data?.data || []) as FAQ[]; },
  });
  const items = data || [];
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add FAQ</button></div>
      <div className="space-y-3">
        {isLoading ? <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          : items.length === 0 ? <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><HelpCircle size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No FAQs yet</p></div>
          : items.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">{faq.question}</p>
                  <p className="text-sm text-slate-500 mt-1">{faq.answer}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${faq.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{faq.status}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
