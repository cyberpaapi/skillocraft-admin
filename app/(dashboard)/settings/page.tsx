"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Settings, Video, Upload, Loader2, CheckCircle, Link2 } from "lucide-react";

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();

  // "See how it works" video
  const [howItWorksVideo, setHowItWorksVideo] = useState<string | null>(null);
  const [howItWorksFile, setHowItWorksFile] = useState<File | null>(null);
  const [uploadingHowItWorks, setUploadingHowItWorks] = useState(false);

  // "Join Now" button link
  const [joinLink, setJoinLink] = useState("");
  const [savingJoinLink, setSavingJoinLink] = useState(false);

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  useEffect(() => {
    api.get("/site-settings?keys=home_how_it_works_video,home_join_button_link")
      .then(({ data }) => {
        const d = data?.data || {};
        if (d.home_how_it_works_video) setHowItWorksVideo(d.home_how_it_works_video);
        if (d.home_join_button_link) setJoinLink(d.home_join_button_link);
      })
      .catch(() => {});
  }, []);

  const saveJoinLink = async () => {
    setSavingJoinLink(true);
    try {
      await api.post("/adminpanel/site-settings", { key: "home_join_button_link", value: joinLink.trim() });
      toast.success("Join Now button link saved");
    } catch {
      toast.error("Failed to save link");
    } finally {
      setSavingJoinLink(false);
    }
  };

  const uploadHowItWorksVideo = async () => {
    if (!howItWorksFile) return;
    setUploadingHowItWorks(true);
    try {
      const fd = new FormData();
      fd.append("key", "home_how_it_works_video");
      fd.append("video", howItWorksFile);
      await api.post("/adminpanel/site-settings/video", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success('"See how it works" video updated');
      setHowItWorksFile(null);
      const { data } = await api.get("/site-settings?keys=home_how_it_works_video");
      if (data?.data?.home_how_it_works_video) setHowItWorksVideo(data.data.home_how_it_works_video);
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploadingHowItWorks(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Settings size={20} /> Site Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage homepage content and media settings</p>
      </div>

      {/* "See How It Works" Video */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Video size={16} /> "See How It Works" Video</h2>
        <p className="text-sm text-slate-500">This video plays when users click the "See how it works?" button on the homepage hero section.</p>

        {howItWorksVideo && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle size={14} />
            <span>Video is set</span>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 text-sm text-slate-500 transition-colors">
            <Upload size={16} />
            {howItWorksFile ? (
              <span className="text-indigo-600 font-medium truncate">{howItWorksFile.name}</span>
            ) : (
              <span>Click to select video file (MP4, max 500MB)</span>
            )}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setHowItWorksFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            onClick={uploadHowItWorksVideo}
            disabled={!howItWorksFile || uploadingHowItWorks}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
          >
            {uploadingHowItWorks && <Loader2 size={14} className="animate-spin" />}
            {uploadingHowItWorks ? "Uploading..." : howItWorksVideo ? "Replace Video" : "Upload Video"}
          </button>
        </div>
      </div>

      {/* "Join Now" Button Link */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Link2 size={16} /> &quot;Join Now&quot; Button Link</h2>
        <p className="text-sm text-slate-500">The URL the &quot;Join Now&quot; button (Formulator Club section near the homepage bottom) links to. Use a full URL (https://...) to open in a new tab, or a path like /courses.</p>

        <input
          type="text"
          value={joinLink}
          onChange={(e) => setJoinLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/... or /courses"
          className={inputClass}
        />
        <button
          onClick={saveJoinLink}
          disabled={savingJoinLink}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
        >
          {savingJoinLink && <Loader2 size={14} className="animate-spin" />}
          {savingJoinLink ? "Saving..." : "Save Link"}
        </button>
      </div>
    </div>
  );
}
