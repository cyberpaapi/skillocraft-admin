"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, FolderOpen, Users, ShoppingCart,
  BarChart3, Tag, FileText, ChevronDown, LogOut, Settings,
  Image, Star, MessageSquare, Trophy, HelpCircle, Megaphone,
  UserCheck, UserCog, Shield, CalendarDays, Gift, ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
  {
    label: "Courses",
    icon: <BookOpen size={18} />,
    children: [
      { label: "All Courses", href: "/courses" },
      { label: "Categories", href: "/categories" },
    ],
  },
  {
    label: "Users",
    icon: <Users size={18} />,
    children: [
      { label: "Customers", href: "/users/customers" },
    ],
  },
  { label: "Marketplace Orders", href: "/marketplace-orders", icon: <ShoppingCart size={18} /> },
  { label: "Events", href: "/events", icon: <CalendarDays size={18} /> },
  { label: "Marketplace", href: "/marketplace", icon: <ShoppingBag size={18} /> },
  { label: "Discounts", href: "/discounts", icon: <Tag size={18} /> },
  { label: "Referral Program", href: "/referral", icon: <Gift size={18} /> },
  { label: "Revenue", href: "/revenue", icon: <BarChart3 size={18} /> },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 size={18} /> },
  {
    label: "Content",
    icon: <FileText size={18} />,
    children: [
      { label: "Blogs", href: "/content/blogs" },
      { label: "Banners", href: "/content/banners" },
      { label: "Testimonials", href: "/content/testimonials" },
      { label: "Success Stories", href: "/content/success" },
      { label: "FAQs", href: "/content/faqs" },
      { label: "Creators", href: "/content/creators" },
      { label: "Authors", href: "/content/authors" },
      { label: "Gallery", href: "/content/gallery" },
      { label: "Brands", href: "/content/brands" },
    ],
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isChildActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href));
  const [open, setOpen] = useState(!!isChildActive);

  if (item.href) {
    const active = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          active
            ? "bg-indigo-600 text-white"
            : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isChildActive
            ? "text-white"
            : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
        )}
      >
        <span className="flex items-center gap-3">
          {item.icon}
          {item.label}
        </span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="ml-7 mt-1 flex flex-col gap-0.5">
          {item.children?.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "text-indigo-400 bg-slate-700"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-slate-900 flex flex-col z-30 border-r border-slate-700/50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Skillocraft</p>
            <p className="text-slate-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavGroup key={item.label} item={item} />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-medium truncate">{user?.name || "Admin"}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
