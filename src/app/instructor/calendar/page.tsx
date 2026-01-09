"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
} from "date-fns";
import { he } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  AlertCircle,
  User,
  Plus,
  Search,
} from "lucide-react";
import AddPlacementModal from "@/components/AddModals/AddPlacementModal";

export default function InstructorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [editingPlacement, setEditingPlacement] = useState<any>(null);
  const [availableSubs, setAvailableSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchAvailableSubstitutes = async (date: Date) => {
    setLoadingSubs(true);
    try {
      const dateParam = encodeURIComponent(date.toISOString());
      const res = await fetch(`/api/supervisor/substitutes?date=${dateParam}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSubs(data);
      }
    } catch (err) {
      console.error("Error fetching subs:", err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const filteredAvailableSubs = useMemo(() => {
    return availableSubs.filter((sub: any) => {
      const fullName = `${sub.firstName} ${sub.lastName}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        sub.phoneNumber?.includes(searchQuery)
      );
    });
  }, [availableSubs, searchQuery]);

  useEffect(() => {
    const initPage = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initPage();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar?month=${
          currentDate.getMonth() + 1
        }&year=${currentDate.getFullYear()}`
      );
      const data = await res.json();
      setPlacements(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (editingPlacement) {
      fetchAvailableSubstitutes(new Date(editingPlacement.date));
      setSearchQuery("");
    }
  }, [editingPlacement]);

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את הדיווח לצמיתות?")) return;
    try {
      const res = await fetch(`/api/calendar`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setPlacements((prev) => prev.filter((p: any) => p.id !== id));
      else alert("אין לך הרשאה למחוק דיווח זה");
    } catch (err) {
      alert("שגיאה במחיקה");
    }
  };

  const handleQuickUpdate = async (val: string) => {
    if (!editingPlacement) return;
    try {
      const type =
        val === "CANCEL" || val === "OPEN" ? "updateStatus" : "assign";
      const bodyData =
        type === "assign"
          ? { placementId: editingPlacement.id, substituteId: val }
          : {
              placementId: editingPlacement.id,
              newStatus: val === "CANCEL" ? "CANCELLED" : "OPEN",
              managerId: user.id,
            };

      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: bodyData }),
      });

      if (res.ok) {
        setEditingPlacement(null);
        fetchData();
      }
    } catch (err) {
      alert("שגיאה בעדכון");
    }
  };

  const getPlacementColor = (p: any) => {
    if (p.status === "OPEN")
      return "bg-amber-50 border-amber-200 text-amber-700";
    if (p.status === "CANCELLED")
      return "bg-red-50 border-red-200 text-red-700";

    const subId = p.substituteId ? String(p.substituteId) : null;
    const absentId = String(p.mainTeacherId);
    const gardenManagerId = String(p.institution?.mainManagerId);
    const gardenRotationIds = (
      p.institution?.mainManager?.fixedRotationsAsManager || []
    ).map((r: any) => String(r.rotationTeacherId));

    if (gardenRotationIds.includes(absentId)) {
      if (subId === gardenManagerId)
        return "bg-indigo-200 border-indigo-400 text-indigo-900 shadow-sm";
      return "bg-purple-200 border-purple-400 text-purple-900 shadow-sm";
    }
    if (absentId === gardenManagerId) {
      if (subId && gardenRotationIds.includes(subId))
        return "bg-slate-300 border-slate-400 text-slate-900 shadow-sm";
      return "bg-white border-slate-200 text-slate-700";
    }
    return "bg-white border-slate-100 text-slate-700";
  };

  const isMyPlacement = (p: any) => p.mainTeacher?.instructorId === user?.id;

  const firstDayOfMonth = startOfMonth(currentDate);
  const startWeekDay = firstDayOfMonth.getDay();
  const realDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
  const paddingDays = Array.from({ length: startWeekDay }, () => null);
  const days = [...paddingDays, ...realDays];

  if (!user && loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                יומן שיבוצים חודשי
              </h1>
              <p className="text-slate-400 text-sm font-medium italic">
                המפקחת: {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"
            >
              <ChevronRight />
            </button>
            <span className="text-xl font-bold text-slate-700 min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: he })}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"
            >
              <ChevronLeft />
            </button>
          </div>
        </div>

        {/* Legend / מפת צבעים */}
        <div className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-slate-100 flex flex-wrap gap-4 text-xs font-bold justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-200 border border-indigo-400 rounded"></div>
            <span>אם מחליפה רוטציה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-200 border border-purple-400 rounded"></div>
            <span>מחליפה לרוטציה</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-200 border border-slate-400 rounded"></div>
            <span>רוטציה קבועה מחליפה אם</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
            <span>מחליפה חיצונית לאם</span>
          </div>
        </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-200">
              {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map(
                (d) => (
                  <div
                    key={d}
                    className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-widest"
                  >
                    {d}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[150px] border-l border-b border-slate-50"
                    />
                  );
                }

              const isSaturday = day.getDay() === 6;
              const isToday = isSameDay(day, new Date());
               const isPast = day < startOfDay(new Date()) && !isToday;
              const dayPlacements = Array.isArray(placements)
                ? placements.filter((p: any) =>
                    isSameDay(new Date(p.date), day)
                  )
                : [];

              return (
                <div
                  key={day.toString()}
                  className={`min-h-37.5 border-l border-b border-slate-100 p-5 flex flex-col transition-all ${
                    isSaturday ? "bg-slate-50/50" : "hover:bg-indigo-50/5"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span
                      className={`text-sm font-black transition-colors ${
                        isToday
                          ? "bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md shadow-indigo-100"
                          : "text-slate-400"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                   {!isSaturday && (!isPast || user?.roles.includes("SUPERVISOR")) && (
                      <button 
                        onClick={() => { setSelectedDate(day); setIsAddModalOpen(true); }} 
                        className="p-1 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-md transition-all group/btn" 
                        title="הוספת דיווח"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                  {isSaturday ? (
                    <div className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                      יום מנוחה
                    </div>
                  ) : (
                    <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden custom-calendar-scroll">
                      {" "}
                      {dayPlacements.map((p: any) => {
                        const colorClass = getPlacementColor(p); // חישוב הצבע

                        return (
                          <div
                            key={p.id}
                            // התיקון כאן: הסרנו את bg-white ו-border-slate-100 הקבועים והשתמשנו ב-colorClass
                            className={`group relative p-2 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${colorClass}`}
                            onClick={() => setEditingPlacement(p)}
                          >
                            <div className="text-[14px] font-bold leading-tight">
                              {p.mainTeacher?.firstName}{" "}
                              {p.mainTeacher?.lastName}
                            </div>

                            <div
                              className={`text-[12px] mt-1 flex items-center gap-1.5 font-bold`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.status === "OPEN"
                                    ? "bg-amber-500 animate-pulse"
                                    : p.status === "CANCELLED"
                                    ? "bg-red-500"
                                    : "bg-emerald-500"
                                }`}
                              />
                              {p.status === "OPEN"
                                ? "ממתין"
                                : p.status === "CANCELLED"
                                ? "סגור"
                                : p.substitute
                                ? `${p.substitute.firstName} ${p.substitute.lastName[0]}.`
                                : "משובץ"}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(p.id);
                              }}
                              className="absolute -top-1.5 -left-1.5 opacity-0 group-hover:opacity-100 bg-white text-red-500 p-1 rounded-full shadow-md border border-red-50 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- מודאל עריכה (התיקון שעשינו) --- */}
      {editingPlacement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight">
                  עריכת שיבוץ
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  {format(new Date(editingPlacement.date), "EEEE, dd/MM/yyyy", {
                    locale: he,
                  })}
                  <span className="mx-2">|</span> גן{" "}
                  {editingPlacement.institution?.name}
                </p>
              </div>

              <button
                onClick={() => setEditingPlacement(null)}
                className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleQuickUpdate("CANCEL")}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border-2 border-transparent hover:border-red-500 hover:text-red-600 transition-all shadow-sm group"
              >
                <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <X size={20} />
                </div>
                <span className="text-xs font-black uppercase">סגירת הגן</span>
              </button>
              <button
                onClick={() => handleQuickUpdate("OPEN")}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border-2 border-transparent hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm group"
              >
                <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <AlertCircle size={20} />
                </div>
                <span className="text-xs font-black uppercase">
                  החזרה להמתנה
                </span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
                <Search size={16} className="text-indigo-500" /> שיבוץ גננת
                מחליפה:
              </label>
              <input
                type="text"
                placeholder="חפשי לפי שם או טלפון..."
                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2">
              {loadingSubs ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                  <p className="text-slate-400 text-sm font-bold">
                    בודק זמינות מחליפות...
                  </p>
                </div>
              ) : filteredAvailableSubs.length > 0 ? (
                filteredAvailableSubs.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shadow-md">
                        {sub.firstName[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">
                          {sub.firstName} {sub.lastName}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {sub.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickUpdate(sub.id)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      שבצי
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <User size={20} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-900 font-black text-lg">
                    אין מחליפות פנויות
                  </p>
                  <p className="text-slate-500 text-sm">
                    נסו לבדוק תאריך אחר או לשנות סטטוס
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && selectedDate && (
        <AddPlacementModal
          isOpen={isAddModalOpen}
          date={selectedDate}
          onClose={() => setIsAddModalOpen(false)}
          refreshData={fetchData}
          user={user}
        />
      )}
    </div>
  );
}
