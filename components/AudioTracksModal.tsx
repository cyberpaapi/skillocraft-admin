"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, X, Music } from "lucide-react";
import { toast } from "sonner";
import {
  getLanguages,
  createLanguageOption,
  getAudioTracks,
  getAudioUploadUrl,
  createAudioTrack,
  deleteAudioTrack,
  uploadToR2,
} from "@/lib/api";

const NEW_LANGUAGE = "__new__";

interface AudioTrack {
  id: string;
  language: string;
  audioLink: string;
  createdAt: string;
}

interface LanguageOption {
  id: string;
  name: string;
  code?: string | null;
}

export default function AudioTracksModal({
  productId,
  lessonName,
  onClose,
}: {
  productId: string;
  lessonName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pct, setPct] = useState(0);

  const { data: languages = [], refetch: refetchLanguages } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => (await getLanguages()).data?.data as LanguageOption[],
  });

  const { data: tracks = [], refetch: refetchTracks, isLoading } = useQuery({
    queryKey: ["audio-tracks", productId],
    queryFn: async () => (await getAudioTracks(productId)).data?.data as AudioTrack[],
  });

  // Esc closes, matching the other dialogs in the panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !uploading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, uploading]);

  const addingNew = selected === NEW_LANGUAGE;
  const language = (addingNew ? newLanguage : selected).trim();

  // Languages already on this lesson can't be picked again — the rule is enforced
  // server-side too, this just avoids an obvious dead end.
  const usedLanguages = new Set(tracks.map((t) => t.language.toLowerCase()));

  const reset = () => {
    setSelected("");
    setNewLanguage("");
    setFile(null);
    setPct(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!language) return toast.error("Pick a language first");
    if (!file) return toast.error("Choose an audio file");

    setUploading(true);
    setPct(0);
    try {
      const { data } = await getAudioUploadUrl(productId, {
        language,
        fileName: file.name,
        contentType: file.type || "audio/mpeg",
      });

      await uploadToR2(data.putUrl, file, setPct);
      await createAudioTrack(productId, { language, key: data.key });

      toast.success(`${language} audio added`);
      reset();
      refetchTracks();
      refetchLanguages();
      queryClient.invalidateQueries({ queryKey: ["languages"] });
    } catch (err: any) {
      const res = err?.response?.data;
      if (res?.code === "DUPLICATE_LANGUAGE") {
        // Refuse the upload, but hand the admin the exact way forward.
        toast.error(`${res.message} ${res.hint}`, { duration: 8000 });
        if (res.suggestion) {
          setSelected(NEW_LANGUAGE);
          setNewLanguage(res.suggestion);
        }
      } else {
        toast.error(res?.message || "Failed to add audio track");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAddLanguageOnly = async () => {
    const name = newLanguage.trim();
    if (!name) return;
    try {
      await createLanguageOption(name);
      await refetchLanguages();
      toast.success(`"${name}" is now available in the dropdown`);
    } catch {
      toast.error("Could not save the language");
    }
  };

  const handleDelete = async (track: AudioTrack) => {
    if (!confirm(`Remove the ${track.language} audio track?`)) return;
    try {
      await deleteAudioTrack(track.id);
      toast.success("Audio track removed");
      refetchTracks();
    } catch {
      toast.error("Failed to remove audio track");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
              <Music size={18} /> Audio Tracks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{lessonName}</p>
          </div>
          <button onClick={onClose} disabled={uploading}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Existing tracks */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Current tracks
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : tracks.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                No alternate audio yet — the lesson plays its original audio.
              </p>
            ) : (
              <ul className="space-y-2">
                {tracks.map((track) => (
                  <li key={track.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="text-sm font-medium text-slate-700">{track.language}</span>
                    <button onClick={() => handleDelete(track)} title="Remove track"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add a track */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Add a track
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={uploading}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">Select a language…</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.name} disabled={usedLanguages.has(l.name.toLowerCase())}>
                    {l.name}
                    {usedLanguages.has(l.name.toLowerCase()) ? " (already added)" : ""}
                  </option>
                ))}
                <option value={NEW_LANGUAGE}>+ New Language…</option>
              </select>
            </div>

            {addingNew && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New language name
                </label>
                <div className="flex gap-2">
                  <input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder='e.g. "Odia", or "Hindi 2" for a second Hindi version'
                    disabled={uploading}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <button onClick={handleAddLanguageOnly} disabled={uploading || !newLanguage.trim()}
                    title="Save this language for reuse without uploading yet"
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
                    Save
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Saved languages stay in this dropdown for every lesson.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Audio file</label>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*"
                disabled={uploading}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
              />
            </div>

            {uploading && (
              <div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">Uploading {pct}%</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !language || !file}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                : <><Upload size={14} /> Add Audio Track</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
