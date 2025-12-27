"use client";

import { useEffect, useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { AlertCircle, Calendar, ChevronLeft, Clock, MapPin, User } from "lucide-react";
import PlacementModal from "@/components/PlacementModal";
import RecentActivityModal from "@/components/RecentActivityModal";

export default function SupervisorDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const loadData = async () => {
    try {
      const res = await fetch("/api/supervisor/dashboard");
      const data = await res.json();
      setDashboardData(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // הפונקציה לסגירת הגן
  const handleCloseGarden = async (placementId: string) => {
    if (!confirm("האם לסגור את הגן להיום עקב חוסר במחליפה?")) return;

    try {
      const res = await fetch("/api/supervisor/placements", {
        method: "PATCH",
        body: JSON.stringify({ placementId, status: "CANCELLED" }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        loadData(); // רענון הנתונים בלוח הבקרה
      } else {
        alert("שגיאה בסגירת הגן");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen font-bold text-black">
        טוען...
      </div>
    );

  const buildSixDisplayDays = (start: Date) => {
    const days: Date[] = [];
    let d = new Date(start);

    while (days.length < 6) {
      if (d.getDay() !== 6) {
        days.push(new Date(d));
      }
      d = addDays(d, 1);
    }

    return days;
  };

  const displayDaysWithoutSaturday = buildSixDisplayDays(new Date());

  const displayDays = Array.from({ length: 6 }).map((_, i) =>
    addDays(new Date(), i)
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen font-sans text-slate-900" dir="rtl">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
            שלום, מפקחת 👋
          </h1>
          <p className="text-slate-500 font-medium text-sm italic">
            הנה תמונת המצב של הגנים שתחת חסותך להיום.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Calendar className="text-indigo-600" size={20} />
          <span className="font-bold text-slate-700">
            {format(new Date(), "EEEE, d בMMMM", { locale: he })}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* Weekly Snapshot Card */}
        <section className="mb-10 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">מבט שבועי</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {displayDaysWithoutSaturday.map((date) => {
              const isToday = isSameDay(date, new Date());
              return (
                <div 
                  key={date.toString()} 
                  className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 ${
                    isToday 
                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02]" 
                    : "bg-slate-50 border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${isToday ? "text-indigo-100" : "text-slate-400"}`}>
                    {format(date, "EEEE", { locale: he })}
                  </p>
                  <p className={`text-xl font-black ${isToday ? "text-white" : "text-slate-700"}`}>
                    {format(date, "dd/MM")}
                  </p>
                  {isToday && <div className="absolute top-[-10px] left-[-10px] w-8 h-8 bg-white/10 rounded-full blur-xl"></div>}
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Urgent Alerts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                   <AlertCircle size={22} />
                </div>
                קריאות דחופות
                <span className="bg-red-500 text-white text-[12px] px-2 py-0.5 rounded-full font-bold">
                  {dashboardData.urgentAlerts.length}
                </span>
              </h2>
            </div>

            <div className="grid gap-4">
              {dashboardData.urgentAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                       <MapPin size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-800 leading-tight mb-1">
                        {alert.institution.name}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-500">
                        <User size={14} />
                        <span className="text-sm font-medium italic">
                          גננת: {alert.mainTeacher.firstName} {alert.mainTeacher.lastName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPlacement(alert);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all text-sm"
                    >
                      שבצי מחליפה
                    </button>
                    <button
                      onClick={() => handleCloseGarden(alert.id)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-white text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-50 active:scale-95 transition-all text-sm"
                    >
                      סגירת הגן
                    </button>
                  </div>
                </div>
              ))}

              {dashboardData.urgentAlerts.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                   <p className="text-slate-400 font-medium">אין קריאות דחופות כרגע. עבודה טובה! ✨</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Column: Recent Activity */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 px-2">
               <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <Clock size={22} />
               </div>
               עדכונים אחרונים
            </h2>
            
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 space-y-5 flex-1">
                {dashboardData.recentActivity.slice(0, 5).map((act: any, idx: number) => (
                  <div
                    key={act.id}
                    className={`relative pr-6 py-1 group ${
                      idx !== 4 ? "before:content-[''] before:absolute before:right-0 before:top-8 before:w-0.5 before:h-8 before:bg-slate-100" : ""
                    }`}
                  >
                    <div className="absolute right-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors border-2 border-white shadow-sm ring-4 ring-white"></div>
                    <p className="text-[13.5px] font-bold text-slate-700 leading-relaxed mb-1">
                      {act.status === "CANCELLED"
                        ? `הגן ${act.institution.name} נסגר `
                        : act.substitute
                        ? `שובצה ${act.substitute.firstName} לגן ${act.institution.name}`
                        : `דווחה היעדרות בגן ${act.institution.name}`}
                    </p>
                  </div>
                ))}

                {dashboardData.recentActivity.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-400 font-medium italic">אין עדכונים חדשים</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsActivityModalOpen(true)}
                className="w-full py-4 bg-slate-50 border-t border-slate-100 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                צפה בהיסטוריה המלאה
                <ChevronLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {selectedPlacement && (
        <PlacementModal
          isOpen={isModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      <RecentActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        activities={dashboardData.recentActivity}
      />
    </div>
  );
}
