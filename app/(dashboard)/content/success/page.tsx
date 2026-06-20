"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getCategories, deleteSuccessStory } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { imgSrc } from "@/lib/utils";
import { Plus, Trophy, Loader2, Trash2, X, Upload, Settings, Video, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

interface SuccessStory { id: string; name: string; designation?: string; brand?: string; earning?: string; status: string; createdAt: string; imageLink?: string; coverPhoto?: string; }
interface Category { id: string; name: string; }
interface LiveFAQ { question: string; answer: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SuccessPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [hunarImages, setHunarImages] = useState<string[]>([]);
  const [hunarImageFile, setHunarImageFile] = useState<File | null>(null);
  const [uploadingHunarImage, setUploadingHunarImage] = useState(false);
  const hunarImageInputRef = useRef<HTMLInputElement>(null);
  const [hunarTitle, setHunarTitle] = useState("");
  const [hunarSubtitle, setHunarSubtitle] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [liveOffline, setLiveOffline] = useState<LiveFAQ[]>([]);
  const [liveOnline, setLiveOnline] = useState<LiveFAQ[]>([]);
  const [savingLiveFaqs, setSavingLiveFaqs] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["success-stories"],
    queryFn: async () => {
      const { data } = await api.get("/success");
      const raw = data?.data;
      return (Array.isArray(raw) ? raw : raw?.category_data ?? []) as SuccessStory[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await getCategories();
      return (data?.data || []) as Category[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings-success"],
    queryFn: async () => {
      const { data } = await api.get("/site-settings?keys=success_hunar_title,success_hunar_subtitle,success_hero_video,success_hunar_images,live_offline_faqs,live_online_faqs");
      return data?.data || {};
    },
    onSuccess: (d: any) => {
      if (d.success_hunar_title) setHunarTitle(d.success_hunar_title);
      if (d.success_hunar_subtitle) setHunarSubtitle(d.success_hunar_subtitle);
      try { if (d.live_offline_faqs) setLiveOffline(JSON.parse(d.live_offline_faqs)); } catch {}
      try { if (d.live_online_faqs) setLiveOnline(JSON.parse(d.live_online_faqs)); } catch {}
    },
  } as any);

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (fd: FormData) => api.post("/adminpanel/success", fd, { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      toast.success("Success story added");
      queryClient.invalidateQueries({ queryKey: ["success-stories"] });
      setShowModal(false);
      setImageFile(null);
      setCoverFile(null);
      formRef.current?.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create"),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteSuccessStory(id),
    onSuccess: () => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["success-stories"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile || !coverFile) { toast.error("Both image and cover photo are required"); return; }
    const form = e.currentTarget;
    const fd = new FormData();
    fd.append("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    fd.append("description", (form.elements.namedItem("description") as HTMLTextAreaElement).value);
    fd.append("brand", (form.elements.namedItem("brand") as HTMLInputElement).value);
    fd.append("earning", (form.elements.namedItem("earning") as HTMLInputElement).value);
    fd.append("categoryId", (form.elements.namedItem("categoryId") as HTMLSelectElement).value);
    fd.append("image", imageFile);
    fd.append("coverPhoto", coverFile);
    create(fd);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await Promise.all([
        api.post("/adminpanel/site-settings", { key: "success_hunar_title", value: hunarTitle }),
        api.post("/adminpanel/site-settings", { key: "success_hunar_subtitle", value: hunarSubtitle }),
      ]);
      toast.success("Page settings saved");
      queryClient.invalidateQueries({ queryKey: ["site-settings-success"] });
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const saveLiveFaqs = async () => {
    setSavingLiveFaqs(true);
    try {
      await Promise.all([
        api.post("/adminpanel/site-settings", { key: "live_offline_faqs", value: JSON.stringify(liveOffline) }),
        api.post("/adminpanel/site-settings", { key: "live_online_faqs", value: JSON.stringify(liveOnline) }),
      ]);
      toast.success("Live event FAQs saved");
      queryClient.invalidateQueries({ queryKey: ["site-settings-success"] });
    } catch {
      toast.error("Failed to save live FAQs");
    } finally {
      setSavingLiveFaqs(false);
    }
  };

  const uploadHeroVideo = async () => {
    if (!videoFile) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append("key", "success_hero_video");
      fd.append("video", videoFile);
      await api.post("/adminpanel/site-settings/video", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Hero video updated");
      setVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ["site-settings-success"] });
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const fetchHunarImages = async () => {
    try {
      const { data } = await api.get("/site-settings?keys=success_hunar_images");
      const val = data?.data?.success_hunar_images;
      if (val) {
        try { setHunarImages(JSON.parse(val)); } catch { setHunarImages([]); }
      } else {
        setHunarImages([]);
      }
    } catch {}
  };

  useEffect(() => { fetchHunarImages(); }, []);

  const uploadHunarImage = async () => {
    if (!hunarImageFile) return;
    setUploadingHunarImage(true);
    try {
      // Upload image first (neutral key, no append) to get the URL
      const fd = new FormData();
      fd.append("key", "success_hunar_img_upload");
      fd.append("image", hunarImageFile);
      const uploadRes = await api.post("/adminpanel/site-settings/image", fd);
      const newUrl = uploadRes.data?.url;
      if (!newUrl) throw new Error("No URL returned from upload");

      // Save updated array via setSiteSetting
      const updated = [...hunarImages, newUrl];
      await api.post("/adminpanel/site-settings", { key: "success_hunar_images", value: JSON.stringify(updated) });

      toast.success("Image added to gallery");
      setHunarImageFile(null);
      if (hunarImageInputRef.current) hunarImageInputRef.current.value = "";
      await fetchHunarImages();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploadingHunarImage(false);
    }
  };

  const removeHunarImage = async (url: string) => {
    if (!confirm("Remove this image?")) return;
    try {
      const updated = hunarImages.filter((u) => u !== url);
      await api.post("/adminpanel/site-settings", { key: "success_hunar_images", value: JSON.stringify(updated) });
      toast.success("Image removed");
      await fetchHunarImages();
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const items = data || [];
  const currentVideo = (settings as any)?.success_hero_video;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Add Story
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-indigo-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400"><Trophy size={36} className="mx-auto mb-3 opacity-30" /><p className="font-medium">No success stories yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Images</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Earning</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {s.imageLink && (
                        <img src={imgSrc(s.imageLink)} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      {s.coverPhoto && (
                        <img src={imgSrc(s.coverPhoto)} alt="Cover" className="w-16 h-10 rounded object-cover border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.brand || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{s.earning || "—"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-slate-500">{s.createdAt ? formatDate(s.createdAt) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { if (confirm("Delete this story?")) remove(s.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Page Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Settings size={16} /> Page Settings</h2>

        <div className="grid grid-cols-1 gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section Title ("Desh Bhar Mein Hunar")</label>
            <input
              value={hunarTitle}
              onChange={(e) => setHunarTitle(e.target.value)}
              placeholder="Desh Bhar Mein Hunar"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section Subtitle</label>
            <input
              value={hunarSubtitle}
              onChange={(e) => setHunarSubtitle(e.target.value)}
              placeholder="With our support, 50,000+ Indian's are learning and earning."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="self-start bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2">
            {savingSettings && <Loader2 size={14} className="animate-spin" />}
            Save Text Settings
          </button>
        </div>

        <div className="border-t border-slate-100 pt-5 max-w-2xl">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Video size={14} /> Hero Video (replaces default video on success stories page)</label>
          {currentVideo && (
            <p className="text-xs text-emerald-600 mb-2">✓ Custom video is set — <a href={currentVideo.startsWith('/') ? `${API_URL}${currentVideo}` : currentVideo} target="_blank" rel="noopener noreferrer" className="underline">view</a></p>
          )}
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500 mb-2">
            <Upload size={14} />
            {videoFile ? videoFile.name : "Upload video file (MP4, max 500MB)"}
            <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
          </label>
          <button onClick={uploadHeroVideo} disabled={!videoFile || uploadingVideo} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2">
            {uploadingVideo && <Loader2 size={14} className="animate-spin" />}
            {uploadingVideo ? "Uploading..." : "Upload Video"}
          </button>
        </div>

        <div className="border-t border-slate-100 pt-5 max-w-2xl">
          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><ImageIcon size={14} /> Hunar Section Images (gallery slideshow)</label>
          {hunarImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {hunarImages.map((url, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                  <img src={imgSrc(url)} alt={`Hunar ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeHunarImage(url)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-center">
            <label className="flex-1 flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
              <Upload size={14} />
              {hunarImageFile ? hunarImageFile.name : "Upload image for gallery"}
              <input ref={hunarImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setHunarImageFile(e.target.files?.[0] || null)} />
            </label>
            <button onClick={uploadHunarImage} disabled={!hunarImageFile || uploadingHunarImage} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2 flex-shrink-0">
              {uploadingHunarImage && <Loader2 size={14} className="animate-spin" />}
              {uploadingHunarImage ? "Uploading..." : "Add Image"}
            </button>
          </div>
        </div>
      </div>

      {/* Skillocraft Live — Why attend FAQs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Settings size={16} /> Skillocraft Live — &quot;Why you should attend&quot; FAQs</h2>
          <p className="text-xs text-slate-400 mt-1">These show as two columns on the Skillocraft Live page. Add a question (heading) and its answer.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {([
            { label: "Why attend Offline events", list: liveOffline, setList: setLiveOffline },
            { label: "Why attend Online events", list: liveOnline, setList: setLiveOnline },
          ] as const).map(({ label, list, setList }) => (
            <div key={label} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
              {list.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2 relative">
                  <button
                    onClick={() => setList(list.filter((_, i) => i !== idx))}
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                  <input
                    value={item.question}
                    onChange={(e) => setList(list.map((it, i) => i === idx ? { ...it, question: e.target.value } : it))}
                    placeholder="Heading / question"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-7"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => setList(list.map((it, i) => i === idx ? { ...it, answer: e.target.value } : it))}
                    placeholder="Answer / details"
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => setList([...list, { question: "", answer: "" }])}
                className="w-full border border-dashed border-slate-300 rounded-lg py-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Add point
              </button>
            </div>
          ))}
        </div>

        <button onClick={saveLiveFaqs} disabled={savingLiveFaqs} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2">
          {savingLiveFaqs && <Loader2 size={14} className="animate-spin" />}
          Save Live FAQs
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add Success Story</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input name="name" required placeholder="e.g. Priya Sharma"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea name="description" required rows={3} placeholder="Their success story..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                  <input name="brand" required placeholder="e.g. Google"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Earning *</label>
                  <input name="earning" required placeholder="e.g. ₹5 LPA"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select name="categoryId" required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select category</option>
                  {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Profile Image *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {imageFile ? imageFile.name : "Upload profile photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cover Photo *</label>
                <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
                  <Upload size={14} />
                  {coverFile ? coverFile.name : "Upload cover photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
