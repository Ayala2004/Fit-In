import RotationNavbar from "@/components/NavBars/RotationNavbar";

export default function RotationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* תפריט ניווט לגננת רוטציה */}
      <RotationNavbar /> 
      
      {/* תוכן העמוד המרכזי */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}