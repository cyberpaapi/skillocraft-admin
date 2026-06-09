"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = Cookies.get("admin_user_data");
    const token = Cookies.get("admin_access_token");
    if (userData && token) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        Cookies.remove("admin_user_data");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    Cookies.remove("admin_access_token");
    Cookies.remove("admin_refresh_token");
    Cookies.remove("admin_user_data");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
