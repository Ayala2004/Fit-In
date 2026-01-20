import SubstituteNavbar from "@/components/NavBars/SubstituteNavbar";

export default function SubstituteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir="rtl">
      <SubstituteNavbar /> 
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}