"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, imgSrc } from "@/lib/utils";
import { Plus, Trash2, Pencil, Loader2, X, Upload, ShoppingBag, Star, Tag } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import SuperAdminGate from "@/components/SuperAdminGate";

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  category: string;
  images: string[];
  highlights: { key: string; value: string }[];
  specifications?: string;
  importantNote?: string;
  deliveryInfo?: string;
  featured?: boolean;
  bestSelling?: boolean;
  status: string;
}

interface MarketplaceCategory { id: string; name: string; imageUrl?: string | null; }

const ADD_NEW = "__add_new__";

function ProductModal({
  product,
  categories,
  onCategoryAdded,
  onClose,
  onSuccess,
}: {
  product?: MarketplaceProduct;
  categories: MarketplaceCategory[];
  onCategoryAdded: (name: string) => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [highlights, setHighlights] = useState<{ key: string; value: string }[]>(
    product?.highlights || [{ key: "", value: "" }]
  );
  const [category, setCategory] = useState(product?.category || (categories[0]?.name ?? ""));
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [bestSelling, setBestSelling] = useState(Boolean(product?.bestSelling));
  const formRef = useRef<HTMLFormElement>(null);

  const handleCategoryChange = (val: string) => {
    if (val === ADD_NEW) { setShowAddCat(true); }
    else { setShowAddCat(false); setCategory(val); }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      await onCategoryAdded(name);
      setCategory(name);
      setShowAddCat(false);
      setNewCatName("");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category) { toast.error("Please select or add a category"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    fd.append("price", (form.elements.namedItem("price") as HTMLInputElement).value);
    fd.append("originalPrice", (form.elements.namedItem("originalPrice") as HTMLInputElement).value);
    fd.append("discount", (form.elements.namedItem("discount") as HTMLInputElement).value);
    fd.append("category", category);
    fd.append("featured", featured ? "true" : "false");
    fd.append("bestSelling", bestSelling ? "true" : "false");
    fd.append("specifications", (form.elements.namedItem("specifications") as HTMLTextAreaElement).value);
    fd.append("importantNote", (form.elements.namedItem("importantNote") as HTMLInputElement).value);
    fd.append("deliveryInfo", (form.elements.namedItem("deliveryInfo") as HTMLInputElement).value);
    const validHighlights = highlights.filter(h => h.key && h.value);
    fd.append("highlights", JSON.stringify(validHighlights));
    for (const f of imageFiles) fd.append("images", f);

    setSubmitting(true);
    try {
      if (product) {
        await api.put(`/adminpanel/marketplace-products/${product.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Product updated");
      } else {
        await api.post("/adminpanel/marketplace-products", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Product created");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-slate-800">{product ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
              <input name="name" required defaultValue={product?.name} className={inputClass} placeholder="e.g. Professional Baking Kit" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
              <textarea name="description" required rows={3} defaultValue={product?.description} className={`${inputClass} resize-none`} placeholder="Product description..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Price (₹) *</label>
              <input name="price" required type="number" min="0" defaultValue={product?.price} className={inputClass} placeholder="699" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Original Price (₹)</label>
              <input name="originalPrice" type="number" min="0" defaultValue={product?.originalPrice} className={inputClass} placeholder="1499" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Discount (%)</label>
              <input name="discount" type="number" min="0" max="100" defaultValue={product?.discount || "0"} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category *</label>
              <select value={showAddCat ? ADD_NEW : category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value={ADD_NEW}>➕ Add new category</option>
              </select>
              {showAddCat && (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                    placeholder="New category name"
                    className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={handleAddCategory} disabled={addingCat || !newCatName.trim()}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60">
                    {addingCat ? <Loader2 size={13} className="animate-spin" /> : "Add"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Featured / Best Selling */}
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-slate-700 font-medium flex items-center gap-1"><Star size={13} /> Featured (top selling)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={bestSelling} onChange={(e) => setBestSelling(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-sm text-slate-700 font-medium flex items-center gap-1"><Tag size={13} /> Best Selling</span>
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Images (up to 6)</label>
            {product?.images && product.images.length > 0 && imageFiles.length === 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {product.images.map((img, i) => (
                  <img key={i} src={imgSrc(img)} alt="" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                ))}
                <p className="text-xs text-slate-400 self-center">Upload new images to replace</p>
              </div>
            )}
            <label className="flex items-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
              <Upload size={14} />
              {imageFiles.length > 0 ? `${imageFiles.length} file(s) selected` : "Upload product images"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
            </label>
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Highlights (key-value pairs)</label>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input value={h.key} onChange={(e) => { const n = [...highlights]; n[i].key = e.target.value; setHighlights(n); }} placeholder="Key (e.g. Material)" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={h.value} onChange={(e) => { const n = [...highlights]; n[i].value = e.target.value; setHighlights(n); }} placeholder="Value (e.g. Silicone)" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-2"><X size={14} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setHighlights([...highlights, { key: "", value: "" }])} className="text-xs text-indigo-600 hover:underline">+ Add row</button>
            </div>
          </div>

          {/* Optional fields */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Specifications</label>
            <textarea name="specifications" rows={2} defaultValue={product?.specifications || ""} className={`${inputClass} resize-none`} placeholder="Product specifications..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Important Note</label>
              <input name="importantNote" defaultValue={product?.importantNote || ""} className={inputClass} placeholder="e.g. Keep away from heat" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Delivery Info</label>
              <input name="deliveryInfo" defaultValue={product?.deliveryInfo || ""} className={inputClass} placeholder="e.g. 3-5 business days" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Saving..." : product ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

interface BannerData { badge: string; title: string; subtitle: string; cta: string; ctaLink: string; bgImage: string; }

const DEFAULT_BANNERS: BannerData[] = [
  { badge: "New Launch", title: "Start Your Own Perfume Brand", subtitle: "Professional Perfume Making Course at just ₹699/-", cta: "Join Now", ctaLink: "", bgImage: "" },
  { badge: "Number One", title: "Skill-Tech Platform in India", subtitle: "Login and Start Your Learning Now", cta: "Login", ctaLink: "", bgImage: "" },
];

function MarketplaceBanners() {
  const [banners, setBanners] = useState<BannerData[]>(DEFAULT_BANNERS);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useQuery({
    queryKey: ["marketplace-banners"],
    queryFn: async () => {
      const { data } = await api.get("/site-settings?keys=marketplace_banners");
      const raw = data?.data?.marketplace_banners;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 2) setBanners(parsed);
        } catch {}
      }
      return raw || null;
    },
  });

  const setField = (idx: number, key: keyof BannerData, value: string) =>
    setBanners((prev) => prev.map((b, i) => i === idx ? { ...b, [key]: value } : b));

  const uploadBg = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const fd = new FormData();
      fd.append("key", "marketplace_banner_bg_upload");
      fd.append("image", file);
      const { data } = await api.post("/adminpanel/site-settings/image", fd);
      if (data?.url) setField(idx, "bgImage", data.url);
      else throw new Error();
    } catch {
      toast.error("Failed to upload background");
    } finally {
      setUploadingIdx(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/adminpanel/site-settings", { key: "marketplace_banners", value: JSON.stringify(banners) });
      toast.success("Banners saved");
    } catch {
      toast.error("Failed to save banners");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><ShoppingBag size={16} /> Marketplace Banners</h2>
        <p className="text-xs text-slate-400 mt-0.5">The two promo banners at the top of the marketplace page. Edit text and background image.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {banners.map((b, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Banner {idx + 1}</p>
            <input value={b.badge} onChange={(e) => setField(idx, "badge", e.target.value)} placeholder="Badge (e.g. New Launch)" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={b.title} onChange={(e) => setField(idx, "title", e.target.value)} placeholder="Title" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={b.subtitle} onChange={(e) => setField(idx, "subtitle", e.target.value)} placeholder="Subtitle" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="grid grid-cols-2 gap-2">
              <input value={b.cta} onChange={(e) => setField(idx, "cta", e.target.value)} placeholder="Button text" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={b.ctaLink} onChange={(e) => setField(idx, "ctaLink", e.target.value)} placeholder="Button link (/courses)" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              {b.bgImage && <img src={imgSrc(b.bgImage)} alt="bg" className="w-16 h-10 object-cover rounded border border-slate-200" />}
              <label className="flex-1 flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-2 cursor-pointer hover:border-indigo-400 text-xs text-slate-500">
                <Upload size={13} />
                {uploadingIdx === idx ? "Uploading..." : b.bgImage ? "Change background image" : "Upload background image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBg(idx, f); }} />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />} Save Banners
      </button>
    </div>
  );
}

export default function MarketplacePage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; product?: MarketplaceProduct }>({ open: false });
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data } = await api.get("/marketplace-products?limit=100&status=ACTIVE");
      return (data?.data || []) as MarketplaceProduct[];
    },
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ["marketplace-categories"],
    queryFn: async () => {
      const { data } = await api.get("/adminpanel/marketplace-categories");
      return (data?.data || []) as MarketplaceCategory[];
    },
  });
  const categories = categoriesData || [];

  const addCategory = async (name: string) => {
    await api.post("/adminpanel/marketplace-categories", { name });
    await refetchCategories();
  };

  const handleAddCategoryTop = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      await addCategory(name);
      toast.success("Category added");
      setNewCategory("");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/marketplace-categories/${id}`),
    onSuccess: () => { toast.success("Category removed"); refetchCategories(); },
    onError: () => toast.error("Failed to remove category"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/marketplace-products/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["marketplace-products"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const products = data || [];

  return (
    <SuperAdminGate>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Marketplace Products</h1>
          <p className="text-sm text-slate-500">{products.length} products</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Marketplace Banners */}
      <MarketplaceBanners />

      {/* Categories management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Tag size={16} /> Marketplace Categories</h2>
          <p className="text-xs text-slate-400 mt-0.5">Course categories appear here automatically. Add marketplace-only categories below. Names are unique.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm rounded-full pl-3 pr-1.5 py-1">
              {c.name}
              <button onClick={() => { if (confirm(`Remove "${c.name}" from marketplace categories?`)) deleteCategory(c.id); }}
                className="text-slate-400 hover:text-red-500" title="Remove">
                <X size={13} />
              </button>
            </span>
          ))}
          {categories.length === 0 && <span className="text-sm text-slate-400">No categories yet</span>}
        </div>
        <div className="flex gap-2 max-w-md">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategoryTop(); } }}
            placeholder="New category name"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={handleAddCategoryTop} disabled={addingCategory || !newCategory.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-1">
            {addingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
          <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No marketplace products yet</p>
          <p className="text-sm mt-1">Add your first product to show up in the marketplace</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
                <th className="px-5 py-3 font-medium text-right">Discount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={imgSrc(p.images[0])} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={14} className="text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{p.category}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatCurrency(parseFloat(p.price))}</td>
                  <td className="px-5 py-3 text-right">
                    {parseInt(p.discount) > 0 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{p.discount}% OFF</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, product: p })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Delete this product?")) remove(p.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <ProductModal
          product={modal.product}
          categories={categories}
          onCategoryAdded={addCategory}
          onClose={() => setModal({ open: false })}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["marketplace-products"] })}
        />
      )}
    </div>
    </SuperAdminGate>
  );
}
