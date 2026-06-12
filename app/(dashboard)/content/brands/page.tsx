"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrand, deleteBrand } from "@/lib/api";
import { api } from "@/lib/api";
import { Plus, Star, Loader2, X, Upload, Trash2 } from "lucide-react";
import { imgSrc } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface Brand { id: string; logo: string; image?: string; brandUrl?: string; status: string; }

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await api.get("/feature-brands");
      return (data?.data || []) as Brand[];
    },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => createBrand(fd),
    onSuccess: () => {
      toast.success("Brand added");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setShowModal(false);
      setLogoFile(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to add"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["brands"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!logoFile) { toast.error("Please upload a logo"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("logo", logoFile);
    fd.append("brandUrl", (form.elements.namedItem("brandUrl") as HTMLInputElement).value);
    create(fd);
  };

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><Star size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No brands yet</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((b) => {
            const src = imgSrc(b.logo || b.image);
            return (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-center h-24 relative group">
                <img src={src} alt="" className="max-h-12 max-w-full object-contain" />
                <button
                  onClick={() => { if (confirm("Delete this brand?")) remove(b.id); }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-600 text-white p-1 rounded transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Brand / Featured On</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Logo *</label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={20} className="text-slate-400" />
                  {logoFile ? <span className="text-indigo-600 font-medium">{logoFile.name}</span> : <span>Upload logo (PNG/SVG preferred)</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Brand URL *</label>
                <input name="brandUrl" required placeholder="https://example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Adding..." : "Add Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
