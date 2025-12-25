"use client";

import { useEffect, useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { AlertCircle, Clock, Calendar } from "lucide-react";

// ייבוא הקומפוננטה החדשה
import PlacementModal from "@/components/PlacementModal";

export default function SupervisorDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ניהול המודאל
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/supervisor/dashboard");
      const data = await res.json();
      setDashboardData(data);
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen font-bold">טוען...</div>;

  const displayDays = Array.from({ length: 6 }).map((_, i) => addDays(new Date(), i));

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen text-slate-800" dir="rtl">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">לוח בקרה למפקחת 👋</h1>
      </header>

      {/* וידג'טים שבועיים */}
      <section className="mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {displayDays.map((date) => {
            const stats = dashboardData.weeklyPlacements.filter((p: any) => isSameDay(new Date(p.date), date));
            const open = stats.filter((p: any) => p.status === "OPEN").length;
            return (
              <div key={date.toString()} className="p-4 rounded-xl border bg-white border-slate-100">
                <p className="text-slate-400 text-xs">{format(date, "EEEE", { locale: he })}</p>
                <p className="font-bold">{format(date, "dd/MM")}</p>
                <div className={`mt-2 text-xs font-bold ${open > 0 ? "text-red-600" : "text-emerald-600"}`}>
                   {open > 0 ? `${open} חסרות` : "מאויש מלא"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600 italic">🚨 קריאות דחופות</h2>
          {dashboardData.urgentAlerts.map((alert: any) => (
            <div key={alert.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-bold text-lg">{alert.institution.name}</p>
                <p className="text-sm text-slate-500">{alert.mainTeacher.firstName} {alert.mainTeacher.lastName}</p>
                <p className="text-xs text-blue-600 font-bold mt-1">{format(new Date(alert.date), "dd/MM/yyyy")}</p>
              </div>
              <button 
                onClick={() => { setSelectedPlacement(alert); setIsModalOpen(true); }}
                className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all"
              >
                שבצי מחליפה
              </button>
            </div>
          ))}
        </div>

        {/* עדכונים */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> עדכונים</h2>
            {dashboardData.recentActivity.map((act: any) => (
                <div key={act.id} className="text-sm border-r-2 border-blue-100 pr-3 mb-4">
                    <p>{act.substitute ? `שיבוץ לגן ${act.institution.name}` : `היעדרות ב${act.institution.name}`}</p>
                </div>
            ))}
        </div>
      </div>

      {selectedPlacement && (
        <PlacementModal
          isOpen={isModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData} // מרענן את הדף אחרי שיבוץ מוצלח
        />
      )}
    </div>
  );
}