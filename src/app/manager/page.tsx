"use client";
import { useState, useMemo } from "react";
import useSWR from "swr"; // ייבוא SWR
import { fetcher } from "@/utils/fetcher";
import {
  MapPin,
  CheckCircle2,
  Plus,
  Clock,
  Phone,
  Calendar,
  Building2,
  AlertCircle,
  User,
} from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import ManagerReportModal from "@/components/AddModals/ManagerReportModal";

export default function ManagerDashboard() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 1. טעינת נתוני משתמש (SWR)
  const { data: user } = useSWR("/api/auth/me", fetcher);

  // 2. טעינת דאשבורד גננת אם בזמן אמת (5 שניות)
  const { 
    data, 
    error, 
    isLoading, 
    mutate 
  } = useSWR("/api/manager/dashboard", fetcher, {
    refreshInterval: 5000,
  });

  // חישובים מבוססי נתונים (שימוש ב-useMemo לביצועים)
  const todaysPlacement = useMemo(() => {
    return data?.placements?.find(
      (p: any) => new Date(p.date).toDateString() === new Date().toDateString()
    );
  }, [data]);

  const upcomingPlacements = useMemo(() => {
    return data?.placements?.filter(
      (p: any) => new Date(p.date).toDateString() !== new Date().toDateString()
    ) || [];
  }, [data]);

  const dayMap: any = {
    SUNDAY: "ראשון",
    MONDAY: "שני",
    TUESDAY: "שלישי",
    WEDNESDAY: "רביעי",
    THURSDAY: "חמישי",
    FRIDAY: "שישי",
  };

  // מצב טעינה ראשוני
  if (isLoading && !data) return <LoadingScreen message="טוען את נתוני הגן שלך..." />;
  
  // טיפול בשגיאה
  if (error || (!data && !isLoading)) return <div className="p-10 text-center text-red-500 font-bold">שגיאה בטעינת הנתונים.</div>;
  return (
    <div className="min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            שלום, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium">
           לנוחיותך ממשק המציג את נתוני הגן שלך, באפשרותך לדווח על היעדרותך
          </p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Calendar className="text-indigo-600" size={20} />
          <span className="font-bold text-slate-700">
            {new Date().toLocaleDateString("he-IL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-indigo-100 border-2 rounded-[2.5rem] p-8 md:p-10 text-indigo-800 shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-black">{data.institution.name}</h2>
            <div className="flex items-center gap-2 opacity-90">
              <MapPin size={18} />
              <span className="font-bold">{data.institution.address}</span>
            </div>
          </div>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={24} />
            דיווח היעדרות / החלפה
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today Status */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            מה קורה היום בגן
          </h2>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            {!todaysPlacement ? (
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    הגן פועל כרגיל
                  </h3>
                  <p className="text-slate-500 font-medium">
                    לא דווחה היעדרות להיום. עבודה פורה!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                      {todaysPlacement.substitute?.firstName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-500 uppercase">
                        המחליפה להיום:
                      </p>
                      <h3 className="text-xl font-black text-slate-800">
                        {todaysPlacement.substitute
                          ? `${todaysPlacement.substitute.firstName} ${todaysPlacement.substitute.lastName}`
                          : "מחפשים מחליפה..."}
                      </h3>
                    </div>
                  </div>
                  {todaysPlacement.substitute && (
                    <a
                      href={`tel:${todaysPlacement.substitute.phoneNumber}`}
                      className="p-4 bg-slate-50 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <Phone size={20} />
                    </a>
                  )}
                </div>
                {todaysPlacement.status === "OPEN" && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={16} /> המערכת מחפשת עבורך מחליפה ברגעים
                    אלו.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permanent Team */}
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 pt-4">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            הצוות הקבוע שלי
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instructor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-400 uppercase">
                    מדריכה מלווה
                  </p>
                  <p className="font-bold text-slate-800">
                    {data.institution.instructor.firstName}{" "}
                    {data.institution.instructor.lastName}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${data.institution.instructor.phoneNumber}`}
                className="text-purple-600 p-2 hover:bg-purple-50 rounded-lg"
              >
                <Phone size={18} />
              </a>
            </div>

            {/* Rotations */}
            {data.rotations.map((rot: any) => (
              <div
                key={rot.id}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase">
                        גננת רוטציה - יום {dayMap[rot.day]}
                    </p>
                    <p className="font-bold text-slate-800">
                      {rot.rotationTeacher.firstName}{" "}
                      {rot.rotationTeacher.lastName}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${rot.rotationTeacher.phoneNumber}`}
                  className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg"
                >
                  <Phone size={18} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Upcoming Reports */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-slate-400" />
            דיווחים עתידיים
          </h2>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {upcomingPlacements.map((p: any) => (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4"
              >
                <div className="bg-slate-50 p-3 rounded-xl text-center min-w-[60px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    {new Date(p.date).toLocaleDateString("he-IL", {
                      weekday: "short",
                    })}
                  </p>
                  <p className="text-xl font-black text-slate-800">
                    {new Date(p.date).getDate()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {new Date(p.date).toLocaleDateString("he-IL", {
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">היעדרות מדווחת</p>
                  <p
                    className={`text-xs font-black ${
                      p.status === "OPEN"
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {p.status === "OPEN" ? "ממתין למחליפה" : "משובץ"}
                  </p>
                </div>
              </div>
            ))}
            {upcomingPlacements.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-bold">
                  אין דיווחים קרובים
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ManagerReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
         onSuccess={() => mutate()}
        user={user}
        existingPlacements={data?.placements || []} // <-- הוספת הפרופס הזה
      />
    </div>
  );
}
