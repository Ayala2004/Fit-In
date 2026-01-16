import ManagerNavbar from "@/components/NavBars/ManagerNavbar";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      {/* תפריט ניווט לגננת (ניצור אותו מיד) */}
      <ManagerNavbar /> 
      
      {/* כאן קורה הקסם של המרכז - max-w-7xl mx-auto */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}