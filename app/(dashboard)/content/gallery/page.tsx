"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";

interface GalleryItem { id: string; image: string; status: string; }

export default function GalleryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => { const { data } = await api.get("/feature-gallery"); return (data?.data || []) as GalleryItem[]; },
  });
  const items = data || [];
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add Image</button></div>
      {isLoading ? <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        : items.length === 0 ? <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><ImageIcon size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No gallery images yet</p></div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm aspect-square relative group">
                <img src={item.image.startsWith("http") ? item.image : `${API_URL}${item.image}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>}
    </div>
  );
}
