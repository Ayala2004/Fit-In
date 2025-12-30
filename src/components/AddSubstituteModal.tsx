"use client";
import { useState, useEffect } from "react";
import { X, Search, Sparkles, UserCheck, Clock, MapPin, Info, Calendar } from "lucide-react";

export default function AddSubstituteModal({ isOpen, onClose, onSuccess }: any) {
  const [role, setRole] = useState<"SUBSTITUTE" | "ROTATION">("SUBSTITUTE");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [instSearch, setInstSearch] = useState("");

  const [schedule, setSchedule] = useState<any>({
    SUNDAY: { active: true, instId: "", name: "" },
    MONDAY: { active: true, instId: "", name: "" },
    TUESDAY: { active: true, instId: "", name: "" },
    WEDNESDAY: { active: true, instId: "", name: "" },
    THURSDAY: { active: true, instId: "", name: "" },
    FRIDAY: { active: true, instId: "", name: "" },
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/test?type=allInstitutions")
        .then(res => res.json())
        .then(data => setInstitutions(Array.isArray(data) ? data : []));
    }
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    const activeDays = Object.keys(schedule).filter(day => schedule[day].active);

    const payload = {
      ...formProps,
      roles: [role],
      isWorking: true,
      dateOfBirth: new Date(formProps.dateOfBirth as string).toISOString(),
      workDays: role === "SUBSTITUTE" ? ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] : activeDays,
      notes: role === "ROTATION" ? JSON.stringify(schedule) : "גננת מחליפה מחוזית",
    };

    const res = await fetch("/api/supervisor/register", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      const err = await res.json();
      alert(err.message || "שגיאה ברישום");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-8 bg-emerald-600 text-white relative">
          <h2 className="text-2xl font-black">הוספת צוות מחליף</h2>
          <p className="opacity-90 text-sm">גננת מחליפה (קריאות מזדמנות) או רוטציה (לו"ז קבוע)</p>
          <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll text-right">
          
          {/* בחירת תפקיד - בלעדי */}
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setRole("SUBSTITUTE")} className={`p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${role === "SUBSTITUTE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}>
              <UserCheck size={18} /> גננת מחליפה
            </button>
            <button type="button" onClick={() => setRole("ROTATION")} className={`p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${role === "ROTATION" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}>
              <Clock size={18} /> גננת רוטציה
            </button>
          </div>

          {/* פרטים אישיים */}
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" required placeholder="שם פרטי" className="p-3 bg-slate-50 rounded-xl border-none font-bold" />
            <input name="lastName" required placeholder="שם משפחה" className="p-3 bg-slate-50 rounded-xl border-none font-bold" />
            <input name="idNumber" required placeholder="תעודת זהות" className="p-3 bg-slate-50 rounded-xl border-none font-bold" />
            <input name="phoneNumber" required placeholder="טלפון" className="p-3 bg-slate-50 rounded-xl border-none font-bold" />
            <input name="email" type="email" required placeholder="אימייל" className="p-3 bg-slate-50 rounded-xl border-none font-bold col-span-2" />
            <input name="password" type="password" required placeholder="סיסמה להתחברות" className="p-3 bg-slate-50 rounded-xl border-none font-bold col-span-2" />
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest text-right block">תאריך לידה</label>
              <input name="dateOfBirth" type="date" required className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold" />
            </div>
          </div>

          {/* לו"ז רוטציה */}
          {role === "ROTATION" && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest border-b pb-2">
                <Calendar size={14} /> הגדרת ימי עבודה וגנים קבועים
              </div>
              
              <div className="relative group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="חיפוש מהיר של גן..." 
                  className="w-full pr-10 p-2 bg-slate-100 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                {Object.keys(schedule).map((day) => (
                  <div key={day} className={`flex items-center gap-4 p-3 rounded-2xl border ${schedule[day].active ? "bg-white border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                    <button
                      type="button"
                      onClick={() => setSchedule({...schedule, [day]: {...schedule[day], active: !schedule[day].active}})}
                      className={`w-24 py-2 rounded-lg text-[10px] font-black transition-all ${schedule[day].active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"}`}
                    >
                      {day}
                    </button>
                    
                    <select
                      disabled={!schedule[day].active}
                      className="flex-1 bg-transparent border-none font-bold text-sm text-slate-600 outline-none disabled:opacity-30"
                      value={schedule[day].instId}
                      onChange={(e) => setSchedule({...schedule, [day]: {...schedule[day], instId: e.target.value}})}
                    >
                      <option value="">{schedule[day].active ? "בחרי גן..." : "לא עובדת ביום זה"}</option>
                      {institutions
                        .filter(i => i.name.includes(instSearch))
                        .map((inst: any) => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === "SUBSTITUTE" && (
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
              <Info className="text-amber-500 shrink-0" size={24} />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                גננת מחליפה מוגדרת כזמינה "מתי שבא לה". היא תקבל התראות על כל היעדרות במחוז, והמערכת תאפשר לשבץ אותה לכל גן פנוי, אלא אם היא כבר משובצת באותו יום.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">
            {loading ? "מעבד..." : "סיום ורישום"}
          </button>
        </form>
      </div>
    </div>
  );
}