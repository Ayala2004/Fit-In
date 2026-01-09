"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Clock, Phone, ChevronLeft } from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PlacementModal from "@/components/PlacementModal";
import AddPlacementModal from "@/components/AddModals/AddPlacementModal";
import RecentActivityModal from "@/components/RecentActivityModal";
import { useRecentActivityHistory } from "@/hooks/useRecentActivityHistory";

export default function InstructorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const history = useRecentActivityHistory("/api/instructor/history");

  // Modals
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadDashboard = async () => {
    try {
      const [dbRes, userRes] = await Promise.all([
        fetch("/api/instructor/dashboard"),
        fetch("/api/auth/me"),
      ]);
      const dbData = await dbRes.json();
      const userData = await userRes.json();

      setData(dbData);
      setUser(userData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <LoadingScreen message="טוען את הגנים שלך..." />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            שלום, {user?.name} 👋
          </h1>
          <p className="text-slate-500 font-medium">
            ניהול שוטף של {data?.myInstitutionsCount} גנים שתחת חסותך
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Urgent Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            🚨 גנים ללא שיבוץ
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {data?.urgentAlerts?.length || 0}
            </span>
          </h2>

          <div className="grid gap-4">
            {data?.urgentAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">
                      {alert.institution.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-bold">
                      הגננת {alert.mainTeacher.firstName} לא תגיע ב-
                      {new Date(alert.date).toLocaleDateString("he-IL")}
                    </p>
                    <a
                      href={`tel:${alert.mainTeacher.phoneNumber}`}
                      className="text-xs text-indigo-600 font-bold flex items-center gap-1 mt-1"
                    >
                      <Phone size={12} /> {alert.mainTeacher.phoneNumber}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlacement(alert)}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm"
                >
                  מצא מחליפה
                </button>
              </div>
            ))}

            {data?.urgentAlerts.length === 0 && (
              <div className="bg-indigo-50/50 p-12 rounded-[2rem] border-2 border-dashed border-indigo-100 text-center">
                <p className="text-indigo-600 font-bold italic">
                  כל הגנים שלך מאוישים כרגע. עבודה מצוינת! ✨
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Clock size={22} className="text-slate-400" />
            עדכונים אחרונים
          </h2>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-5 flex-1">
              {data.recentActivity.slice(0, 5).map((act: any, idx: number) => (
                <div
                  key={act.id}
                  className={`relative pr-6 py-1 group ${
                    idx !== 4
                      ? "before:content-[''] before:absolute before:right-0 before:top-8 before:w-0.5 before:h-8 before:bg-slate-100"
                      : ""
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

              {data.recentActivity.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400 font-medium italic">
                    אין עדכונים חדשים
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={history.open} // קריאה לפונקציה החדשה
              className="w-full py-4 bg-slate-50 border-t border-slate-100 text-sm font-black text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              {history.loadingHistory ? (
                <LoadingScreen />
              ) : (
                "צפה בהיסטוריה המלאה"
              )}
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPlacement && (
        <PlacementModal
          isOpen={!!selectedPlacement}
          placement={selectedPlacement}
          onClose={() => setSelectedPlacement(null)}
          onSuccess={loadDashboard}
        />
      )}

      {isAddModalOpen && (
        <AddPlacementModal
          isOpen={isAddModalOpen}
          date={new Date()}
          onClose={() => setIsAddModalOpen(false)}
          refreshData={loadDashboard}
          user={user}
        />
      )}
      <RecentActivityModal
        isOpen={history.isOpen}
        onClose={history.close}
        activities={history.fullHistory}
        isLoading={history.loadingHistory}
      />
    </div>
  );
}
