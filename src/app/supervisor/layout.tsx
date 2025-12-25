'use client';

import { useRouter } from 'next/navigation';

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    // קריאה ל-API שימחק את ה-Cookie
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar עליון */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* צד ימין: לוגו ושם המערכת */}
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg font-bold">FitIn</div>
              <span className="text-xl font-bold text-gray-800">ממשק מפקחת</span>
            </div>

            {/* צד שמאל: כפתור התנתקות */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-md transition-colors border border-red-100"
              >
                התנתקות
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* תוכן הדף */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}