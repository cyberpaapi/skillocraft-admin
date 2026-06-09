"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, deleteCategory, createCategory, updateCategory } from "@/lib/api";
import { Plus, Trash2, Pencil, Loader2, FolderOpen, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Category {
  id: string;
  name: string;
  description?: string;
  status: string;
  featured: boolean;
  imageUrl?: string;
  icon?: string;
  children?: Category[];
}

type ModalMode = "create" | "edit";

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  // Modal state
  const [mode, setMode] = useState<ModalMode>("create");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  // File state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);

  // Form fields (controlled for edit pre-fill)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await getCategories();
      return (data?.data || []) as Category[];
    },
  });

  // Pre-fill when opening edit modal
  useEffect(() => {
    if (mode === "edit" && editing) {
      setName(editing.name);
      setDescription(editing.description || "");
      setFeatured(editing.featured);
    } else if (mode === "create") {
      setName("");
      setDescription("");
      setFeatured(false);
    }
    setImageFile(null);
    setIconFile(null);
  }, [mode, editing]);

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setImageFile(null);
    setIconFile(null);
  };

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setMode("edit");
    setEditing(cat);
    setShowModal(true);
  };

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => createCategory(fd),
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => updateCategory(id, fd),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", description);
    fd.append("status", "ACTIVE");
    fd.append("featured", featured ? "true" : "false");
    if (imageFile) fd.append("image", imageFile);
    if (iconFile) fd.append("icon", iconFile);

    if (mode === "edit" && editing) {
      update({ id: editing.id, fd });
    } else {
      create(fd);
    }
  };

  const getImgSrc = (link?: string) => {
    if (!link) return null;
    return link.startsWith("http") ? link : `${API_URL}${link}`;
  };

  const categories = data || [];
  const isSaving = creating || updating;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Icon</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Subcategories</th>
                <th className="px-6 py-3 font-medium">Featured</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    {getImgSrc(cat.icon) ? (
                      <img src={getImgSrc(cat.icon)!} alt={cat.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">{cat.name}</td>
                  <td className="px-6 py-3 text-slate-500">{cat.children?.length || 0}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.featured ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {cat.featured ? "Featured" : "Normal"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this category?")) remove(cat.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {mode === "edit" ? `Edit — ${editing?.name}` : "Add Category"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={16} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Baking"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Image {mode === "edit" && editing?.imageUrl && <span className="text-xs text-slate-400">(replace)</span>}
                  </label>
                  {mode === "edit" && editing?.imageUrl && !imageFile && (
                    <img src={getImgSrc(editing.imageUrl)!} className="w-full h-12 object-cover rounded-lg mb-1 border border-slate-100" alt="" />
                  )}
                  <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-2.5 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                    <Upload size={14} />
                    {imageFile ? imageFile.name : "Upload image"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Icon {mode === "edit" && editing?.icon && <span className="text-xs text-slate-400">(replace)</span>}
                  </label>
                  {mode === "edit" && editing?.icon && !iconFile && (
                    <img src={getImgSrc(editing.icon)!} className="w-8 h-8 object-cover rounded-lg mb-1 border border-slate-100" alt="" />
                  )}
                  <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-2.5 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                    <Upload size={14} />
                    {iconFile ? iconFile.name : "Upload icon"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setIconFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat-featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="cat-featured" className="text-sm text-slate-700">Feature this category</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {isSaving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
