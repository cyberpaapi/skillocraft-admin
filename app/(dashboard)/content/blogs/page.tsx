"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlogs, deleteBlog, getAuthors, getCategories } from "@/lib/api";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, FileText, Loader2, X, Upload, Star } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface Blog { id: string; title: string; status: string; isFeatured: boolean; createdAt: string; author?: { name: string }; category?: { name: string }; }
interface Author { id: string; name: string; }
interface Category { id: string; name: string; }

export default function BlogsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const { data } = await getBlogs();
      return (data?.data?.blogs || data?.blogs || []) as Blog[];
    },
  });

  const { data: authors } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const { data } = await getAuthors();
      return (data?.data || []) as Author[];
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
    mutationFn: (fd: FormData) => api.post("/adminpanel/blogs", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      toast.success("Blog created");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      setShowModal(false);
      setImageFile(null);
      setIsFeatured(false);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create blog"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => { toast.success("Blog deleted"); queryClient.invalidateQueries({ queryKey: ["blogs"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const { mutate: toggleFeatured } = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => {
      const fd = new FormData();
      fd.append("featured", String(!featured));
      return api.put(`/adminpanel/blogs/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { toast.success("Updated"); queryClient.invalidateQueries({ queryKey: ["blogs"] }); },
    onError: () => toast.error("Failed to update"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile) { toast.error("Please upload a featured image"); return; }
    const form = e.currentTarget;
    const authorName = (form.elements.namedItem("authorName") as HTMLInputElement).value.trim();
    const authorList = authors || [];
    const matchedAuthor = authorList.find(
      (a) => a.name.toLowerCase() === authorName.toLowerCase()
    );
    if (!matchedAuthor) {
      toast.error(`No author found with name "${authorName}". Please create the author first in the Authors tab.`);
      return;
    }
    const fd = new FormData();
    fd.append("title", (form.elements.namedItem("title") as HTMLInputElement).value);
    fd.append("authorId", matchedAuthor.id);
    fd.append("categoryId", (form.elements.namedItem("categoryId") as HTMLSelectElement).value);
    fd.append("shortDescription", (form.elements.namedItem("shortDescription") as HTMLInputElement).value);
    fd.append("longDescription", (form.elements.namedItem("longDescription") as HTMLTextAreaElement).value);
    fd.append("featured", String(isFeatured));
    fd.append("image", imageFile);
    create(fd);
  };

  const blogs = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> New Blog
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><FileText size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No blogs yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Author</th>
                <th className="px-6 py-3 font-medium">Featured</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800 max-w-xs truncate">{blog.title}</td>
                  <td className="px-6 py-3 text-slate-500">{blog.author?.name || "—"}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleFeatured({ id: blog.id, featured: blog.isFeatured })}
                      title={blog.isFeatured ? "Remove from Most Loved" : "Add to Most Loved Blogs"}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${blog.isFeatured ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-slate-100 text-slate-500 hover:bg-yellow-50 hover:text-yellow-600"}`}
                    >
                      <Star size={11} className={blog.isFeatured ? "fill-yellow-500" : ""} />
                      {blog.isFeatured ? "Featured" : "Normal"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${blog.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{blog.status}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(blog.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { if (confirm("Delete this blog?")) remove(blog.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
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
              <h2 className="font-semibold text-slate-800">New Blog Post</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input name="title" required placeholder="Blog post title"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Author Name *</label>
                  <input name="authorName" required placeholder="e.g. Roshni Kaur"
                    list="author-suggestions"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <datalist id="author-suggestions">
                    {(authors || []).map((a) => <option key={a.id} value={a.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select name="categoryId" required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select category</option>
                    {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Short Description *</label>
                <input name="shortDescription" required placeholder="Brief summary (1-2 sentences)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea name="longDescription" required rows={5} placeholder="Full blog content..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500"
                />
                <label htmlFor="featured-check" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                  <Star size={14} className={isFeatured ? "text-yellow-500 fill-yellow-500" : "text-slate-400"} />
                  Add to "Most Loved Blogs"
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Featured Image *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {imageFile ? imageFile.name : "Upload featured image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
