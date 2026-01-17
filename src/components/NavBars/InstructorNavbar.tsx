"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  LogOut,
  ClipboardList,
  Users,
} from "lucide-react";
import NotificationBell from "../NotificationBell";

export default function InstructorNavbar() {
  const router = useRouter();
  const pathname = usePathname();

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
              <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold shadow-md shadow-indigo-100">
                FitIn
              </div>
              <span className="text-lg font-extrabold text-slate-800 hidden md:block">
                מרכז הדרכה
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/instructor"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive("/instructor")
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard size={18} />
                <span>הגנים שלי</span>
              </Link>
              <Link
                href="/instructor/calendar"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive("/instructor/calendar")
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Calendar size={18} />
                <span>לוח שיבוצים</span>
              </Link>
              <Link
                href="/instructor/staff"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive("/instructor/staff")
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Users size={18} />
                <span>הצוות שלי</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell /> {/* <--- הפעמון החדש */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">התנתקות</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
