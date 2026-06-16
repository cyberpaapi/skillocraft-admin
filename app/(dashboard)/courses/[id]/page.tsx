"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourse, updateCourse, createProduct, deleteProductVideo, api,
  getUploadUrl, uploadToR2, confirmUpload, startHls, reorderLessons,
  getCourseFaqs, createCourseFaq, deleteCourseFaq,
  adminAddReview, adminDeleteReview,
  getCourseDownloads, addCourseDownload, deleteCourseDownload,
} from "@/lib/api";
import { imgSrc } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Video, Loader2, Upload, X, FileText, Layers,
  Zap, CheckCircle, AlertCircle, GripVertical, FolderOpen, Save,
  Image as ImageIcon, Star, MessageSquare, HelpCircle, Edit2, Download,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type LessonType = "VIDEO" | "TEXT" | "BOTH";

interface Product {
  id: string;
  name: string;
  videoStatus?: string;
  discription?: string;
  lessonType?: LessonType;
  videoLink?: string;
  textContent?: string;
  thumbnail?: string;
  status: string;
  order?: number;
}

interface ReviewData {
  id: string;
  details: string;
  ratting: number;
  reviewerName?: string;
  customer?: { id: string; name: string };
  createdAt: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface CourseDownload {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
  price: number;
  discountedPrice?: string | null;
  language?: string;
  status: string;
  shortDescription?: string;
  imageLink?: string;
  teaserVideo?: string;
  products?: Product[];
  reviews?: { count: number; data: ReviewData[] };
}

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "VIDEO", label: "Video", icon: <Video size={15} />, desc: "Upload an MP4 video file" },
  { value: "TEXT", label: "Text / Article", icon: <FileText size={15} />, desc: "Write text or notes" },
  { value: "BOTH", label: "Video + Text", icon: <Layers size={15} />, desc: "Video with written notes" },
];

type UploadPhase = "idle" | "creating" | "uploading" | "done";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}>
          <Star size={18} className={s <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
        </button>
      ))}
    </div>
  );
}

function AddLessonModal({ courseId, onClose, onSuccess }: { courseId: string; onClose: () => void; onSuccess: () => void }) {
  const [lessonType, setLessonType] = useState<LessonType>("VIDEO");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadPct, setUploadPct] = useState(0);

  const needsVideo = lessonType === "VIDEO" || lessonType === "BOTH";
  const needsText  = lessonType === "TEXT"  || lessonType === "BOTH";
  const busy = phase !== "idle";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsVideo && !videoFile) { toast.error("Please select a video file"); return; }
    if (needsText && !textContent.trim()) { toast.error("Please enter text content"); return; }

    const form = e.currentTarget;
    const name        = (form.elements.namedItem("name") as HTMLInputElement).value;
    const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;

    try {
      setPhase("creating");
      const { data: created } = await createProduct({ courseId, name, description, lessonType, textContent: textContent || undefined });
      const productId = created?.data?.id;
      if (!productId) throw new Error("No product ID returned");

      if (videoFile && needsVideo) {
        setPhase("uploading");
        setUploadPct(0);
        const { data: urlData } = await getUploadUrl(productId, videoFile.name, videoFile.type || "video/mp4");
        await uploadToR2(urlData.putUrl, videoFile, setUploadPct);
        await confirmUpload(productId);
      }

      setPhase("done");
      toast.success("Lesson added!");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add lesson");
      setPhase("idle");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800 text-lg">Add Lesson</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {LESSON_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setLessonType(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                    lessonType === t.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}>
                  {t.icon}<span>{t.label}</span>
                  <span className={`text-[10px] font-normal ${lessonType === t.value ? "text-indigo-500" : "text-slate-400"}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Name *</label>
            <input name="name" required placeholder="e.g. Introduction to Baking"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" rows={2} placeholder="What will students learn?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          {needsVideo && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video File {lessonType === "BOTH" ? "" : "*"}</label>
              <label className="cursor-pointer block">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${videoFile ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-400"}`}>
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                      <Video size={16} /><p className="text-sm font-medium truncate max-w-xs">{videoFile.name}</p>
                    </div>
                  ) : (
                    <><Upload size={20} className="mx-auto mb-1 text-slate-400" /><p className="text-xs text-slate-500">Click to upload video (MP4)</p></>
                  )}
                </div>
                <input type="file" accept="video/*,video/mp4" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}

          {needsText && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Text Content {lessonType === "BOTH" ? "" : "*"}</label>
              <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={8}
                placeholder="Write your lesson content here..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono" />
            </div>
          )}

          {phase !== "idle" && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-2">
              {phase === "creating" && <div className="flex items-center gap-2 text-indigo-700 text-sm"><Loader2 size={14} className="animate-spin" /><span>Creating lesson...</span></div>}
              {phase === "uploading" && (
                <>
                  <div className="flex justify-between text-xs font-medium text-indigo-700"><span>Uploading...</span><span>{uploadPct}%</span></div>
                  <div className="w-full bg-indigo-100 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} /></div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={busy}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy && <Loader2 size={14} className="animate-spin" />}
              {phase === "creating" ? "Creating..." : phase === "uploading" ? `Uploading ${uploadPct}%` : "Add Lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAddLesson, setShowAddLesson] = useState(false);

  // Drag-and-drop reorder state
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Folder upload state
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [folderUploading, setFolderUploading] = useState(false);
  const [folderProgress, setFolderProgress] = useState({ done: 0, total: 0 });

  // Media edit state
  const imageInputRef = useRef<HTMLInputElement>(null);
  const teaserInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingTeaserFile, setPendingTeaserFile] = useState<File | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [savingTeaser, setSavingTeaser] = useState(false);

  // FAQ state
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [addingFaq, setAddingFaq] = useState(false);

  // Review state
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [addingReview, setAddingReview] = useState(false);

  // Lesson thumbnail upload state
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbId, setUploadingThumbId] = useState<string | null>(null);
  const [pendingThumbLessonId, setPendingThumbLessonId] = useState<string | null>(null);

  // DLC state
  const [dlcFile, setDlcFile] = useState<File | null>(null);
  const [uploadingDlc, setUploadingDlc] = useState(false);
  const dlcInputRef = useRef<HTMLInputElement>(null);

  // General settings edit state
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscountedPrice, setEditDiscountedPrice] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [settingsInitialized, setSettingsInitialized] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data } = await getCourse(id);
      return data?.data as Course;
    },
    refetchInterval: (query) => {
      const products = (query.state.data as Course | undefined)?.products ?? [];
      return products.some(p => p.videoStatus === "converting") ? 8000 : false;
    },
  });

  const { data: faqsData, refetch: refetchFaqs } = useQuery({
    queryKey: ["course-faqs", id],
    queryFn: async () => {
      const { data } = await getCourseFaqs(id);
      return (data?.data || []) as FAQ[];
    },
  });
  const faqs = faqsData || [];

  const { data: downloadsData, refetch: refetchDownloads } = useQuery({
    queryKey: ["course-downloads", id],
    queryFn: async () => {
      const { data } = await getCourseDownloads(id);
      return (data?.data || []) as CourseDownload[];
    },
  });
  const downloads = downloadsData || [];

  // Sync ordered list when server data changes
  useEffect(() => {
    if (data?.products && dragIndex === null) {
      const sorted = [...data.products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedProducts(sorted);
    }
  }, [data?.products, dragIndex]);

  // Initialize general settings from fetched course data (once)
  useEffect(() => {
    if (data && !settingsInitialized) {
      setEditName(data.name || "");
      setEditPrice(String(data.price || ""));
      setEditDiscountedPrice(data.discountedPrice || "");
      setEditLanguage(data.language || "");
      setEditShortDesc(data.shortDescription || "");
      setEditStatus(data.status || "ACTIVE");
      setSettingsInitialized(true);
    }
  }, [data, settingsInitialized]);

  const handleDragStart = (i: number) => setDragIndex(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...orderedProducts];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setDragIndex(i);
    setOrderedProducts(next);
    setOrderChanged(true);
  };
  const handleDragEnd = () => setDragIndex(null);

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderLessons(orderedProducts.map((p, i) => ({ id: p.id, order: i })));
      toast.success("Order saved");
      setOrderChanged(false);
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch { toast.error("Failed to save order"); }
    finally { setSavingOrder(false); }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);
    const videoFiles = allFiles.filter(f => f.type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(f.name));
    if (videoFiles.length === 0) { toast.error("No video files found in folder"); return; }
    setFolderUploading(true);
    setFolderProgress({ done: 0, total: videoFiles.length });
    let done = 0;
    for (const file of videoFiles) {
      try {
        const lessonName = file.name.replace(/\.[^.]+$/, "");
        const { data: created } = await createProduct({ courseId: id, name: lessonName, description: "", lessonType: "VIDEO" });
        const productId = created?.data?.id;
        if (productId) {
          const { data: urlData } = await getUploadUrl(productId, file.name, file.type || "video/mp4");
          await uploadToR2(urlData.putUrl, file, () => {});
          await confirmUpload(productId);
        }
      } catch (err) { console.error(`Failed to upload ${file.name}:`, err); }
      done++;
      setFolderProgress({ done, total: videoFiles.length });
    }
    toast.success(`Uploaded ${done} of ${videoFiles.length} videos`);
    setFolderUploading(false);
    queryClient.invalidateQueries({ queryKey: ["course", id] });
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const saveImage = async () => {
    if (!pendingImageFile) return;
    setSavingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", pendingImageFile);
      await updateCourse(id, fd);
      toast.success("Image updated");
      setPendingImageFile(null);
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch { toast.error("Failed to update image"); }
    finally { setSavingImage(false); }
  };

  const saveTeaser = async () => {
    if (!pendingTeaserFile) return;
    setSavingTeaser(true);
    try {
      const fd = new FormData();
      fd.append("teaserVideo", pendingTeaserFile);
      await updateCourse(id, fd);
      toast.success("Teaser video updated");
      setPendingTeaserFile(null);
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch { toast.error("Failed to update teaser"); }
    finally { setSavingTeaser(false); }
  };

  const handleAddFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) { toast.error("Question and answer are required"); return; }
    setAddingFaq(true);
    try {
      await createCourseFaq(id, faqQuestion.trim(), faqAnswer.trim());
      toast.success("FAQ added");
      setFaqQuestion("");
      setFaqAnswer("");
      refetchFaqs();
    } catch { toast.error("Failed to add FAQ"); }
    finally { setAddingFaq(false); }
  };

  const handleDeleteFaq = async (faqId: string) => {
    try {
      await deleteCourseFaq(faqId);
      toast.success("FAQ deleted");
      refetchFaqs();
    } catch { toast.error("Failed to delete FAQ"); }
  };

  const handleAddReview = async () => {
    if (!reviewText.trim()) { toast.error("Review text is required"); return; }
    setAddingReview(true);
    try {
      await adminAddReview(id, { reviewerName: reviewName.trim() || "Anonymous", details: reviewText.trim(), ratting: reviewRating });
      toast.success("Review added");
      setReviewName("");
      setReviewText("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch { toast.error("Failed to add review"); }
    finally { setAddingReview(false); }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await adminDeleteReview(reviewId);
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch { toast.error("Failed to delete review"); }
  };

  const handleUploadDlc = async () => {
    if (!dlcFile) return;
    setUploadingDlc(true);
    try {
      const fd = new FormData();
      fd.append("file", dlcFile);
      await addCourseDownload(id, fd);
      toast.success("File uploaded");
      setDlcFile(null);
      if (dlcInputRef.current) dlcInputRef.current.value = "";
      refetchDownloads();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload file");
    } finally {
      setUploadingDlc(false);
    }
  };

  const handleDeleteDlc = async (downloadId: string) => {
    try {
      await deleteCourseDownload(downloadId);
      toast.success("File deleted");
      refetchDownloads();
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const { mutate: removeVideo } = useMutation({
    mutationFn: (productId: string) => deleteProductVideo(productId),
    onSuccess: () => { toast.success("Video removed"); queryClient.invalidateQueries({ queryKey: ["course", id] }); },
    onError: () => toast.error("Failed to remove video"),
  });

  const { mutate: convertHls } = useMutation({
    mutationFn: (productId: string) => startHls(productId),
    onSuccess: () => { toast.success("HLS conversion started"); queryClient.invalidateQueries({ queryKey: ["course", id] }); },
    onError: () => toast.error("Failed to start HLS conversion"),
  });

  const { mutate: removeProduct } = useMutation({
    mutationFn: (productId: string) => api.delete(`/adminpanel/products/${productId}`),
    onSuccess: () => { toast.success("Lesson deleted"); queryClient.invalidateQueries({ queryKey: ["course", id] }); },
    onError: () => toast.error("Failed to delete lesson"),
  });

  const handleThumbUpload = async (file: File, lessonId: string) => {
    setUploadingThumbId(lessonId);
    try {
      const fd = new FormData();
      fd.append("thumbnail", file);
      await api.post(`/adminpanel/products/${lessonId}/thumbnail`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Thumbnail uploaded");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch {
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploadingThumbId(null);
      setPendingThumbLessonId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!editName.trim() || !editPrice) { toast.error("Name and price are required"); return; }
    setSavingSettings(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      fd.append("price", editPrice);
      if (editDiscountedPrice) fd.append("discountedPrice", editDiscountedPrice);
      else fd.append("discountedPrice", "");
      if (editLanguage) fd.append("language", editLanguage);
      if (editShortDesc) fd.append("shortDescription", editShortDesc);
      fd.append("status", editStatus);
      await updateCourse(id, fd);
      toast.success("Course settings saved");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>;
  if (!data) return <div className="text-center py-16 text-slate-400"><p>Course not found</p><Link href="/courses" className="text-indigo-600 text-sm mt-2 inline-block">← Back</Link></div>;

  const reviews = data.reviews?.data || [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{data.name}</h1>
            <p className="text-sm text-slate-500">₹{data.price} · {data.status}</p>
          </div>
        </div>
      </div>

      {/* ── Media: Image + Teaser ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={16} /> Media</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Course Image */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Course Image</p>
            <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-3">
              {(pendingImageFile || data.imageLink) ? (
                <img
                  src={pendingImageFile ? URL.createObjectURL(pendingImageFile) : imgSrc(data.imageLink)}
                  alt="Course" className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={32} /></div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => imageInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-sm py-1.5 rounded-lg hover:bg-slate-50">
                <Upload size={13} /> {data.imageLink ? "Change" : "Upload"}
              </button>
              {pendingImageFile && (
                <button onClick={saveImage} disabled={savingImage}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-60">
                  {savingImage ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setPendingImageFile(e.target.files?.[0] || null)} />
          </div>

          {/* Teaser Video */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Teaser Video</p>
            <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-3 flex items-center justify-center">
              {pendingTeaserFile ? (
                <div className="text-center p-4">
                  <Video size={24} className="mx-auto mb-1 text-indigo-500" />
                  <p className="text-xs text-slate-600 truncate max-w-full">{pendingTeaserFile.name}</p>
                </div>
              ) : data.teaserVideo ? (
                <div className="text-center p-4">
                  <CheckCircle size={24} className="mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs text-emerald-600">Teaser video set</p>
                </div>
              ) : (
                <div className="text-center p-4 text-slate-300">
                  <Video size={32} className="mx-auto mb-1" />
                  <p className="text-xs">No teaser video</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => teaserInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-sm py-1.5 rounded-lg hover:bg-slate-50">
                <Upload size={13} /> {data.teaserVideo ? "Change" : "Upload"}
              </button>
              {pendingTeaserFile && (
                <button onClick={saveTeaser} disabled={savingTeaser}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-500 disabled:opacity-60">
                  {savingTeaser ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
              )}
            </div>
            <input ref={teaserInputRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => setPendingTeaserFile(e.target.files?.[0] || null)} />
          </div>
        </div>
      </div>

      {/* ── General Settings ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Edit2 size={16} /> General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Course Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} placeholder="Course name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Price (₹)</label>
              <input type="number" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputClass} placeholder="999" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Discounted Price (₹)
                {editPrice && editDiscountedPrice && parseFloat(editDiscountedPrice) < parseFloat(editPrice) && (
                  <span className="ml-2 text-green-600 normal-case font-semibold">
                    {Math.round((1 - parseFloat(editDiscountedPrice) / parseFloat(editPrice)) * 100)}% off
                  </span>
                )}
              </label>
              <input type="number" min="0" value={editDiscountedPrice} onChange={(e) => setEditDiscountedPrice(e.target.value)} className={inputClass} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Language</label>
              <input value={editLanguage} onChange={(e) => setEditLanguage(e.target.value)} className={inputClass} placeholder="Hindi" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputClass}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Short Description</label>
            <textarea value={editShortDesc} onChange={(e) => setEditShortDesc(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Brief overview" />
          </div>
          <button onClick={handleSaveSettings} disabled={savingSettings}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-60">
            {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* ── Lessons ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-800">Lessons ({orderedProducts.length})</h2>
            {orderChanged && <span className="text-xs text-amber-600 font-medium">Unsaved order</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {orderChanged && (
              <button onClick={saveOrder} disabled={savingOrder}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60">
                {savingOrder ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Order
              </button>
            )}
            <button onClick={() => folderInputRef.current?.click()} disabled={folderUploading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60">
              {folderUploading ? <><Loader2 size={14} className="animate-spin" /> {folderProgress.done}/{folderProgress.total}</> : <><FolderOpen size={14} /> Upload Folder</>}
            </button>
            <input ref={folderInputRef} type="file" className="hidden"
              // @ts-ignore
              webkitdirectory="" multiple onChange={handleFolderUpload} />
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && pendingThumbLessonId) handleThumbUpload(file, pendingThumbLessonId);
                e.target.value = "";
              }} />
            <button onClick={() => setShowAddLesson(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Plus size={16} /> Add Lesson
            </button>
          </div>
        </div>

        {orderedProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Video size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No lessons yet</p>
            <button onClick={() => setShowAddLesson(true)}
              className="mt-4 flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg mx-auto hover:bg-indigo-500">
              <Plus size={14} /> Add First Lesson
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orderedProducts.map((product, i) => (
              <div key={product.id} draggable onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd}
                className={`px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-grab active:cursor-grabbing ${dragIndex === i ? "opacity-50 bg-indigo-50" : ""}`}>
                <div className="flex items-center gap-4">
                  <GripVertical size={16} className="text-slate-300 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">{i + 1}</div>
                  {product.thumbnail ? (
                    <img src={imgSrc(product.thumbnail)} alt="" className="w-12 h-8 rounded object-cover border border-slate-200 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-8 rounded border border-dashed border-slate-200 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={12} className="text-slate-300" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                    {product.discription && <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{product.discription}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {product.lessonType === "TEXT" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><FileText size={10} /> Text</span>}
                  {product.lessonType === "BOTH" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"><Layers size={10} /> Video + Text</span>}
                  {(product.lessonType === "VIDEO" || product.lessonType === "BOTH" || !product.lessonType) && (
                    <>
                      {product.videoStatus === "hls_ready" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle size={10} /> HLS Ready</span>}
                      {product.videoStatus === "ready" && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><Video size={10} /> MP4</span>
                          <button onClick={() => convertHls(product.id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200">
                            <Zap size={10} /> Start HLS
                          </button>
                        </>
                      )}
                      {product.videoStatus === "converting" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Loader2 size={10} className="animate-spin" /> Converting...</span>}
                      {product.videoStatus === "failed" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle size={10} /> Failed</span>}
                      {(!product.videoStatus || product.videoStatus === "idle" || product.videoStatus === "uploading") && (
                        product.videoLink ? (
                          <button onClick={() => confirmUpload(product.id).then(() => queryClient.invalidateQueries({ queryKey: ["course", id] }))}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200">
                            <Zap size={10} /> Mark Ready
                          </button>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">No video</span>
                        )
                      )}
                    </>
                  )}
                  <button
                    onClick={() => { setPendingThumbLessonId(product.id); thumbInputRef.current?.click(); }}
                    disabled={uploadingThumbId === product.id}
                    title="Upload thumbnail"
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-60"
                  >
                    {uploadingThumbId === product.id ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  </button>
                  <button onClick={() => { if (confirm("Delete this lesson?")) removeProduct(product.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAQs ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><HelpCircle size={16} /> FAQs ({faqs.length})</h2>
        </div>

        {faqs.length > 0 && (
          <div className="divide-y divide-slate-100">
            {faqs.map((faq) => (
              <div key={faq.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{faq.question}</p>
                  <p className="text-sm text-slate-500 mt-1">{faq.answer}</p>
                </div>
                <button onClick={() => { if (confirm("Delete this FAQ?")) handleDeleteFaq(faq.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add FAQ form */}
        <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-slate-50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add FAQ</p>
          <input value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)}
            placeholder="Question" className={inputClass} />
          <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)}
            placeholder="Answer" rows={2} className={`${inputClass} resize-none`} />
          <button onClick={handleAddFaq} disabled={addingFaq || !faqQuestion.trim() || !faqAnswer.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-60">
            {addingFaq ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add FAQ
          </button>
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Star size={16} /> Reviews ({reviews.length})</h2>
        </div>

        {reviews.length > 0 && (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-slate-800">
                      {review.reviewerName || review.customer?.name || "Anonymous"}
                    </p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} className={s <= review.ratting ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{review.details}</p>
                </div>
                <button onClick={() => { if (confirm("Delete this review?")) handleDeleteReview(review.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Review form */}
        <div className="px-6 py-5 border-t border-slate-100 space-y-3 bg-slate-50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add Review</p>
          <input value={reviewName} onChange={(e) => setReviewName(e.target.value)}
            placeholder="Reviewer name (optional)" className={inputClass} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Rating:</span>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
            placeholder="Review text" rows={2} className={`${inputClass} resize-none`} />
          <button onClick={handleAddReview} disabled={addingReview || !reviewText.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-60">
            {addingReview ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Review
          </button>
        </div>
      </div>

      {/* ── Downloadable Content ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Download size={16} /> Downloadable Content ({downloads.length})</h2>
          <p className="text-xs text-slate-400 mt-0.5">Files available to enrolled students</p>
        </div>

        {downloads.length > 0 && (
          <div className="divide-y divide-slate-100">
            {downloads.map((dl) => (
              <div key={dl.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{dl.fileName}</p>
                    {dl.fileSize && <p className="text-xs text-slate-400">{dl.fileSize}</p>}
                  </div>
                </div>
                <button onClick={() => { if (confirm(`Delete "${dl.fileName}"?`)) handleDeleteDlc(dl.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add Downloadable File</p>
          <div className="flex gap-3 items-center">
            <label className="flex-1 flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-indigo-400 text-sm text-slate-500">
              <Upload size={14} />
              {dlcFile ? <span className="text-indigo-600 font-medium truncate">{dlcFile.name}</span> : "Click to select file (PDF, ZIP, etc.)"}
              <input ref={dlcInputRef} type="file" className="hidden" onChange={(e) => setDlcFile(e.target.files?.[0] || null)} />
            </label>
            <button onClick={handleUploadDlc} disabled={!dlcFile || uploadingDlc}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2 flex-shrink-0">
              {uploadingDlc && <Loader2 size={14} className="animate-spin" />}
              {uploadingDlc ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>

      {showAddLesson && (
        <AddLessonModal courseId={id} onClose={() => setShowAddLesson(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["course", id] })} />
      )}
    </div>
  );
}
