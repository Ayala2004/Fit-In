'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, LogOut, PieChartIcon } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!confirm("האם את בטוחה שברצונך להתנתק?")) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // פונקציית עזר לבדיקה אם הקישור פעיל (בשביל העיצוב)
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* צד ימין: לוגו ותפריט ניווט */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl font-bold shadow-md shadow-blue-100">FitIn</div>
              <span className="text-lg font-extrabold text-slate-800 hidden md:block">ממשק מפקחת</span>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href="/supervisor" 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive('/supervisor') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>דאשבורד</span>
              </Link>

              <Link 
                href="/supervisor/calendar" 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive('/supervisor/calendar') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Calendar size={18} />
                <span>לוח שנה</span>
              </Link>
              <Link 
                href="/supervisor/placements" 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive('/supervisor/placements') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <PieChartIcon size={18} />
                <span>נתונים</span>
              </Link>
            </div>
          </div>

          {/* צד שמאל: כפתור התנתקות */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-100"
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