import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

export function imgSrc(link?: string | null, fallback = ''): string {
  if (!link) return fallback;
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  if (!link.startsWith('/') && R2) return `${R2.replace(/\/$/, '')}/${link}`;
  return link;
}
