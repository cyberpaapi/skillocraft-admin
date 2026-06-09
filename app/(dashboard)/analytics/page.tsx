"use client";

import { useQuery } from "@tanstack/react-query";
import { getVideoAnalytics } from "@/lib/api";
import { BarChart3, Loader2, Monitor, Smartphone, Tablet } from "lucide-react";

interface VideoAnalytic {
  productId: string;
  productName?: string;
  totalViews: number;
  avgWatchDuration: number;
  avgCompletionRate: number;
  deviceBreakdown?: { mobile: number; desktop: number; tablet: number };
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="text-slate-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["video-analytics"],
    queryFn: async () => {
      const { data } = await getVideoAnalytics();
      return data?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const analytics = data?.analytics || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Video Views" value={(summary.totalViews || 0).toLocaleString()} icon={<BarChart3 size={18} />} />
        <StatCard label="Avg Watch Duration" value={`${Math.round(summary.avgWatchDuration || 0)}s`} icon={<BarChart3 size={18} />} />
        <StatCard label="Avg Completion Rate" value={`${Math.round(summary.avgCompletionRate || 0)}%`} icon={<BarChart3 size={18} />} />
      </div>

      {/* Analytics Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Video Performance</h2>
        </div>
        {analytics.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BarChart3 size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No analytics data yet</p>
            <p className="text-sm mt-1">Analytics will appear once users watch videos</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Video</th>
                <th className="px-6 py-3 font-medium">Views</th>
                <th className="px-6 py-3 font-medium">Avg Watch Time</th>
                <th className="px-6 py-3 font-medium">Completion Rate</th>
                <th className="px-6 py-3 font-medium">Devices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.map((a: VideoAnalytic) => (
                <tr key={a.productId} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{a.productName || a.productId.slice(0, 12)}</td>
                  <td className="px-6 py-3">{a.totalViews.toLocaleString()}</td>
                  <td className="px-6 py-3">{Math.round(a.avgWatchDuration)}s</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-20">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(a.avgCompletionRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-600">{Math.round(a.avgCompletionRate)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Smartphone size={12} /> {a.deviceBreakdown?.mobile || 0}
                      <Monitor size={12} /> {a.deviceBreakdown?.desktop || 0}
                      <Tablet size={12} /> {a.deviceBreakdown?.tablet || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
