"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getCategories, deleteSuccessStory } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trophy, Loader2, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface SuccessStory { id: string; name: string; designation?: string; brand?: string; earning?: string; status: string; createdAt: string; }
interface Category { id: string; name: string; }

export default function SuccessPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      const { data } = await api.get("/success");
      const raw = data?.data;
      return (Array.isArray(raw) ? raw : raw?.category_data ?? []) as SuccessStory[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await getCategories();
      return (data?.data || []) as Category[];
    },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => api.post("/adminpanel/success", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      toast.success("Success story added");
      queryClient.invalidateQueries({ queryKey: ["success-stories"] });
      setShowModal(false);
      setImageFile(null);
      setCoverFile(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteSuccessStory(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["success-stories"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile || !coverFile) { toast.error("Both image and cover photo are required"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    fd.append("brand", (form.elements.namedItem("brand") as HTMLInputElement).value);
    fd.append("earning", (form.elements.namedItem("earning") as HTMLInputElement).value);
    fd.append("categoryId", (form.elements.namedItem("categoryId") as HTMLSelectElement).value);
    fd.append("image", imageFile);
    fd.append("coverPhoto", coverFile);
    create(fd);
  };

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Story
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><Trophy size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No success stories yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Brand</th>
                <th className="px-6 py-3 font-medium">Earning</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-6 py-3 text-slate-500">{s.brand || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{s.earning || "—"}</td>
                  <td className="px-6 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span></td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { if (confirm("Delete this story?")) remove(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Success Story</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Priya Sharma"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea name="description" required rows={3} placeholder="Their success story..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                  <input name="brand" required placeholder="e.g. Google"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Earning *</label>
                  <input name="earning" required placeholder="e.g. ₹5 LPA"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select name="categoryId" required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {imageFile ? imageFile.name : "Upload profile photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Photo *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {coverFile ? coverFile.name : "Upload cover photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
