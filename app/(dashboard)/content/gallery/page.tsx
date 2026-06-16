"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createGallery, deleteGallery } from "@/lib/api";
import { api } from "@/lib/api";
import { Plus, Image as ImageIcon, Loader2, X, Upload, Trash2, Pencil } from "lucide-react";
import { imgSrc } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

interface GalleryItem { id: string; imageLink: string; image?: string; description?: string; linkUrl?: string; status: string; }
interface LogoItem { url: string; link: string; }

function GalleryModal({
  item,
  onClose,
  onSuccess,
}: {
  item?: GalleryItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item && !imageFile) { toast.error("Please select an image"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    if (imageFile) fd.append("image", imageFile);
    const desc = (form.elements.namedItem("description") as HTMLInputElement).value;
    if (desc) fd.append("description", desc);
    const link = (form.elements.namedItem("linkUrl") as HTMLInputElement).value;
    if (link) fd.append("linkUrl", link);

    setSubmitting(true);
    try {
      if (item) {
        await api.put(`/adminpanel/feature-gallery/${item.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Item updated");
      } else {
        await createGallery(fd);
        toast.success("Image added");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{item ? "Edit Award" : "Add Award"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image {!item && "*"}</label>
            {item && (
              <img src={imgSrc(item.imageLink || item.image)} alt="" className="w-full h-32 object-cover rounded-lg mb-2 border border-slate-200" />
            )}
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
              <Upload size={18} className="text-slate-400" />
              {imageFile ? <span className="text-indigo-600 font-medium">{imageFile.name}</span> : <span>{item ? "Upload new image (optional)" : "Click to upload image"}</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Caption (optional)</label>
            <input name="description" defaultValue={item?.description || ""} placeholder="e.g. Award ceremony 2024"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link URL (optional)</label>
            <input name="linkUrl" type="url" defaultValue={item?.linkUrl || ""} placeholder="https://example.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-slate-400 mt-1">When visitors click this image, they&apos;ll open this link</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Saving..." : item ? "Save Changes" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; item?: GalleryItem }>({ open: false });

  // Logos (SiteSettings)
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoLink, setLogoLink] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchLogos = async () => {
    try {
      const { data } = await api.get('/site-settings?keys=awards_logos');
      const val = data?.data?.awards_logos;
      if (val) {
        try {
          const parsed = JSON.parse(val);
          const normalized: LogoItem[] = (Array.isArray(parsed) ? parsed : []).map((item: any) =>
            typeof item === 'string' ? { url: item, link: '' } : { url: item.url || '', link: item.link || '' }
          );
          setLogos(normalized);
        } catch { setLogos([]); }
      } else {
        setLogos([]);
      }
    } catch {}
  };

  useEffect(() => { fetchLogos(); }, []);

  const uploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      // Upload image to R2, use a neutral key so it doesn't clobber awards_logos
      const fd = new FormData();
      fd.append('image', logoFile);
      fd.append('key', 'awards_logo_upload');
      const uploadRes = await api.post('/adminpanel/site-settings/image', fd);
      const newUrl = uploadRes.data?.url;
      if (!newUrl) throw new Error('No URL returned from upload');

      // Save updated logos array (objects) via setSiteSetting
      const updated: LogoItem[] = [...logos, { url: newUrl, link: logoLink.trim() }];
      await api.post('/adminpanel/site-settings', { key: 'awards_logos', value: JSON.stringify(updated) });

      toast.success('Logo added');
      setLogoFile(null);
      setLogoLink('');
      if (logoInputRef.current) logoInputRef.current.value = '';
      await fetchLogos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async (url: string) => {
    if (!confirm('Remove this logo?')) return;
    try {
      const updated = logos.filter(l => l.url !== url);
      await api.post('/adminpanel/site-settings', { key: 'awards_logos', value: JSON.stringify(updated) });
      toast.success('Removed');
      await fetchLogos();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await api.get("/feature-gallery");
      return (data?.data || []) as GalleryItem[];
    },
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["gallery"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Awards &amp; Achievements</h1>
          <p className="text-sm text-slate-500">{items.length} items</p>
        </div>
        <button onClick={() => setModal({ open: true })} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Award
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-200"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200"><ImageIcon size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No awards yet</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const src = imgSrc(item.imageLink || item.image);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group relative">
                <div className="aspect-square">
                  <img src={src} alt={item.description || ""} className="w-full h-full object-cover" />
                </div>
                {item.description && (
                  <div className="px-3 py-2 text-xs text-slate-600 font-medium truncate border-t border-slate-100">{item.description}</div>
                )}
                {item.linkUrl && (
                  <div className="px-3 pb-2 text-xs text-indigo-500 truncate">🔗 {item.linkUrl}</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal({ open: true, item })} className="bg-white text-slate-600 p-1.5 rounded-lg shadow hover:text-indigo-600 border border-slate-200">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => { if (confirm("Delete this award?")) remove(item.id); }} className="bg-red-600 text-white p-1.5 rounded-lg shadow">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Logos Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Logos</h2>
            <p className="text-xs text-slate-500">Round logos shown linearly on the Awards section</p>
          </div>
        </div>

        {/* Existing logos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          {logos.length === 0 ? (
            <p className="text-sm text-slate-400">No logos yet. Upload one below.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {logos.map((logo, i) => (
                <div key={i} className="relative group flex flex-col items-center gap-1">
                  <div className="size-16 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm">
                    <img src={imgSrc(logo.url)} alt={`Logo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  {logo.link && (
                    <span className="text-xs text-indigo-500 max-w-[64px] truncate" title={logo.link}>🔗</span>
                  )}
                  <button
                    onClick={() => removeLogo(logo.url)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload new logo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 text-sm text-slate-500 transition-colors">
            <Upload size={16} className="text-slate-400 shrink-0" />
            {logoFile ? (
              <span className="text-indigo-600 font-medium truncate">{logoFile.name}</span>
            ) : (
              <span>Click to select a logo image (will be shown as circle)</span>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Link URL (optional)</label>
            <input
              type="url"
              value={logoLink}
              onChange={(e) => setLogoLink(e.target.value)}
              placeholder="https://example.com — clicking the logo opens this link"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={uploadLogo}
            disabled={!logoFile || uploadingLogo}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {uploadingLogo && <Loader2 size={14} className="animate-spin" />}
            {uploadingLogo ? "Uploading..." : "Add Logo"}
          </button>
        </div>
      </div>

      {modal.open && (
        <GalleryModal
          item={modal.item}
          onClose={() => setModal({ open: false })}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["gallery"] })}
        />
      )}
    </div>
  );
}
