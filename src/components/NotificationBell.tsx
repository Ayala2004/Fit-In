"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";

export default function NotificationBell() {
  const pathname = usePathname();

  // 1. טעינת נתוני המשתמש (בשביל הקישור הנכון)
  const { data: user } = useSWR("/api/auth/me", fetcher);

  // 2. טעינת ההתראות בזמן אמת (כל 10 שניות)
  const { data: notifications, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 10000, // עדכון כל 10 שניות
  });

  // חישוב כמות ההודעות שלא נקראו
  const unreadCount = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return 0;
    return notifications.filter((n: any) => !n.isRead).length;
  }, [notifications]);

  // קביעת הקישור לפי תפקיד המשתמש
  const targetUrl = useMemo(() => {
    if (!user || !user.roles) return "/notifications";
    if (user.roles.includes("SUPERVISOR")) return "/supervisor/notifications";
    if (user.roles.includes("INSTRUCTOR")) return "/instructor/notifications";
    if (user.roles.includes("MANAGER")) return "/manager/notifications";
    return "/notifications";
  }, [user]);

  // האזנה לאירוע ניקוי התראות (כדי לאפס את המספר מיד כשנכנסים לדף)
  useEffect(() => {
    const handleRead = () => mutate(); // גורם ל-SWR למשוך נתונים מעודכנים (שהם כבר isRead: true)
    window.addEventListener("notificationsRead", handleRead);
    return () => window.removeEventListener("notificationsRead", handleRead);
  }, [mutate]);

  const isActive = pathname === targetUrl;

  return (
    <Link 
      href={targetUrl} 
      className={`relative p-2 rounded-xl transition-all duration-200 group ${
        isActive 
          ? "bg-indigo-50 text-indigo-600 shadow-sm" 
          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
      }`}
    >
      <Bell 
        size={24} 
        className={isActive ? "fill-indigo-600/10" : ""} 
      />
      
      {unreadCount > 0 && (
        <span className={`absolute top-1.5 left-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 transition-all ${
          isActive ? "border-indigo-50" : "border-white"
        }`}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}