"use client";

import { useEffect, useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { AlertCircle, Clock } from "lucide-react";
import PlacementModal from "@/components/PlacementModal";

export default function SupervisorDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

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
    <div
      className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen text-slate-800"
      dir="rtl"
    >
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-black">
          לוח בקרה למפקחת 👋
        </h1>
      </header>

      {/* וידג'טים שבועיים */}
      <section className="mb-12">
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-black">
    {displayDaysWithoutSaturday.map((date) => {
      const statsForDay = dashboardData.weeklyPlacements.filter((p: any) =>
        isSameDay(new Date(p.date), date)
      );

      const open = statsForDay.filter((p: any) => p.status === "OPEN").length;

      return (
        <div
          key={date.toString()}
          className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm"
        >
          <p className="text-slate-400 text-xs">
            {format(date, "EEEE", { locale: he })}
          </p>
          <p className="font-bold">{format(date, "dd/MM")}</p>
          <div
            className={`mt-2 text-xs font-bold ${
              open > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {open > 0 ? `${open} חסרות` : "מאויש מלא"}
          </div>
        </div>
      );
    })}
  </div>
</section>


      {dashboardData.pendingUpdates &&
        dashboardData.pendingUpdates.length > 0 && (
          <section className="mb-8 animate-pulse-slow">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 text-amber-800">
                <div className="bg-amber-500 text-white p-2 rounded-lg">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    ישנם {dashboardData.pendingUpdates.length} שיבוצים מהעבר
                    שממתינים לעדכון
                  </h2>
                  <p className="text-sm">
                    אנא עדכני האם הגנים אוישו או נסגרו כדי לשמור על סדר המערכת.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.pendingUpdates.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white border border-amber-100 p-4 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.institution.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.mainTeacher.firstName} {item.mainTeacher.lastName}
                      </p>
                      <p className="text-xs font-bold text-amber-600 mt-1">
                        תאריך: {format(new Date(item.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPlacement(item);
                          setIsModalOpen(true);
                        }}
                        className="text-xs bg-slate-800 text-white px-3 py-2 rounded-lg font-bold hover:bg-slate-700 transition-all"
                      >
                        עדכון שיבוץ
                      </button>
                      <button
                        onClick={() => handleCloseGarden(item.id)}
                        className="text-xs border border-amber-300 text-amber-700 px-3 py-2 rounded-lg font-bold hover:bg-amber-100 transition-all"
                      >
                        הגן נסגר
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      {dashboardData.pendingUpdates &&
        dashboardData.pendingUpdates.length > 0 && (
          <div className="mb-8 bg-orange-50 border-r-4 border-orange-500 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-orange-600" size={28} />
              <h2 className="text-xl font-bold text-orange-900">
                יש לעדכן נתונים מהעבר ({dashboardData.pendingUpdates.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.pendingUpdates.map((alert: any) => (
                <div
                  key={alert.id}
                  className="bg-white p-4 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p className="font-bold">{alert.institution.name}</p>
                    <p className="text-xs text-slate-500">
                      {alert.mainTeacher.firstName} {alert.mainTeacher.lastName}
                    </p>
                    <p className="text-xs text-orange-600 font-bold">
                      {format(new Date(alert.date), "dd/MM")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedPlacement(alert);
                        setIsModalOpen(true);
                      }}
                      className="bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded hover:bg-slate-700 font-bold"
                    >
                      עדכון
                    </button>
                    <button
                      onClick={() => handleCloseGarden(alert.id)}
                      className="border border-red-200 text-red-600 text-[10px] px-2 py-1.5 rounded hover:bg-red-50 font-bold"
                    >
                      סגירה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600 italic">
            🚨 קריאות דחופות
          </h2>
          {dashboardData.urgentAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm text-black"
            >
              <div>
                <p className="font-bold text-lg">{alert.institution.name}</p>
                <p className="text-sm text-slate-500">
                  {alert.mainTeacher.firstName} {alert.mainTeacher.lastName}
                </p>
                <p className="text-xs text-blue-600 font-bold mt-1">
                  {format(new Date(alert.date), "dd/MM/yyyy")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPlacement(alert);
                    setIsModalOpen(true);
                  }}
                  className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md"
                >
                  שבצי מחליפה
                </button>
                <button
                  onClick={() => handleCloseGarden(alert.id)}
                  className="bg-white text-red-600 border border-red-200 px-5 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-all shadow-sm"
                >
                  סגירת הגן
                </button>
              </div>
            </div>
          ))}

          {dashboardData.urgentAlerts.length === 0 && (
            <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center font-bold border border-emerald-100">
              אין קריאות דחופות
            </div>
          )}
        </div>

        {/* עדכונים */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-black">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> עדכונים אחרונים
          </h2>
          {dashboardData.recentActivity.map((act: any) => (
            <div
              key={act.id}
              className="text-sm border-r-2 border-blue-100 pr-3 mb-4"
            >
              <p className="font-medium text-slate-700">
                {act.status === "CANCELLED"
                  ? `הגן ${act.institution.name} נסגר להיום`
                  : act.substitute
                  ? `שובצה ${act.substitute.firstName} לגן ${act.institution.name}`
                  : `דווחה היעדרות ב${act.institution.name}`}
              </p>
              <p className="text-[10px] text-slate-400">
                {format(new Date(act.updatedAt || act.date), "HH:mm")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedPlacement && (
        <PlacementModal
          isOpen={isModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
