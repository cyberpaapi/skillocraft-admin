"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Star, Loader2 } from "lucide-react";

interface Brand { id: string; image: string; status: string; }

export default function BrandsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => { const { data } = await api.get("/feature-brands"); return (data?.data || []) as Brand[]; },
  });
  const items = data || [];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add Brand</button></div>
      {isLoading ? <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        : items.length === 0 ? <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><Star size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No brands yet</p></div>
        : <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-center h-24">
                <img src={b.image.startsWith("http") ? b.image : `${API_URL}${b.image}`} alt="" className="max-h-12 max-w-full object-contain" />
              </div>
            ))}
          </div>}
    </div>
  );
}
