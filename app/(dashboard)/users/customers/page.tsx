"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Users, Loader2, Search } from "lucide-react";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  contact?: string;
  createdAt: string;
  user?: { email: string };
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await getCustomers();
      return (data?.data || data?.customers || []) as Customer[];
    },
  });

  const customers = (data || []).filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-indigo-500" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No customers yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm flex-shrink-0">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{c.user?.email || c.email || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{c.contact || "—"}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
