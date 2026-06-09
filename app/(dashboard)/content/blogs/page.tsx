"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlogs, deleteBlog } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Blog {
  id: string;
  title: string;
  status: string;
  isFeatured: boolean;
  createdAt: string;
  author?: { name: string };
  category?: { name: string };
}

export default function BlogsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const { data } = await getBlogs();
      return (data?.data?.blogs || data?.blogs || []) as Blog[];
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      toast.success("Blog deleted");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const blogs = data || [];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> New Blog
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No blogs yet</p>
          </div>
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
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      blog.isFeatured ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {blog.isFeatured ? "Featured" : "Normal"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      blog.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(blog.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => { if (confirm("Delete this blog?")) remove(blog.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
