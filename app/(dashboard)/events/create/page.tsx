"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, CalendarDays } from "lucide-react";
import Link from "next/link";

const EVENT_CATEGORIES = [
  "Outdoor Live Events",
  "Online Live Events",
  "Explore New World",
  "Baking", "Banking", "Perfume", "Makeup", "Cooking", "Healthcare", "Art & Craft", "Photography", "General", "Workshop", "Seminar", "Festival",
];
const CITIES = ["Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad", "Chandigarh", "Ahmedabad", "Pune", "Chennai", "Kolkata", "Kochi", "Online", "Other"];

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    city: "Mumbai",
    price: "",
    category: "General",
    mode: "Online",
    featured: false,
    status: "ACTIVE",
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["title", "shortDescription", "description", "date", "time", "venue", "price"] as const;
    const missing = required.filter((k) => !form[k]);
    if (missing.length) { toast.error(`Please fill: ${missing.join(", ")}`); return; }

    setLoading(true);
    // Combine venue + city so the live page can filter by city
    const venueWithCity = form.city && form.city !== "Other"
      ? `${form.venue}${form.venue ? ", " : ""}${form.city}`
      : form.venue;
    const payload = { ...form, venue: venueWithCity };

    try {
      const imgFile = imageRef.current?.files?.[0];

      if (imgFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append("image", imgFile);
        await createEvent(fd);
      } else {
        const { api } = await import("@/lib/api");
        await api.post("/adminpanel/events", {
          ...payload,
          featured: Boolean(payload.featured),
        });
      }

      toast.success("Event created!");
      router.push("/events");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string; errors?: string[] }; status?: number } };
      const d = e?.response?.data;
      const msg = d?.message
        || d?.error
        || (Array.isArray(d?.errors) ? d.errors.join(", ") : null)
        || `Server error ${e?.response?.status ?? "– check network tab"}`;
      toast.error(msg);
      console.error("Create event error:", e?.response?.status, d);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/events" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Event</h1>
          <p className="text-sm text-slate-500">Fill in the details to publish a new event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* Image */}
        <div>
          <label className={labelClass}>Event Image (optional)</label>
          <div
            onClick={() => imageRef.current?.click()}
            className="relative border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
            style={{ height: imagePreview ? "auto" : 140 }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="w-full object-cover rounded-xl" style={{ maxHeight: 240 }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Upload size={24} />
                <span className="text-sm">Click to upload event banner</span>
              </div>
            )}
          </div>
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>Title *</label>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" />
        </div>

        {/* Short Description */}
        <div>
          <label className={labelClass}>Short Description *</label>
          <input className={inputClass} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line summary" />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Full Description *</label>
          <textarea className={`${inputClass} min-h-[100px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed event description..." />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Time *</label>
            <input type="time" className={inputClass} value={form.time} onChange={(e) => set("time", e.target.value)} />
          </div>
        </div>

        {/* Venue + City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue *</label>
            <input className={inputClass} value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Grand Hall" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price (₹) *</label>
            <input type="number" min="0" className={inputClass} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0 for free" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Mode */}
        <div>
          <label className={labelClass}>Mode</label>
          <select className={inputClass} value={form.mode} onChange={(e) => set("mode", e.target.value)}>
            <option value="Online">Online</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Featured */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
          <span className="text-sm text-slate-700 font-medium">Mark as Featured</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><CalendarDays size={16} /> Create Event</>}
        </button>
      </form>
    </div>
  );
}
