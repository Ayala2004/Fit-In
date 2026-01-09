"use client";
import { useEffect, useState } from "react";
import { Search, Phone, Mail, Building2, CalendarDays, User, ArrowLeftRight } from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { highlightText } from "@/lib/utils/formatters";

export default function InstructorStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/instructor/staff")
      .then(res => res.json())
      .then(data => {
        setStaff(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const filteredStaff = staff.filter(member => 
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.mainManagedInstitutions?.[0]?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dayTranslations: any = {
    SUNDAY: "א'", MONDAY: "ב'", TUESDAY: "ג'", WEDNESDAY: "ד'", THURSDAY: "ה'", FRIDAY: "ו'"
  };

  if (loading) return <LoadingScreen message="טוען את צוות הגננות..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full">
          <h1 className="text-3xl font-black text-slate-800">הצוות שלי</h1>
          <p className="text-slate-500 font-medium">ניהול ומעקב אחר גננות האם במחוז שלך</p>
        </div>
        
        <div className="relative w-full max-w-md group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="חיפוש גננת או שם גן..."
            className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
            {/* Top Section */}
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                  {member.firstName[0]}
                </div>
                {!member.isWorking && (
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">לא פעילה</span>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-800">
                {highlightText(`${member.firstName} ${member.lastName}`, searchTerm)}
              </h3>
              
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mt-1">
                <Building2 size={16} />
                <span>{highlightText(member.mainManagedInstitutions?.[0]?.name || "טרם שויך גן", searchTerm)}</span>
              </div>
            </div>

            {/* Stats/Info Section */}
            <div className="px-8 py-6 space-y-4 bg-slate-50/50 border-t border-slate-50 flex-1">
              
              {/* Rotation Info */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">צוות משלים קבוע (רוטציה):</p>
                {member.fixedRotationsAsManager?.length > 0 ? (
                  <div className="grid gap-2">
                    {member.fixedRotationsAsManager.map((rot: any) => (
                      <div key={rot.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 text-xs shadow-sm">
                        <span className="font-black text-indigo-600">יום {dayTranslations[rot.day]}</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <User size={12} className="text-slate-400" />
                          {rot.rotationTeacher.firstName} {rot.rotationTeacher.lastName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">לא הוגדרה רוטציה קבועה</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold italic">לא נמצאו גננות התואמות לחיפוש שלך</p>
        </div>
      )}
    </div>
  );
}