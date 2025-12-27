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
} from "lucide-react";

export default function SupervisorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [allSubstitutes, setAllSubstitutes] = useState([]);
  const [editingPlacement, setEditingPlacement] = useState<any>(null);

  // 1. טעינת נתונים ראשונית (משתמש ומחליפות)
  useEffect(() => {
    const initPage = async () => {
      try {
        // טעינת פרטי המשתמש המחובר מה-API החדש שיצרנו
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        // טעינת מחליפות דרך ה-GET הקיים ב-test route
        const subsRes = await fetch('/api/test?role=SUBSTITUTE');
        if (subsRes.ok) {
          const subsData = await subsRes.json();
          setAllSubstitutes( subsData);
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
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "getCalendarData",
          data: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            supervisorId: user.id
          }
        })
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
        const type = (val === 'CANCEL' || val === 'OPEN') ? 'updateStatus' : 'assign';
        const bodyData = type === 'assign' 
            ? { placementId: editingPlacement.id, substituteId: val }
            : { placementId: editingPlacement.id, newStatus: val === 'CANCEL' ? 'CANCELLED' : 'OPEN', managerId: user.id };

        const res = await fetch('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data: bodyData })
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
              <h1 className="text-2xl font-bold text-slate-800">יומן שיבוצים חודשי</h1>
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

        {/* הלוח */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-200">
            {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map(
              (d) => (
                <div key={d} className="p-4 text-center font-bold text-slate-400 text-xs uppercase tracking-widest">
                  {d}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[150px] border-l border-b border-slate-50" />;
              }

              const isSaturday = day.getDay() === 6;
              const dayPlacements = Array.isArray(placements) 
                ? placements.filter((p: any) => isSameDay(new Date(p.date), day))
                : [];

              return (
                <div
                  key={day.toString()}
                  className={`min-h-[150px] border-l border-b border-slate-100 p-3 transition-all ${
                    isSaturday ? "bg-slate-50/50" : "hover:bg-blue-50/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-black ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-300'}`}>
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
                          <div className={`text-[9px] mt-1 flex items-center gap-1 ${
                               p.status === "OPEN" ? "text-orange-500 font-bold" : "text-emerald-500 font-medium"
                             }`}>
                            <div className={`w-1 h-1 rounded-full ${p.status === "OPEN" ? "bg-orange-500" : "bg-emerald-500"}`} />
                            {p.status === "OPEN" ? "ממתין" : p.status === "CANCELLED" ? "סגור" : p.substitute?.firstName}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">עריכת שיבוץ</h3>
                <p className="text-xs text-slate-800">{format(new Date(editingPlacement.date), "dd/MM/yyyy")}</p>
              </div>
              <button onClick={() => setEditingPlacement(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-widest">בחירת מחליפה או פעולה</label>
                <select
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all appearance-none bg-slate-50"
                  onChange={(e) => handleQuickUpdate(e.target.value)}
                  value=""
                >
                  <option value="" disabled className="text-gray-800"> בחרי מחליפה מתוך הרשימה </option>
                  <option value="CANCEL" className="text-red-600 font-bold">🚫 סגירת הגן (ביטול יום)</option>
                  <option value="OPEN" className="text-orange-600">🔓 החזר למצב פתוח (מחיקת מחליפה)</option>
                  <optgroup label="גננות מחליפות זמינות" className="text-black">
                    {allSubstitutes.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>👤 {sub.firstName} {sub.lastName}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}