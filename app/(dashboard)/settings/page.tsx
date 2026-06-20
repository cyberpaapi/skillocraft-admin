"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Settings, Video, Upload, Loader2, CheckCircle, Link2, Award } from "lucide-react";
import { imgSrc } from "@/lib/utils";

export default function SiteSettingsPage() {
  const queryClient = useQueryClient();

  // "See how it works" video
  const [howItWorksVideo, setHowItWorksVideo] = useState<string | null>(null);
  const [howItWorksFile, setHowItWorksFile] = useState<File | null>(null);
  const [uploadingHowItWorks, setUploadingHowItWorks] = useState(false);

  // "Join Now" button link
  const [joinLink, setJoinLink] = useState("");
  const [savingJoinLink, setSavingJoinLink] = useState(false);

  // Default certificate image
  const [defaultCertificate, setDefaultCertificate] = useState<string | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Footer social links
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [savingSocials, setSavingSocials] = useState(false);

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  useEffect(() => {
    api.get("/site-settings?keys=home_how_it_works_video,home_join_button_link,default_certificate,footer_facebook_url,footer_instagram_url,footer_twitter_url,footer_linkedin_url")
      .then(({ data }) => {
        const d = data?.data || {};
        if (d.home_how_it_works_video) setHowItWorksVideo(d.home_how_it_works_video);
        if (d.home_join_button_link) setJoinLink(d.home_join_button_link);
        if (d.default_certificate) setDefaultCertificate(d.default_certificate);
        if (d.footer_facebook_url) setFacebookUrl(d.footer_facebook_url);
        if (d.footer_instagram_url) setInstagramUrl(d.footer_instagram_url);
        if (d.footer_twitter_url) setTwitterUrl(d.footer_twitter_url);
        if (d.footer_linkedin_url) setLinkedinUrl(d.footer_linkedin_url);
      })
      .catch(() => {});
  }, []);

  const saveSocials = async () => {
    setSavingSocials(true);
    try {
      await Promise.all([
        api.post("/adminpanel/site-settings", { key: "footer_facebook_url", value: facebookUrl.trim() }),
        api.post("/adminpanel/site-settings", { key: "footer_instagram_url", value: instagramUrl.trim() }),
        api.post("/adminpanel/site-settings", { key: "footer_twitter_url", value: twitterUrl.trim() }),
        api.post("/adminpanel/site-settings", { key: "footer_linkedin_url", value: linkedinUrl.trim() }),
      ]);
      toast.success("Social links saved");
    } catch {
      toast.error("Failed to save social links");
    } finally {
      setSavingSocials(false);
    }
  };

  const uploadDefaultCertificate = async () => {
    if (!certFile) return;
    setUploadingCert(true);
    try {
      const fd = new FormData();
      fd.append("key", "default_certificate");
      fd.append("image", certFile);
      const { data } = await api.post("/adminpanel/site-settings/image", fd);
      if (data?.url) setDefaultCertificate(data.url);
      setCertFile(null);
      toast.success("Default certificate updated");
    } catch {
      toast.error("Failed to upload certificate");
    } finally {
      setUploadingCert(false);
    }
  };

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

      {/* Footer Social Links */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Link2 size={16} /> Footer Social Links</h2>
        <p className="text-sm text-slate-500">The Facebook and Instagram links shown in the website footer.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
            <input
              type="text"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/share/..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram URL</label>
            <input
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/skillocraft"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">X (Twitter) URL</label>
            <input
              type="text"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/skillocraft"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
            <input
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/skillocraft"
              className={inputClass}
            />
          </div>
          <button
            onClick={saveSocials}
            disabled={savingSocials}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
          >
            {savingSocials && <Loader2 size={14} className="animate-spin" />}
            {savingSocials ? "Saving..." : "Save Social Links"}
          </button>
        </div>
      </div>

      {/* Default Certificate */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Award size={16} /> Default Certificate</h2>
        <p className="text-sm text-slate-500">Shown on every course page that does not have its own certificate uploaded. Individual courses can override this from the course edit screen.</p>

        {(certFile || defaultCertificate) && (
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            <img
              src={certFile ? URL.createObjectURL(certFile) : imgSrc(defaultCertificate || "")}
              alt="Default certificate"
              className="w-full max-h-64 object-contain"
            />
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 text-sm text-slate-500 transition-colors">
            <Upload size={16} />
            {certFile ? (
              <span className="text-indigo-600 font-medium truncate">{certFile.name}</span>
            ) : (
              <span>Click to select certificate image (PNG, JPG, max 10MB)</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            onClick={uploadDefaultCertificate}
            disabled={!certFile || uploadingCert}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
          >
            {uploadingCert && <Loader2 size={14} className="animate-spin" />}
            {uploadingCert ? "Uploading..." : defaultCertificate ? "Replace Certificate" : "Upload Certificate"}
          </button>
        </div>
      </div>
    </div>
  );
}
