"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, UserCheck, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface Creator { id: string; name: string; designation?: string; status: string; }

export default function CreatorsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => { const { data } = await api.get("/creators"); return (data?.data || []) as Creator[]; },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => api.post("/adminpanel/creator", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      toast.success("Creator added");
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      setShowModal(false);
      setImageFile(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile) { toast.error("Please upload a creator image"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLInputElement).value);
    fd.append("designation", (form.elements.namedItem("designation") as HTMLInputElement).value);
    fd.append("image", imageFile);
    create(fd);
  };

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Creator
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? <div className="col-span-3 flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
          : items.length === 0
            ? <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><UserCheck size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No creators yet</p></div>
            : items.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">{c.name.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.designation || "Creator"}</p>
                  <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.status}</span>
                </div>
              </div>
            ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Creator</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Roshni Kaur"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                <input name="designation" placeholder="e.g. Baking Expert"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea name="description" required rows={3} placeholder="Short bio of the creator"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Photo *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {imageFile ? imageFile.name : "Upload creator photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
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
