"use client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Settings, Video, Upload, Loader2, CheckCircle, Link2, Award, MessageCircle, KeyRound } from "lucide-react";
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

  // Course WhatsApp group (shown at the bottom of the course watch page)
  const [waLink, setWaLink] = useState("");
  const [savingWaLink, setSavingWaLink] = useState(false);
  const [waImage, setWaImage] = useState<string | null>(null);
  const [waImageFile, setWaImageFile] = useState<File | null>(null);
  const [uploadingWaImage, setUploadingWaImage] = useState(false);

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

  // Keys & integrations
  const [gaId, setGaId] = useState("");
  const [fbPixelId, setFbPixelId] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiMask, setOpenaiMask] = useState<string | null>(null);
  const [savingKeys, setSavingKeys] = useState(false);

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  useEffect(() => {
    api.get("/site-settings?keys=home_how_it_works_video,home_join_button_link,default_certificate,footer_facebook_url,footer_instagram_url,footer_twitter_url,footer_linkedin_url,course_whatsapp_link,course_whatsapp_image")
      .then(({ data }) => {
        const d = data?.data || {};
        if (d.home_how_it_works_video) setHowItWorksVideo(d.home_how_it_works_video);
        if (d.home_join_button_link) setJoinLink(d.home_join_button_link);
        if (d.default_certificate) setDefaultCertificate(d.default_certificate);
        if (d.footer_facebook_url) setFacebookUrl(d.footer_facebook_url);
        if (d.footer_instagram_url) setInstagramUrl(d.footer_instagram_url);
        if (d.footer_twitter_url) setTwitterUrl(d.footer_twitter_url);
        if (d.footer_linkedin_url) setLinkedinUrl(d.footer_linkedin_url);
        if (d.course_whatsapp_link) setWaLink(d.course_whatsapp_link);
        if (d.course_whatsapp_image) setWaImage(d.course_whatsapp_image);
      })
      .catch(() => {});

    // Secrets never come back from the public endpoint, so keys are read from
    // the admin listing where they arrive masked.
    api.get("/adminpanel/site-settings")
      .then(({ data }) => {
        for (const row of (data?.data || []) as { key: string; value: string | null; isSet: boolean }[]) {
          if (row.key === "google_analytics_id") setGaId(row.value || "");
          if (row.key === "facebook_pixel_id") setFbPixelId(row.value || "");
          if (row.key === "openai_api_key" && row.isSet) setOpenaiMask(row.value);
        }
      })
      .catch(() => {});
  }, []);

  const saveKeys = async () => {
    setSavingKeys(true);
    try {
      const writes = [
        api.post("/adminpanel/site-settings", { key: "google_analytics_id", value: gaId.trim() }),
        api.post("/adminpanel/site-settings", { key: "facebook_pixel_id", value: fbPixelId.trim() }),
      ];
      // Only send the secret when a new one was actually typed, so leaving the
      // field blank keeps the stored key intact.
      if (openaiKey.trim()) {
        writes.push(api.post("/adminpanel/site-settings", { key: "openai_api_key", value: openaiKey.trim() }));
      }
      await Promise.all(writes);

      if (openaiKey.trim()) {
        const v = openaiKey.trim();
        setOpenaiMask(v.length <= 8 ? "****" : `${"*".repeat(8)}${v.slice(-4)}`);
        setOpenaiKey("");
      }
      toast.success("Keys saved");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save keys");
    } finally {
      setSavingKeys(false);
    }
  };

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

  const saveWaLink = async () => {
    setSavingWaLink(true);
    try {
      await api.post("/adminpanel/site-settings", { key: "course_whatsapp_link", value: waLink.trim() });
      toast.success("WhatsApp group link saved");
    } catch {
      toast.error("Failed to save link");
    } finally {
      setSavingWaLink(false);
    }
  };

  const uploadWaImage = async () => {
    if (!waImageFile) return;
    setUploadingWaImage(true);
    try {
      const fd = new FormData();
      fd.append("key", "course_whatsapp_image");
      fd.append("image", waImageFile);
      const { data } = await api.post("/adminpanel/site-settings/image", fd);
      if (data?.url) setWaImage(data.url);
      setWaImageFile(null);
      toast.success("WhatsApp image updated");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingWaImage(false);
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

      {/* Keys & Integrations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <KeyRound size={18} /> Keys & Integrations
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analytics IDs load on the public site. The OpenAI key stays server-side.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Google Analytics measurement ID
          </label>
          <input value={gaId} onChange={(e) => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX" className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">
            Loads gtag.js across the main site. Leave empty to switch analytics off.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Facebook Pixel ID
          </label>
          <input value={fbPixelId} onChange={(e) => setFbPixelId(e.target.value)}
            placeholder="1234567890123456" className={inputClass} />
          <p className="text-xs text-slate-400 mt-1">
            Loads the Meta Pixel and fires PageView. Leave empty to switch it off.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            OpenAI API key
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder={openaiMask ? `Configured (${openaiMask}) — type to replace` : "sk-..."}
            className={inputClass}
          />
          <p className="text-xs text-slate-400 mt-1">
            Used to generate lesson captions. Never sent to the public site, and
            shown masked here — leave blank to keep the current key.
          </p>
        </div>

        <button onClick={saveKeys} disabled={savingKeys}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60">
          {savingKeys ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Save Keys
        </button>
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

      {/* Course WhatsApp Group */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2"><MessageCircle size={16} /> Course WhatsApp Group</h2>
        <p className="text-sm text-slate-500">Shown at the bottom of the course watch page — a &quot;Join Skillocraft Group&quot; block with a green Join Now button and an image.</p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Group Link</label>
          <input
            type="text"
            value={waLink}
            onChange={(e) => setWaLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className={inputClass}
          />
          <button
            onClick={saveWaLink}
            disabled={savingWaLink}
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
          >
            {savingWaLink && <Loader2 size={14} className="animate-spin" />}
            {savingWaLink ? "Saving..." : "Save Link"}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">Image (shown on the right)</label>
          {(waImageFile || waImage) && (
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 mb-3">
              <img
                src={waImageFile ? URL.createObjectURL(waImageFile) : imgSrc(waImage || "")}
                alt="WhatsApp group"
                className="w-full max-h-64 object-contain"
              />
            </div>
          )}
          <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-indigo-400 text-sm text-slate-500 transition-colors">
            <Upload size={16} />
            {waImageFile ? (
              <span className="text-indigo-600 font-medium truncate">{waImageFile.name}</span>
            ) : (
              <span>Click to select image (PNG, JPG, max 10MB)</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setWaImageFile(e.target.files?.[0] || null)}
            />
          </label>
          <button
            onClick={uploadWaImage}
            disabled={!waImageFile || uploadingWaImage}
            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 flex items-center gap-2"
          >
            {uploadingWaImage && <Loader2 size={14} className="animate-spin" />}
            {uploadingWaImage ? "Uploading..." : waImage ? "Replace Image" : "Upload Image"}
          </button>
        </div>
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
