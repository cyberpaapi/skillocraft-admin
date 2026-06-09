"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourses, deleteCourse } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, Pencil, Loader2, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

interface Course {
  id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
  image?: string;
  category?: { name: string };
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await getCourses();
      return (data?.data?.courses || data?.courses || []) as Course[];
    },
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const courses = (data || []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <Link
          href="/courses/create"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Course
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No courses found</p>
            <p className="text-sm mt-1">Create your first course to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Course</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{course.name}</td>
                  <td className="px-6 py-3 text-slate-500">{course.category?.name || "—"}</td>
                  <td className="px-6 py-3 font-semibold">{formatCurrency(course.price)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      course.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(course.createdAt)}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/courses/${course.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm("Delete this course?")) remove(course.id);
                        }}
                        disabled={deleting}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
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
    </div>
  );
}
