import InstructorNavbar from "@/components/NavBars/InstructorNavbar";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <InstructorNavbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}