"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
