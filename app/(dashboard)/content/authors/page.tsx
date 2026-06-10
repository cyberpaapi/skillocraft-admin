"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuthor, deleteAuthor } from "@/lib/api";
import { api } from "@/lib/api";
import { Plus, UserCog, Loader2, X, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface Author { id: string; name: string; designation?: string; description?: string; status: string; imageLink?: string; }

export default function AuthorsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data } = await api.get("/author");
      return (data?.data || []) as Author[];
    },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => createAuthor(fd),
    onSuccess: () => {
      toast.success("Author added");
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      setShowModal(false);
      setImageFile(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteAuthor(id),
    onSuccess: () => { toast.success("Author deleted"); queryClient.invalidateQueries({ queryKey: ["authors"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("designation", (form.elements.namedItem("designation") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    if (imageFile) fd.append("image", imageFile);
    create(fd);
  };

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Author
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : items.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><UserCog size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No authors yet</p></div>
        ) : (
          items.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 group relative">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0 overflow-hidden">
                {a.imageLink ? <img src={a.imageLink} alt={a.name} className="w-full h-full object-cover" /> : a.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{a.name}</p>
                <p className="text-sm text-slate-500 truncate">{a.designation || "Author"}</p>
              </div>
              <button
                onClick={() => { if (confirm(`Delete ${a.name}?`)) remove(a.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Author</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                <input name="designation" placeholder="e.g. Senior Instructor"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio *</label>
                <textarea name="description" required rows={3} placeholder="Short bio..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Photo (optional)</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {imageFile ? imageFile.name : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Adding..." : "Add Author"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
