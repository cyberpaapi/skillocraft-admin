"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminLogin } from "@/lib/api";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill in all fields");
    setLoading(true);
    try {
      const { data } = await adminLogin(email, password);
      const opts = { path: "/", expires: 7 };
      if (data.accessToken) Cookies.set("admin_access_token", data.accessToken, opts);
      if (data.refreshToken) Cookies.set("admin_refresh_token", data.refreshToken, opts);
      if (data.user) {
        const userData = { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role };
        Cookies.set("admin_user_data", JSON.stringify(userData), opts);
        setUser(userData);
        toast.success("Welcome back!");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/30">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Skillocraft Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@skillocraft.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2.5 pl-10 pr-10 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Skillocraft Admin — restricted access only
        </p>
      </div>
    </div>
  );
}
