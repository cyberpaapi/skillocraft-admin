"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/courses": "Courses",
  "/categories": "Categories",
  "/orders": "Orders",
  "/discounts": "Discounts",
  "/revenue": "Revenue",
  "/analytics": "Analytics",
  "/users/customers": "Customers",
  "/users/admins": "Admins",
  "/users/staff": "Staff",
  "/content/blogs": "Blogs",
  "/content/banners": "Banners",
  "/content/testimonials": "Testimonials",
  "/content/success": "Success Stories",
  "/content/faqs": "FAQs",
  "/content/creators": "Creators",
  "/content/authors": "Authors",
  "/content/gallery": "Featured Gallery",
  "/content/brands": "Featured Brands",
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pageTitles[pathname] || "Admin";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <span className="text-sm font-medium text-slate-700">{user?.name || "Admin"}</span>
        </div>
      </div>
    </header>
  );
}
