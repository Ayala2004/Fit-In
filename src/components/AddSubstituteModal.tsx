"use client";
import { useState, useEffect } from "react";
import { X, Search, UserCheck, Clock, Info, Calendar } from "lucide-react";
import ValidatedField from "./ValidatedField";
import { validations } from "@/utils/validations";

export default function AddSubstituteModal({ isOpen, onClose, onSuccess }: any) {
  const [role, setRole] = useState<"SUBSTITUTE" | "ROTATION">("SUBSTITUTE");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ניהול נתוני הטופס ב-State
  const [formDataState, setFormDataState] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });

  // ניהול לו"ז (רלוונטי רק לרוטציה)
  const [schedule, setSchedule] = useState<any>({
    SUNDAY: { active: true, instId: "" },
    MONDAY: { active: true, instId: "" },
    TUESDAY: { active: true, instId: "" },
    WEDNESDAY: { active: true, instId: "" },
    THURSDAY: { active: true, instId: "" },
    FRIDAY: { active: true, instId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/test?type=allInstitutions")
        .then((res) => res.json())
        .then((data) => setInstitutions(Array.isArray(data) ? data : []));
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDataState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // 1. וולידציה סופית
    const isIdValid = validations.idNumber(formDataState.idNumber) === "";
    const isPhoneValid = validations.phoneNumber(formDataState.phoneNumber) === "";
    const isEmailValid = validations.email(formDataState.email) === "";

    if (!isIdValid || !isPhoneValid || !isEmailValid) {
      alert("נא לתקן את השגיאות בטופס (תעודת זהות, טלפון או אימייל שגויים)");
      return;
    }

    if (!formDataState.dateOfBirth) {
      alert("נא להזין תאריך לידה");
      return;
    }

    setLoading(true);

    // 2. חישוב ימי עבודה
    const activeDays = Object.keys(schedule).filter((day) => schedule[day].active);

    // 3. בניית Payload - שימי לב: השדות חייבים להתאים בדיוק למודל User בפריזמה!
    const payload = {
      firstName: formDataState.firstName,
      lastName: formDataState.lastName,
      email: formDataState.email,
      password: formDataState.password,
      idNumber: formDataState.idNumber,
      phoneNumber: formDataState.phoneNumber,
      dateOfBirth: new Date(formDataState.dateOfBirth).toISOString(),
      roles: [role],
      isWorking: true,
      workDays: role === "SUBSTITUTE" 
        ? ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] 
        : activeDays,
      // הסרנו את notes כי הוא לא קיים במודל User ב-schema.prisma שלך
    };

    try {
      const res = await fetch("/api/supervisor/register", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onSuccess();
        onClose();
        // איפוס
        setFormDataState({
          firstName: "", lastName: "", idNumber: "",
          phoneNumber: "", email: "", password: "", dateOfBirth: "",
        });
      } else {
        const err = await res.json();
        // אם השרת מחזיר שגיאת Unique (משתמש כבר קיים)
        alert(err.message || "שגיאה ברישום המשתמשת. ייתכן שהאימייל או התעודת זהות כבר קיימים.");
      }
    } catch (error) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        
        {/* Header */}
        <div className="p-8 bg-emerald-600 text-white relative shrink-0">
          <h2 className="text-2xl font-black tracking-tight">הוספת צוות מחליף</h2>
          <p className="opacity-90 text-sm font-medium">רישום גננת מחליפה (קריאות) או גננת רוטציה</p>
          <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll">
          
          {/* בחירת תפקיד */}
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole("SUBSTITUTE")}
              className={`p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                role === "SUBSTITUTE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <UserCheck size={18} /> גננת מחליפה
            </button>
            <button
              type="button"
              onClick={() => setRole("ROTATION")}
              className={`p-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                role === "ROTATION" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <Clock size={18} /> גננת רוטציה
            </button>
          </div>

          {/* פרטים אישיים */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">שם פרטי</label>
                <input
                  name="firstName"
                  required
                  value={formDataState.firstName}
                  onChange={handleInputChange}
                  placeholder="ישראל"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">שם משפחה</label>
                <input
                  name="lastName"
                  required
                  value={formDataState.lastName}
                  onChange={handleInputChange}
                  placeholder="ישראלי"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedField
                name="idNumber"
                label="תעודת זהות"
                value={formDataState.idNumber}
                onChange={handleInputChange}
              />
              <ValidatedField
                name="phoneNumber"
                label="מספר טלפון"
                value={formDataState.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            <ValidatedField
              name="email"
              label="אימייל (שם משתמש)"
              value={formDataState.email}
              onChange={handleInputChange}
              placeholder="name@email.com"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">סיסמה להתחברות</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formDataState.password}
                  onChange={handleInputChange}
                  placeholder="******"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 mr-2">תאריך לידה</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  required
                  value={formDataState.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* לו"ז רוטציה */}
          {role === "ROTATION" && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest border-b pb-2">
                <Calendar size={14} /> הגדרת ימי עבודה קבועים
              </div>
              <div className="grid gap-3">
                {Object.keys(schedule).map((day) => (
                  <div key={day} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${schedule[day].active ? "bg-white border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                    <button
                      type="button"
                      onClick={() => setSchedule({...schedule, [day]: {...schedule[day], active: !schedule[day].active}})}
                      className={`w-24 py-2 rounded-lg text-[10px] font-black transition-all ${schedule[day].active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"}`}
                    >
                      {day === "SUNDAY" ? "ראשון" : day === "MONDAY" ? "שני" : day === "TUESDAY" ? "שלישי" : day === "WEDNESDAY" ? "רביעי" : day === "THURSDAY" ? "חמישי" : "שישי"}
                    </button>
                    <span className="text-sm font-bold text-slate-600">
                      {schedule[day].active ? "יום עבודה פעיל" : "יום חופש"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === "SUBSTITUTE" && (
            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
              <Info className="text-amber-500 shrink-0" size={24} />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                גננת מחליפה מוגדרת כזמינה "לפי קריאה". היא תקבל התראות על כל היעדרות במחוז ותוכל להשתבץ ידנית דרך האפליקציה.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:bg-slate-300"
          >
            {loading ? "מבצע רישום במערכת..." : "סיום ורישום גננת"}
          </button>
        </form>
      </div>
    </div>
  );
}