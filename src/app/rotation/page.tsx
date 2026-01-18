"use client";
import { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  Plus,
  ChevronLeft,
  Building2,
  RefreshCcwDot
} from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import CustomDatePicker from "@/components/ui/CustomDatePicker";

// תרגום ימים
const dayMap: any = {
  SUNDAY: "ראשון",
  MONDAY: "שני",
  TUESDAY: "שלישי",
  WEDNESDAY: "רביעי",
  THURSDAY: "חמישי",
  FRIDAY: "שישי",
};

export default function RotationDashboard() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportDate, setReportDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadDashboard = async () => {
    try {
      const [dbRes, userRes] = await Promise.all([
        fetch("/api/rotation/dashboard"),
        fetch("/api/auth/me"),
      ]);
      if (dbRes.ok && userRes.ok) {
        setData(await dbRes.json());
        setUser(await userRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleReportAbsence = async (e: any) => {
    e.preventDefault();
    if (!reportDate) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/rotation/report", {
        method: "POST",
        body: JSON.stringify({ date: reportDate }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIsModalOpen(false);
        setReportDate("");
        loadDashboard();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (e) {
      alert("שגיאה בתקשורת");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="טוען את סידור העבודה שלך..." />;

  // מציאת הגן של היום לפי הלו"ז הקבוע
  const todayName = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const todayFixedAssignment = data?.fixedSchedule?.find(
    (s: any) => s.day === todayName,
  );

  // בדיקה האם יש שיבוץ מיוחד להיום (החלפה פנימית או מחליפה שנכנסה במקומי)
  const todayPlacement = data?.placements?.find(
    (p: any) => new Date(p.date).toDateString() === new Date().toDateString(),
  );

  const getTodayStatus = () => {
    const today = new Date();
    const dayNameEn = today
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    // 1. חיפוש שיבוץ בפועל בטבלת Placements (היעדרות שלי או החלפה שאני עושה)
    const todayAct = data?.placements?.find(
      (p: any) => new Date(p.date).toDateString() === today.toDateString(),
    );

    // 2. חיפוש גן קבוע בלו"ז
    const fixed = data?.fixedSchedule?.find((s: any) => s.day === dayNameEn);

    // מקרה א': דיווחתי על היעדרות (אני ה-mainTeacher בשיבוץ)
    if (todayAct && todayAct.mainTeacherId === user?.id) {
      return {
        title: "דיווחת על היעדרות",
        sub: todayAct.institution?.name || "בגן הקבוע שלך",
        type: "ABSENT",
        color: "bg-red-50 border-red-200 text-red-700",
        icon: <AlertCircle size={32} />,
      };
    }

    // מקרה ב': אני רשומה כמחליפה (מישהו ביקש ממני להגיע, או החלפה פנימית)
    if (todayAct && todayAct.substituteId === user?.id) {
      return {
        title: `מילוי מקום: ${todayAct.institution?.name}`,
        sub: todayAct.institution?.address,
        type: "SPECIAL",
        color: "bg-purple-50 border-purple-200 text-purple-700",
        icon: <ArrowLeftRight size={32} />,
      };
    }

    // מקרה ג': יום עבודה רגיל בגן הקבוע
    if (fixed) {
      const inst = fixed.manager.mainManagedInstitutions[0];
      return {
        title: inst?.name || "גן קבוע",
        sub: inst?.address || "כתובת לא הוזנה",
        type: "FIXED",
        color: "bg-white border-indigo-100 text-slate-800",
        icon: <Building2 size={32} />,
      };
    }

    // מקרה ד': יום חופשי (אין גן קבוע ואין שיבוץ מיוחד)
    return {
      title: "יום חופשי",
      sub: "לא מוגדר גן ליום זה",
      type: "FREE",
      color: "bg-slate-50 border-slate-200 text-slate-500",
      icon: <Clock size={32} />,
    };
  };

  const status = getTodayStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            שלום, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium">
            מרכז ניהול אישי לגננת רוטציה
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> דיווח היעדרות
        </button>
      </header>

      {/* Hero Section: איפה אני היום? */}
      <section
        className={`rounded-[2.5rem] p-8 border-2 shadow-xl shadow-indigo-100/20 relative overflow-hidden transition-all ${status.color}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-6 text-right w-full md:w-auto">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                status.type === "FIXED"
                  ? "bg-indigo-600 text-white"
                  : status.type === "ABSENT"
                    ? "bg-red-500 text-white"
                    : status.type === "SPECIAL"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-300 text-white"
              }`}
            >
              {status.icon}
            </div>
            <div>
              <p className="font-black text-[10px] uppercase tracking-[0.15em] opacity-60 mb-1">
                {status.type === "FIXED"
                  ? "הגן הקבוע שלי להיום:"
                  : status.type === "SPECIAL"
                    ? "שיבוץ מיוחד להיום:"
                    : status.type === "ABSENT"
                      ? "סטטוס נוכחות:"
                      : "היום שלך:"}
              </p>
              <h2 className="text-3xl font-black leading-tight">
                {status.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 opacity-80 font-bold text-sm">
                {status.type !== "FREE" && <MapPin size={14} />}
                <span>{status.sub}</span>
              </div>
            </div>
          </div>

          {/* כפתור מהיר / תג סטטוס */}
          <div className="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-3xl border border-black/5 flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                status.type === "ABSENT" ? "bg-red-500" : "bg-emerald-500"
              }`}
            />
            <span className="font-black text-sm uppercase">
              {status.type === "ABSENT" ? "לא בעבודה" : "פעילה במערכת"}
            </span>
          </div>
        </div>

        {/* עיטור רקע עדין */}
        <div className="absolute -bottom-6 -left-6 opacity-[0.03] pointer-events-none">
          {status.icon}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* הלו"ז השבועי הקבוע שלי */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            לו"ז שבועי קבוע
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(dayMap).map((dayKey) => {
              const assignment = data.fixedSchedule.find(
                (s: any) => s.day === dayKey,
              );
              return (
                <div
                  key={dayKey}
                  className={`p-5 rounded-3xl border transition-all ${assignment ? "bg-white border-slate-200" : "bg-slate-50/50 border-dashed border-slate-200 opacity-60"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-black text-indigo-600 text-sm">
                      יום {dayMap[dayKey]}
                    </span>
                    {assignment && (
                      <Clock size={16} className="text-slate-300" />
                    )}
                  </div>
                  {assignment ? (
                    <div>
                      <p className="font-black text-slate-800">
                        {assignment.manager.mainManagedInstitutions[0]?.name}
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
                        <User size={12} /> גננת אם:{" "}
                        {assignment.manager.firstName}{" "}
                        {assignment.manager.lastName}
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs font-bold italic">
                      יום חופשי / ללא שיבוץ קבוע
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* עדכונים ושינויים */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <RefreshCcwDot  size={22} className="text-slate-400" />
            שינויים ועדכונים
          </h2>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 space-y-5 flex-1">
              {data.placements.length > 0 ? (
                data.placements.map((p: any, idx: number) => (
                  <div key={p.id} className="relative pr-6 py-1 group">
                    <div
                      className={`absolute right-[-4px] top-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-4 ring-white ${p.mainTeacherId === user.id ? "bg-red-400" : "bg-indigo-400"}`}
                    ></div>
                    <p className="text-[13.5px] font-bold text-slate-700 leading-relaxed">
                      {p.mainTeacherId === user.id
                        ? `היעדרות מדווחת ב-${new Date(p.date).toLocaleDateString("he-IL")}`
                        : `החלפת את ${p.mainTeacher.firstName} ב-${new Date(p.date).toLocaleDateString("he-IL")}`}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">
                      גן: {p.institution.name}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold italic text-sm">
                  אין שינויים עתידיים
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* מודאל דיווח היעדרות */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black">דיווח על היעדרות</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleReportAbsence} className="p-8 space-y-6">
              <CustomDatePicker
                label="בחרי את תאריך ההיעדרות"
                value={reportDate}
                onChange={setReportDate}
                allowFutureDates={true}
              />
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                  שימי לב: המערכת תזהה אוטומטית באיזה גן את אמורה להיות ביום זה
                  ותשלח התראה למנהלת הגן ולמפקחת.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting || !reportDate}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:bg-slate-200"
              >
                {submitting ? "מעדכן..." : "שליחת דיווח"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
