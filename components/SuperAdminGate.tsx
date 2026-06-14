"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const SESSION_KEY = "skillocraft_superadmin_unlocked";
const SUPERADMIN_PASSWORD = "Amri@1995@skillo";

export default function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    setChecked(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPERADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  if (!checked) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center">
            <Lock size={24} className="text-indigo-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 text-center mb-1">Restricted Area</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Enter the superadmin password to access this section
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Superadmin password"
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Unlock
          </button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">
          Access expires when you close the browser tab
        </p>
      </div>
    </div>
  );
}
