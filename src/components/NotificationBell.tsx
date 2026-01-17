"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // ייבוא ה-Hook לזיהוי הנתיב הנוכחי
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const pathname = usePathname(); // מקבל את הכתובת הנוכחית (למשל: /supervisor/notifications)
  const [unreadCount, setUnreadCount] = useState(0);
  const [targetUrl, setTargetUrl] = useState("/notifications");

  const fetchCount = async () => {
    try {
      const notifyRes = await fetch("/api/notifications");
      if (notifyRes.ok) {
        const data = await notifyRes.json();
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchCount();

    // קביעת הקישור לפי תפקיד
    fetch("/api/auth/me").then(res => res.json()).then(user => {
        if (user.roles.includes("SUPERVISOR")) setTargetUrl("/supervisor/notifications");
        else if (user.roles.includes("INSTRUCTOR")) setTargetUrl("/instructor/notifications");
        else if (user.roles.includes("MANAGER")) setTargetUrl("/manager/notifications");
    });

    const handleRead = () => setUnreadCount(0);
    window.addEventListener("notificationsRead", handleRead);

    const interval = setInterval(fetchCount, 60000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notificationsRead", handleRead);
    };
  }, []);

  // בדיקה האם המשתמשת נמצאת כרגע בדף ההתראות
  const isActive = pathname === targetUrl;

  return (
    <Link 
      href={targetUrl} 
      className={`relative p-2 rounded-xl transition-all duration-200 group ${
        isActive 
          ? "bg-indigo-50 text-indigo-600 shadow-sm" // עיצוב למצב פעיל
          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50" // עיצוב רגיל
      }`}
    >
      <Bell 
        size={24} 
        className={isActive ? "fill-indigo-600/10" : ""} // הוספת מילוי עדין כשהוא פעיל
      />
      
      {unreadCount > 0 && (
        <span className={`absolute top-1.5 left-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 transition-all ${
          isActive ? "border-indigo-50" : "border-white"
        }`}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}