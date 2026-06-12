"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency, imgSrc } from "@/lib/utils";
import { Plus, Trash2, Pencil, Loader2, X, Upload, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

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
  status: string;
}

const CATEGORIES = ["Baking", "Skincare", "Artificial Jewellery", "Hand Craft", "Makeup", "Perfume", "Healthcare", "Art & Craft", "Cooking", "Other"];

function ProductModal({
  product,
  onClose,
  onSuccess,
}: {
  product?: MarketplaceProduct;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [highlights, setHighlights] = useState<{ key: string; value: string }[]>(
    product?.highlights || [{ key: "", value: "" }]
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    fd.append("price", (form.elements.namedItem("price") as HTMLInputElement).value);
    fd.append("originalPrice", (form.elements.namedItem("originalPrice") as HTMLInputElement).value);
    fd.append("discount", (form.elements.namedItem("discount") as HTMLInputElement).value);
    fd.append("category", (form.elements.namedItem("category") as HTMLSelectElement).value);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
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
              <select name="category" required defaultValue={product?.category || "Other"} className={inputClass}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
  );
}

export default function MarketplacePage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; product?: MarketplaceProduct }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-products"],
    queryFn: async () => {
      const { data } = await api.get("/marketplace-products?limit=100&status=ACTIVE");
      return (data?.data || []) as MarketplaceProduct[];
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/adminpanel/marketplace-products/${id}`),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["marketplace-products"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const products = data || [];

  return (
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
          onClose={() => setModal({ open: false })}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["marketplace-products"] })}
        />
      )}
    </div>
  );
}
