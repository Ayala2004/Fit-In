"use client";
import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
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
} from "lucide-react";

export default function SupervisorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [allSubstitutes, setAllSubstitutes] = useState([]);
  const [editingPlacement, setEditingPlacement] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // סינון המחליפות לפי חיפוש
  const filteredSubstitutes = allSubstitutes.filter((sub: any) => {
    const fullName = `${sub.firstName} ${sub.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  // 1. טעינת נתונים ראשונית (משתמש ומחליפות)
  useEffect(() => {
    const initPage = async () => {
      try {
        // טעינת פרטי המשתמש המחובר מה-API החדש שיצרנו
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        // טעינת מחליפות דרך ה-GET הקיים ב-test route
        const subsRes = await fetch("/api/test?role=SUBSTITUTE");
        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setAllSubstitutes(subsData);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    initPage();
  }, []);

  // 2. שליפת נתוני השיבוצים - שימוש ב-POST כפי שמוגדר ב-test route
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "getCalendarData",
          data: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            supervisorId: user.id,
          },
        }),
      });

      const data = await res.json();
      // בדיקה אם הנתונים הם מערך לפני שמירה ב-state
      setPlacements(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // פונקציית מחיקה (צריך לוודא שיש לך DELETE ב-api/calendar או להשתמש ב-test POST)
  const handleDelete = async (id: string) => {
    if (!confirm("למחוק את הדיווח לצמיתות?")) return;
    try {
      const res = await fetch(`/api/calendar`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (res.ok) setPlacements((prev) => prev.filter((p: any) => p.id !== id));
    } catch (err) {
      alert("שגיאה במחיקה");
    }
  };

  // פונקציית עדכון מהמודאל
  const handleQuickUpdate = async (val: string) => {
    if (!editingPlacement) return;

    try {
      // שימוש ב-assign או updateStatus בהתאם לבחירה
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

  // חישוב ימי הלוח
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
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* כותרת וניווט חודשים */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                יומן שיבוצים חודשי
              </h1>
              <p className="text-slate-400 text-sm">המפקחת: {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-slate-100 p-2 rounded-2xl border border-slate-200">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"
            >
              <ChevronRight />
            </button>
            <span className="text-xl font-bold text-slate-700 min-w-35 text-center">
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

        {/* הלוח */}
        <div className="bg-white rounded-4xl shadow-xl border border-slate-200 overflow-hidden">
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
                    className="min-h-37 border-l border-b border-slate-50"
                  />
                );
              }

              const isSaturday = day.getDay() === 6;
              const dayPlacements = Array.isArray(placements)
                ? placements.filter((p: any) =>
                    isSameDay(new Date(p.date), day)
                  )
                : [];

              return (
                <div
                  key={day.toString()}
                  className={`min-h-37 border-l border-b border-slate-100 p-3 transition-all ${
                    isSaturday ? "bg-slate-50/50" : "hover:bg-blue-50/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-sm font-black ${
                        isSameDay(day, new Date())
                          ? "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full"
                          : "text-slate-300"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {isSaturday ? (
                    <div className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                      יום מנוחה
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {dayPlacements.map((p: any) => (
                        <div
                          key={p.id}
                          className="group relative p-2 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setEditingPlacement(p)}
                        >
                          <div className="text-[10px] font-bold text-slate-700 leading-tight">
                            {p.mainTeacher?.firstName} {p.mainTeacher?.lastName}
                          </div>
                          <div
                            className={`text-[9px] mt-1 flex items-center gap-1 ${
                              p.status === "OPEN"
                                ? "text-orange-500 font-bold"
                                : "text-emerald-500 font-medium"
                            }`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${
                                p.status === "OPEN"
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                            {p.status === "OPEN"
                              ? "ממתין"
                              : p.status === "CANCELLED"
                              ? "סגור"
                              : p.substitute?.firstName}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id);
                            }}
                            className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full shadow-lg transition-opacity hover:bg-red-600"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* מודאל עריכה */}
      {editingPlacement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  עריכת שיבוץ
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(editingPlacement.date), "dd/MM/yyyy")}
                </p>
              </div>
              <button
                onClick={() => setEditingPlacement(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  בחירת מחליפה או פעולה
                </label>

                {/* כפתורי פעולה מהירה */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleQuickUpdate("CANCEL")}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all text-right group"
                  >
                    <div className="flex items-center gap-3">
                      <div className=" p-2 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                        <X size={20} className="text-red-600 " />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          סגירת הגן
                        </div>
                        <div className="text-xs text-gray-500">ביטול יום</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickUpdate("OPEN")}
                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-right group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                        <AlertCircle size={20} className="text-orange-600 " />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          מחיקת שיבוץ
                        </div>
                        <div className="text-xs text-gray-500">
                          פתחי את האפשרות לשיבוץ מחדש
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* חיפוש וברירת מחליפה */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="חיפוש גננת מחליפה..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    />
                    <User
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredSubstitutes.length > 0 ? (
                      filteredSubstitutes.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => handleQuickUpdate(sub.id)}
                          className="w-full p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-right flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                            <User size={18} className="text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {sub.firstName} {sub.lastName}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        לא נמצאו גננות מחליפות
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
