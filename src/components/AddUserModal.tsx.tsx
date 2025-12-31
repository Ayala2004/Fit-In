"use client";
import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Lock,
  UserCheck,
  Shield,
  GraduationCap,
  Building,
  Info,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function AddUserModal({ isOpen, onClose, onSuccess }: any) {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [freeDays, setFreeDays] = useState<string[]>([]); // שינוי למערך

  const toggleFreeDay = (day: string) => {
    setFreeDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/instructors")
        .then((res) => res.json())
        .then((data) => setInstructors(Array.isArray(data) ? data : []))
        .catch(() => setInstructors([]));
    }
  }, [isOpen]);

  const handleRoleChange = (role: string) => {
    // בגלל שלפעמים מדריכה היא גם גננת אם, נאפשר בחירה מרובה
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      const formProps = Object.fromEntries(formData.entries()) as Record<
        string,
        string
      >;

      const allWeekDays = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ];

      const payload = {
        ...formProps,
        roles: selectedRoles,
        workDays: [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ].filter((d) => !freeDays.includes(d)),
        dateOfBirth: new Date(formProps.dateOfBirth as string).toISOString(),
      };

      const res = await fetch("/api/supervisor/register", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "שגיאה ברישום");
      }

      onSuccess();
      onClose();
      setSelectedRoles([]);
      setFreeDays([]);
    } catch (err: any) {
      alert(err.message || "שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  //  פונקציית עזר לחישוב ימי עבודה
  const calculateWorkDays = (selectedFreeDay: string) => {
    const allWeekDays = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ];
    return allWeekDays.filter((day) => day !== selectedFreeDay);
  };

  if (!isOpen) return null;

  const isManager = selectedRoles.includes("MANAGER");
  const hasSelectedRole = selectedRoles.length > 0;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl my-auto overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        {/* Header - סגנון כהה ויוקרתי */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                רישום משתמשת חדשה
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
                <Info size={14} /> הקימי פרופיל חדש במערכת הפיקוח
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll"
        >
          {/* סקציה 1: בחירת תפקיד */}
          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
              <Shield size={16} className="text-indigo-500" /> בחרי תפקיד/ים
              במערכת:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "MANAGER",
                  label: "גננת אם",
                  desc: "ניהול גן קבוע",
                  icon: Building,
                },
                {
                  id: "INSTRUCTOR",
                  label: "מדריכה",
                  desc: "ליווי פדגוגי והדרכה",
                  icon: GraduationCap,
                },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-4 group ${
                    selectedRoles.includes(role.id)
                      ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                      : "border-slate-100 hover:border-indigo-200 bg-white"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl transition-colors ${
                      selectedRoles.includes(role.id)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 text-slate-400 group-hover:text-indigo-500"
                    }`}
                  >
                    <role.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-black ${
                        selectedRoles.includes(role.id)
                          ? "text-indigo-900"
                          : "text-slate-700"
                      }`}
                    >
                      {role.label}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {role.desc}
                    </div>
                  </div>
                  {selectedRoles.includes(role.id) && (
                    <CheckCircle2 size={18} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
            {(selectedRoles.includes("MANAGER") ||
              selectedRoles.includes("INSTRUCTOR")) && (
              <div className="space-y-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <label className="text-xs font-black text-indigo-900 flex items-center gap-2">
                  <Calendar size={14} /> בחרי ימי חופש קבועים (ניתן לבחור יותר
                  מאחד):
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "SUNDAY", label: "א'" },
                    { id: "MONDAY", label: "ב'" },
                    { id: "TUESDAY", label: "ג'" },
                    { id: "WEDNESDAY", label: "ד'" },
                    { id: "THURSDAY", label: "ה'" },
                    { id: "FRIDAY", label: "ו'" },
                  ].map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleFreeDay(day.id)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${
                        freeDays.includes(day.id)
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white text-slate-400 border-slate-100 hover:border-indigo-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-indigo-400 font-medium">
                  * בימים אלו המשתמשת לא תופיע כזמינה לשיבוץ/ניהול.
                </p>
              </div>
            )}
          </div>

          {!hasSelectedRole ? (
            <div className="p-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-bold">
                יש לבחור לפחות תפקיד אחד כדי להמשיך
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
                <User size={14} /> פרטי זהות ויצירת קשר
              </div>

              {/* שורת שם */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    שם פרטי
                  </label>
                  <div className="relative">
                    <input
                      name="firstName"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="ישראל"
                    />
                    <User
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    שם משפחה
                  </label>
                  <div className="relative">
                    <input
                      name="lastName"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="ישראלי"
                    />
                    <User
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
              </div>

              {/* שורת קשר */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    מספר תעודת זהות
                  </label>
                  <div className="relative">
                    <input
                      name="idNumber"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                      placeholder="9 ספרות"
                    />
                    <CreditCard
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    מספר טלפון
                  </label>
                  <div className="relative">
                    <input
                      name="phoneNumber"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-left"
                      placeholder="050-0000000"
                      dir="ltr"
                    />
                    <Phone
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
              </div>

              {/* שורת אימייל וסיסמה */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    אימייל (ישמש להתחברות)
                  </label>
                  <div className="relative">
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-left"
                      placeholder="name@email.com"
                      dir="ltr"
                    />
                    <Mail
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    סיסמה זמנית
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type="password"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-left"
                      placeholder="******"
                      dir="ltr"
                    />
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
              </div>

              {/* שורת תאריך לידה ומדריכה */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    תאריך לידה
                  </label>
                  <div className="relative">
                    <input
                      name="dateOfBirth"
                      type="date"
                      required
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>

                {isManager && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">
                      מדריכה מלווה
                    </label>
                    <div className="relative">
                      <select
                        name="instructorId"
                        required
                        className="w-full pr-10 pl-4 py-3 bg-indigo-50/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 outline-none appearance-none"
                      >
                        <option value="">בחרי מדריכה...</option>
                        {instructors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.firstName} {i.lastName}
                          </option>
                        ))}
                      </select>
                      <GraduationCap
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400"
                        size={16}
                      />
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-6 flex gap-4 shrink-0">
            <button
              type="submit"
              disabled={loading || !hasSelectedRole}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:shadow-none active:scale-95"
            >
              {loading ? "יוצר משתמשת..." : "סיום ורישום משתמשת"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
