"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCategories, getCreators, createCourse, createCategory, api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, Plus, Check, Video, X } from "lucide-react";
import Link from "next/link";

interface Category { id: string; name: string; }
interface Creator { id: string; name: string; designation?: string; }

const ADD_NEW = "__add_new__";

// Create a category by name (no image required) and return its real ID
async function ensureCategoryExists(name: string): Promise<string> {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("description", name);
  fd.append("status", "ACTIVE");
  const { data } = await createCategory(fd);
  return data?.data?.id || data?.id;
}

// Create a creator by name only and return its real ID
async function ensureCreatorExists(name: string, designation = "Expert"): Promise<string> {
  const fd = new FormData();
  fd.append("name", name);
  fd.append("description", `${name} - Skillocraft Creator`);
  fd.append("designation", designation);
  const { data } = await api.post("/adminpanel/creator", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return data?.data?.id || data?.id;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [teaserFile, setTeaserFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [lectures, setLectures] = useState("");
  const [duration, setDuration] = useState("");
  const [recommended, setRecommended] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);

  // Category select state
  const [categoryId, setCategoryId] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Creator select state
  const [creatorId, setCreatorId] = useState("");
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState("");
  const [newCreatorDesignation, setNewCreatorDesignation] = useState("");
  const [addingCreator, setAddingCreator] = useState(false);
  const [localCreators, setLocalCreators] = useState<Creator[]>([]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const { data } = await getCategories(); return (data?.data || []) as Category[]; },
  });
  const { data: creatorsData } = useQuery({
    queryKey: ["creators"],
    queryFn: async () => { const { data } = await getCreators(); return (data?.data || []) as Creator[]; },
  });

  const apiCategories = categoriesData || [];
  const apiCreators = creatorsData || [];

  // Only real categories/creators from the DB (plus any just added locally)
  const allCategories = [...apiCategories, ...localCategories];
  const allCreators = [...apiCreators, ...localCreators];

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      const realId = await ensureCategoryExists(name);
      const newCat: Category = { id: realId, name };
      setLocalCategories((prev) => [...prev, newCat]);
      setCategoryId(realId);
      setShowAddCategory(false);
      setNewCategoryName("");
      toast.success(`Category "${name}" created`);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddCreator = async () => {
    const name = newCreatorName.trim();
    if (!name) return;
    setAddingCreator(true);
    try {
      const realId = await ensureCreatorExists(name, newCreatorDesignation || "Expert");
      const newCreator: Creator = { id: realId, name, designation: newCreatorDesignation || "Expert" };
      setLocalCreators((prev) => [...prev, newCreator]);
      setCreatorId(realId);
      setShowAddCreator(false);
      setNewCreatorName("");
      setNewCreatorDesignation("");
      toast.success(`Creator "${name}" added`);
    } catch {
      toast.error("Failed to create creator");
    } finally {
      setAddingCreator(false);
    }
  };

  const handleCategoryChange = (val: string) => {
    if (val === ADD_NEW) {
      setShowAddCategory(true);
      setCategoryId("");
    } else {
      setShowAddCategory(false);
      setCategoryId(val);
    }
  };

  const handleCreatorChange = (val: string) => {
    if (val === ADD_NEW) {
      setShowAddCreator(true);
      setCreatorId("");
    } else {
      setShowAddCreator(false);
      setCreatorId(val);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload a certificate image and return its URL (reuses the site-image endpoint)
  const uploadCertificate = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("key", "course_certificate_upload");
    fd.append("image", file);
    const { data } = await api.post("/adminpanel/site-settings/image", fd);
    return data?.url || "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryId || categoryId === ADD_NEW) { toast.error("Please select or create a category"); return; }
    if (!creatorId || creatorId === ADD_NEW) { toast.error("Please select or create a creator"); return; }
    if (!price) { toast.error("Please enter a price"); return; }

    setLoading(true);
    const form = e.currentTarget;

    try {
      const resolvedCategoryId = categoryId;
      const resolvedCreatorId = creatorId;

      const fd = new FormData();
      fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
      fd.append("categoryId", resolvedCategoryId);
      fd.append("creatorId", resolvedCreatorId);
      fd.append("shortDescription", (form.elements.namedItem("shortDescription") as HTMLTextAreaElement).value);
      fd.append("longDescription", (form.elements.namedItem("longDescription") as HTMLTextAreaElement).value);
      fd.append("price", price);
      if (discountedPrice) fd.append("discountedPrice", discountedPrice);
      if (lectures.trim()) fd.append("lectures", lectures.trim());
      if (duration.trim()) fd.append("duration", duration.trim());
      fd.append("recommended", recommended ? "true" : "false");
      if (certificateFile) {
        const certUrl = await uploadCertificate(certificateFile);
        if (certUrl) fd.append("certificate", certUrl);
      }
      fd.append("language", (form.elements.namedItem("language") as HTMLInputElement).value);
      fd.append("whatsAppLink", (form.elements.namedItem("whatsAppLink") as HTMLInputElement).value);
      fd.append("featured", (form.elements.namedItem("featured") as HTMLInputElement).checked ? "true" : "false");
      if (imageFile) fd.append("image", imageFile);
      if (teaserFile) fd.append("teaserVideo", teaserFile);

      await createCourse(fd);
      toast.success("Course created!");
      router.push("/courses");
    } catch (err: any) {
      const errors = err?.response?.data?.errors as { message: string }[] | undefined;
      if (errors?.length) {
        toast.error(errors.map(e => e.message).join(' · '));
      } else {
        toast.error(err?.response?.data?.message || "Failed to create course");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/courses" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">Create New Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-slate-700 text-sm uppercase tracking-wide">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Name *</label>
            <input name="name" required placeholder="e.g. Professional Baking Masterclass" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={showAddCategory ? ADD_NEW : categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required={!showAddCategory}
                className={selectClass}
              >
                <option value="">Select category</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={ADD_NEW}>➕ Add New</option>
              </select>
              {showAddCategory && (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                    placeholder="Category name"
                    className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-1"
                  >
                    {addingCategory ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Creator */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Creator *</label>
              <select
                value={showAddCreator ? ADD_NEW : creatorId}
                onChange={(e) => handleCreatorChange(e.target.value)}
                required={!showAddCreator}
                className={selectClass}
              >
                <option value="">Select creator</option>
                {allCreators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.designation ? ` — ${c.designation}` : ""}</option>
                ))}
                <option value={ADD_NEW}>➕ Add New</option>
              </select>
              {showAddCreator && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newCreatorName}
                      onChange={(e) => setNewCreatorName(e.target.value)}
                      placeholder="Creator name"
                      className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newCreatorDesignation}
                      onChange={(e) => setNewCreatorDesignation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCreator())}
                      placeholder="Designation (e.g. Baking Expert)"
                      className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCreator}
                      disabled={addingCreator || !newCreatorName.trim()}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-1"
                    >
                      {addingCreator ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCreator(false); setNewCreatorName(""); setNewCreatorDesignation(""); }}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
              <input
                type="number" min="0" placeholder="999" required className={inputClass}
                value={price} onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discounted Price (₹)
                {price && discountedPrice && parseFloat(discountedPrice) < parseFloat(price) && (
                  <span className="ml-2 text-xs font-semibold text-green-600">
                    {Math.round((1 - parseFloat(discountedPrice) / parseFloat(price)) * 100)}% off
                  </span>
                )}
              </label>
              <input
                type="number" min="0" placeholder="Optional" className={inputClass}
                value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Lectures</label>
              <input
                type="text" placeholder="e.g. 12" className={inputClass}
                value={lectures} onChange={(e) => setLectures(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Optional. Overrides the auto-counted lecture number on the course page.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Duration</label>
              <input
                type="text" placeholder="e.g. 6h 30m" className={inputClass}
                value={duration} onChange={(e) => setDuration(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Optional. Overrides the auto-calculated total length.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Language *</label>
            <input name="language" required defaultValue="Hindi" placeholder="Hindi" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Link</label>
            <input name="whatsAppLink" defaultValue="whatsapp://send?phone=" placeholder="whatsapp://send?phone=91XXXXXXXXXX" className={inputClass} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="featured" id="featured" value="true" className="rounded" />
            <label htmlFor="featured" className="text-sm text-slate-700">Top Trending Course</label>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="recommended" checked={recommended} onChange={(e) => setRecommended(e.target.checked)} className="rounded" />
            <label htmlFor="recommended" className="text-sm text-slate-700">Show under &quot;Recommended Courses&quot;</label>
          </div>
        </div>

        {/* Descriptions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-slate-700 text-sm uppercase tracking-wide">Descriptions</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Short Description *</label>
            <textarea name="shortDescription" required rows={2} placeholder="Brief overview" className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Long Description *</label>
            <textarea name="longDescription" required rows={5} placeholder="Detailed description" className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-medium text-slate-700 text-sm uppercase tracking-wide mb-4">Course Image</h2>
          <label className="cursor-pointer">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-slate-200" />
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500">Click to upload course image</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        {/* Course Certificate (optional override) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-medium text-slate-700 text-sm uppercase tracking-wide mb-1">Course Certificate</h2>
          <p className="text-xs text-slate-400 mb-4">Optional. A certificate image specific to this course. If not set, the Default Certificate from Site Settings is shown.</p>
          <label className="cursor-pointer block">
            {certificatePreview ? (
              <img src={certificatePreview} alt="Certificate preview" className="w-full max-h-48 object-contain rounded-lg border border-slate-200" />
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                <p className="text-sm text-slate-500">Click to upload certificate image</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setCertificateFile(f);
              setCertificatePreview(f ? URL.createObjectURL(f) : null);
            }} />
          </label>
        </div>

        {/* Teaser Video */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-medium text-slate-700 text-sm uppercase tracking-wide mb-1">Teaser Video</h2>
          <p className="text-xs text-slate-400 mb-4">Short preview video shown on the course page before purchase. Fallback is the course image.</p>
          <label className="cursor-pointer block">
            <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${teaserFile ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-400"}`}>
              {teaserFile ? (
                <div className="flex items-center justify-center gap-2 text-indigo-700">
                  <Video size={16} />
                  <span className="text-sm font-medium truncate max-w-xs">{teaserFile.name}</span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setTeaserFile(null); }}
                    className="ml-2 text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                  <p className="text-sm text-slate-500">Click to upload teaser video</p>
                  <p className="text-xs text-slate-400 mt-1">MP4, max 500MB</p>
                </>
              )}
            </div>
            <input type="file" accept="video/*" className="hidden" onChange={(e) => setTeaserFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* Downloadable content is managed per-file (with names) from the course edit screen after creation. */}

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/courses" className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 text-center">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
}
