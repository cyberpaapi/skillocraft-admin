"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourse, createProduct, deleteProductVideo, api, getUploadUrl, uploadToR2, confirmUpload, startHls } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Video, Loader2, Upload, X, FileText, Layers, Zap, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type LessonType = "VIDEO" | "TEXT" | "BOTH";

interface Product {
  id: string;
  name: string;
  videoStatus?: string;
  discription?: string;
  lessonType?: LessonType;
  videoLink?: string;
  textContent?: string;
  status: string;
  order?: number;
}

interface Course {
  id: string;
  name: string;
  price: number;
  status: string;
  shortDescription?: string;
  products?: Product[];
}

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "VIDEO", label: "Video", icon: <Video size={15} />, desc: "Upload an MP4 video file" },
  { value: "TEXT", label: "Text / Article", icon: <FileText size={15} />, desc: "Write text or notes" },
  { value: "BOTH", label: "Video + Text", icon: <Layers size={15} />, desc: "Video with written notes" },
];

type UploadPhase = "idle" | "creating" | "uploading" | "done";

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
      // Step 1 — create lesson record in DB
      setPhase("creating");
      const { data: created } = await createProduct({ courseId, name, description, lessonType, textContent: textContent || undefined });
      const productId = created?.data?.id;
      if (!productId) throw new Error("No product ID returned");

      // Step 2 — if video, upload directly to R2
      if (videoFile && needsVideo) {
        setPhase("uploading");
        setUploadPct(0);

        const { data: urlData } = await getUploadUrl(productId, videoFile.name, videoFile.type || "video/mp4");
        await uploadToR2(urlData.putUrl, videoFile, setUploadPct);
        await confirmUpload(productId);
      }

      setPhase("done");
      toast.success("Lesson added! Video is ready to play.");
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

          {/* Lesson Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {LESSON_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setLessonType(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                    lessonType === t.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
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

          {/* Video Upload */}
          {needsVideo && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Video File {lessonType === "BOTH" ? "" : "*"}
              </label>
              <label className="cursor-pointer block">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  videoFile ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-400"
                }`}>
                  {videoFile ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                      <Video size={16} />
                      <p className="text-sm font-medium truncate max-w-xs">{videoFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                      <p className="text-xs text-slate-500">Click to upload video (MP4, max 500MB)</p>
                      <p className="text-xs text-slate-400 mt-0.5">Stored locally during development</p>
                    </>
                  )}
                </div>
                <input type="file" accept="video/*,video/mp4" className="hidden"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}

          {/* Text Content Editor */}
          {needsText && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Text Content {lessonType === "BOTH" ? "" : "*"}
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                placeholder={`Write your lesson content here...\n\nYou can use plain text or basic markdown:\n# Heading\n**Bold** text\n- Bullet points`}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">Supports plain text. Markdown will be rendered for students.</p>
            </div>
          )}

          {phase !== "idle" && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-2">
              {phase === "creating" && (
                <div className="flex items-center gap-2 text-indigo-700 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating lesson...</span>
                </div>
              )}
              {phase === "uploading" && (
                <>
                  <div className="flex justify-between text-xs font-medium text-indigo-700">
                    <span>Uploading to storage...</span>
                    <span>{uploadPct}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} />
                  </div>
                  <p className="text-xs text-indigo-500">Uploading directly to Cloudflare — do not close this window</p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40">
              Cancel
            </button>
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddLesson, setShowAddLesson] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data } = await getCourse(id);
      return data?.data as Course;
    },
    // Poll every 8s while any lesson is converting
    refetchInterval: (query) => {
      const products = (query.state.data as Course | undefined)?.products ?? [];
      return products.some(p => p.videoStatus === "converting") ? 8000 : false;
    },
  });

  const { mutate: removeVideo } = useMutation({
    mutationFn: (productId: string) => deleteProductVideo(productId),
    onSuccess: () => {
      toast.success("Video removed");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    },
    onError: () => toast.error("Failed to remove video"),
  });

  const { mutate: convertHls } = useMutation({
    mutationFn: (productId: string) => startHls(productId),
    onSuccess: (_, productId) => {
      toast.success("HLS conversion started — check back in a few minutes");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    },
    onError: () => toast.error("Failed to start HLS conversion"),
  });

  const { mutate: removeProduct } = useMutation({
    mutationFn: (productId: string) => api.delete(`/adminpanel/products/${productId}`),
    onSuccess: () => {
      toast.success("Lesson deleted");
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    },
    onError: () => toast.error("Failed to delete lesson"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Course not found</p>
        <Link href="/courses" className="text-indigo-600 text-sm mt-2 inline-block">← Back to courses</Link>
      </div>
    );
  }

  const products = data.products || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/courses" className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{data.name}</h1>
            <p className="text-sm text-slate-500">₹{data.price} · {data.status}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddLesson(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Lesson
        </button>
      </div>

      {/* Course Info Card */}
      {data.shortDescription && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-600">{data.shortDescription}</p>
        </div>
      )}

      {/* Lessons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Lessons ({products.length})</h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Video size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No lessons yet</p>
            <p className="text-xs mt-1">Add your first lesson to get started</p>
            <button
              onClick={() => setShowAddLesson(true)}
              className="mt-4 flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg mx-auto hover:bg-indigo-500"
            >
              <Plus size={14} /> Add First Lesson
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {products.map((product, i) => (
              <div key={product.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{product.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {product.lessonType === "TEXT" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <FileText size={10} /> Text
                    </span>
                  ) : product.lessonType === "BOTH" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Layers size={10} /> Video + Text
                    </span>
                  ) : null}
                  {(product.lessonType === "VIDEO" || product.lessonType === "BOTH" || !product.lessonType) && (
                    <>
                      {product.videoStatus === "hls_ready" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle size={10} /> HLS Ready
                        </span>
                      )}
                      {product.videoStatus === "ready" && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Video size={10} /> MP4
                          </span>
                          <button
                            onClick={() => convertHls(product.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200"
                          >
                            <Zap size={10} /> Start HLS
                          </button>
                        </>
                      )}
                      {product.videoStatus === "converting" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Loader2 size={10} className="animate-spin" /> Converting...
                        </span>
                      )}
                      {product.videoStatus === "failed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle size={10} /> Failed
                        </span>
                      )}
                      {(!product.videoStatus || product.videoStatus === "idle" || product.videoStatus === "uploading") && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          No video
                        </span>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => { if (confirm("Delete this lesson?")) removeProduct(product.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddLesson && (
        <AddLessonModal
          courseId={id}
          onClose={() => setShowAddLesson(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["course", id] })}
        />
      )}
    </div>
  );
}
