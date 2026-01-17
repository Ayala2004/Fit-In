// src/components/NavBars/ManagerNavbar.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, GraduationCap } from "lucide-react"; // אייקון הדרכה
import NotificationBell from "../NotificationBell";

export default function ManagerNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setUserRoles(data.roles || []));
  }, []);

  const handleLogout = async () => {
    if (!confirm("להתנתק מהמערכת?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold">FitIn</div>
              <span className="text-lg font-extrabold text-slate-800">מרכז ניהול גן</span>
            </div>

            <div className="flex items-center gap-2">
                <Link href="/manager" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive("/manager") ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}>
                <LayoutDashboard size={18} />
                <span>הגן שלי</span>
                </Link>

                {/* --- הוספת כפתור חזרה להדרכה --- */}
                {userRoles.includes("INSTRUCTOR") && (
                    <Link href="/instructor" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 transition-all">
                        <GraduationCap size={18} />
                        <span>ממשק הדרכה</span>
                    </Link>
                )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl flex items-center gap-2">
              <LogOut size={18} />
              התנתקות
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}