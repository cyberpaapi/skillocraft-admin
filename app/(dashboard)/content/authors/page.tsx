"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, UserCog, Loader2 } from "lucide-react";

interface Author { id: string; name: string; designation?: string; status: string; }

export default function AuthorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => { const { data } = await api.get("/author"); return (data?.data || []) as Author[]; },
  });
  const items = data || [];
  return (
    <div className="space-y-5">
      <div className="flex justify-end"><button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Add Author</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <div className="col-span-3 flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          : items.length === 0 ? <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><UserCog size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No authors yet</p></div>
          : items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0">{a.name.charAt(0)}</div>
              <div>
                <p className="font-semibold text-slate-800">{a.name}</p>
                <p className="text-sm text-slate-500">{a.designation || "Author"}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
