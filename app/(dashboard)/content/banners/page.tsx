"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBanners, createBanner, deleteBanner } from "@/lib/api";
import { Plus, Trash2, Image as ImageIcon, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const LOCATIONS = [
  { value: "HOME", label: "Home Page" },
  { value: "COURSE", label: "Courses Page" },
  { value: "LIVE", label: "Live Events" },
  { value: "MARKET", label: "Marketplace" },
  { value: "BLOG", label: "Blogs" },
  { value: "SUCCESS_STORY", label: "Success Stories" },
  { value: "REFER", label: "Refer & Earn" },
];

interface Banner {
  id: string;
  name: string;
  description?: string;
  bannerLocation: string;
  imageLink: string;
  status: string;
}

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await getBanners();
      return (data?.data || []) as Banner[];
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      toast.success("Banner deleted");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => createBanner(fd),
    onSuccess: () => {
      toast.success("Banner created");
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setShowModal(false);
      setImageFile(null);
      setPreview(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create banner"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile) { toast.error("Please upload a banner image"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLInputElement).value);
    fd.append("bannerLocation", (form.elements.namedItem("bannerLocation") as HTMLSelectElement).value);
    fd.append("image", imageFile);
    create(fd);
  };

  const banners = data || [];
  const getImageSrc = (link: string) => link?.startsWith("http") ? link : `${API_URL}${link}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">Banners</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ImageIcon size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No banners yet</p>
            <p className="text-xs mt-1">Add banners for the home page carousel</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Preview</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    {b.imageLink ? (
                      <img
                        src={getImageSrc(b.imageLink)}
                        alt={b.name}
                        className="w-24 h-14 object-cover rounded-lg border border-slate-100"
                      />
                    ) : (
                      <div className="w-24 h-14 bg-slate-100 rounded-lg flex items-center justify-center">
                        <ImageIcon size={16} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-medium text-slate-800">{b.name}</p>
                    {b.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{b.description}</p>}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {LOCATIONS.find(l => l.value === b.bannerLocation)?.label || b.bannerLocation}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => { if (confirm("Delete this banner?")) remove(b.id); }}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Banner</h2>
              <button onClick={() => { setShowModal(false); setImageFile(null); setPreview(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={16} />
              </button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Summer Sale Banner"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input name="description" placeholder="Optional subtitle text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
                <select name="bannerLocation" required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image * <span className="text-slate-400 font-normal">(recommended 1920×600px)</span></label>
                <label className="cursor-pointer block">
                  {preview ? (
                    <div className="relative">
                      <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                      <button type="button" onClick={(e) => { e.preventDefault(); setImageFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-slate-500 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                      <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-500">Click to upload banner image</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); }
                  }} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setImageFile(null); setPreview(null); }}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Uploading..." : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
