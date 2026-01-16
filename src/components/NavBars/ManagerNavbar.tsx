"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";

export default function ManagerNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!confirm("להתנתק מהמערכת?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl font-bold shadow-md shadow-indigo-100">FitIn</div>
              <span className="text-lg font-extrabold text-slate-800 hidden md:block tracking-tight">מרכז ניהול גן</span>
            </div>
            <Link href="/manager" className="bg-indigo-50 text-indigo-600 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold">
              <LayoutDashboard size={18} />
              <span>הגן שלי</span>
            </Link>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
            <LogOut size={18} />
            <span className="hidden sm:inline">התנתקות</span>
          </button>
        </div>
      </div>
    </nav>
  );
}