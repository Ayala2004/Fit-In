'use client';

import Navbar from '@/components/Navbar';

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ה-Navbar החדש שכולל את כל הניווט */}
      <Navbar />

      {/* תוכן הדף */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}