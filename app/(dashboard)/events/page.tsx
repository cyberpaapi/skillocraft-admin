"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvents, deleteEvent } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Pencil, Loader2, CalendarDays, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import SuperAdminGate from "@/components/SuperAdminGate";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  category: string;
  status: string;
  featured: boolean;
  imageLink?: string;
  createdAt: string;
  _count?: { EventRegistration: number };
}

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await getEvents();
      return (data?.data?.events || []) as Event[];
    },
  });

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const events = (data || []).filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminGate>
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <Link
          href="/events/create"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Event
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
          <CalendarDays size={40} className="mb-3 opacity-40" />
          <p className="font-medium">No events yet</p>
          <p className="text-sm">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Event</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Date & Time</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Venue</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Price</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Registered</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {event.imageLink ? (
                        <img src={`http://localhost:4000${event.imageLink}`} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={16} className="text-indigo-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-400">{event.category}{event.featured && <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs">Featured</span>}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{event.date}<br /><span className="text-xs text-slate-400">{event.time}</span></td>
                  <td className="px-5 py-3 text-slate-600 max-w-[140px] truncate">{event.venue}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">₹{event.price}</td>
                  <td className="px-5 py-3 text-slate-600">{event._count?.EventRegistration ?? 0}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${event.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/events/${event.id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => { if (confirm("Delete this event?")) remove(event.id); }}
                        disabled={deleting}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </SuperAdminGate>
  );
}
