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
  Shield,
  GraduationCap,
  Building,
  Info,
  CheckCircle2,
  AlertCircle,
  Award,
  Clock,
} from "lucide-react";
import ValidatedField from "./ValidatedField";
import { validations } from "@/utils/validations";
import FormInput from "./FormInput";

type AddUserFormData = {
  firstName: string;
  lastName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
  dateOfBirth: string;
  instructorId: string;
};

export default function AddUserModal({ isOpen, onClose, onSuccess }: any) {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [freeDays, setFreeDays] = useState<string[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [rotationData, setRotationData] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AddUserFormData>({
    firstName: "",
    lastName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
    dateOfBirth: "",
    instructorId: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFreeDay = (day: string) => {
    setFreeDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleRoleChange = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    // טעינת רשימת גננות רוטציה
    fetch("/api/supervisor/users-stats")
      .then((res) => res.json())
      .then((data) => {
        setRotations(data.filter((u: any) => u.roles.includes("ROTATION")));
      })
      .catch(() => setRotations([]));

    // טעינת רשימת מדריכות
    fetch("/api/supervisor/instructors")
      .then((res) => res.json())
      .then((data) => {
        setInstructors(Array.isArray(data) ? data : []);
      })
      .catch(() => setInstructors([]));
  }, [isOpen]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const isIdValid = validations.idNumber(formData.idNumber) === "";
    const isPhoneValid = validations.phoneNumber(formData.phoneNumber) === "";
    const isEmailValid = validations.email(formData.email) === "";

    if (!isIdValid || !isPhoneValid || !isEmailValid) {
      alert(
        "לא ניתן לשמור: אחד או יותר מהשדות (ת״ז, טלפון, אימייל) אינם תקינים."
      );
      setLoading(false);
      return;
    }

    try {
      const form = new FormData(e.target);
      const formProps = Object.fromEntries(form.entries()) as Record<
        string,
        string
      >;

      const payload = {
        ...formData,
        roles: selectedRoles,
        rotationData: rotationData,
        workDays: [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ].filter((d) => !freeDays.includes(d)),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
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
      alert("נרשמה בהצלחה!");

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

  if (!isOpen) return null;

  const isManager = selectedRoles.includes("MANAGER");
  const isInstructor = selectedRoles.includes("INSTRUCTOR");
  const hasSelectedRole = selectedRoles.length > 0;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl my-auto overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        {/* Header */}
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
          {/* תפקידים */}
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
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-center gap-4 ${
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

            {/* ימי חופש */}
            {(isManager || isInstructor) && (
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
          {isManager && freeDays.length > 0 && (
            <div className="space-y-4 border-t pt-6 animate-in slide-in-from-top-2">
              <h4 className="font-black text-indigo-600 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Clock size={18} /> שיוך גננת רוטציה לימי חופש
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {freeDays.map((dayId) => {
                  // מיפוי פשוט לשמות הימים
                  const dayNames: Record<string, string> = {
                    SUNDAY: "ראשון",
                    MONDAY: "שני",
                    TUESDAY: "שלישי",
                    WEDNESDAY: "רביעי",
                    THURSDAY: "חמישי",
                    FRIDAY: "שישי",
                  };

                  // לוגיקת הסינון:
                  // מציגים רק גננות שאין להן שום שיבוץ (assignment) ביום הזה
                  const availableRotationsForThisDay = rotations.filter(
                    (rt) => {
                      // בדיקה שהיום נמצא בימי העבודה שלה
                      const worksThisDay = rt.workDays?.includes(dayId);

                      // בדיקה שהיא לא תפוסה כבר בגן אחר קבוע
                      const isBusyThisDay = rt.fixedRotationsAsRotation?.some(
                        (assignment: any) => assignment.day === dayId
                      );

                      return worksThisDay && !isBusyThisDay;
                    }
                  );

                  return (
                    <div
                      key={dayId}
                      className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm transition-all hover:bg-indigo-50/50"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                          יום {dayNames[dayId]}
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          גננת משלימה קבועה
                        </span>
                      </div>

                      <select
                        className="w-48 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                        value={rotationData[dayId] || ""}
                        onChange={(e) =>
                          setRotationData({
                            ...rotationData,
                            [dayId]: e.target.value,
                          })
                        }
                      >
                        <option value="">-- בחרי גננת פנויה --</option>
                        {availableRotationsForThisDay.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.firstName} {rt.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* הודעת עזר למפקחת */}
              <p className="text-[10px] text-slate-400 font-medium italic mt-2">
                * הרשימה מציגה רק גננות רוטציה שאינן משובצות ביום הנבחר בגן אחר.
              </p>
            </div>
          )}

          {/* אם אין תפקיד נבחר */}
          {!hasSelectedRole ? (
            <div className="p-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-bold">
                יש לבחור לפחות תפקיד אחד כדי להמשיך
              </p>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-4 duration-500">
              {/* פרטי זהות ויצירת קשר */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-100">
                  <User size={14} /> פרטי זהות ויצירת קשר
                </div>

                <FormInput
                  kind="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                <FormInput
                  kind="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
                <FormInput
                  kind="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                />
                <FormInput
                  kind="phone"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                <FormInput
                  kind="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <FormInput
                  kind="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />

                {/* תאריך לידה */}
                <div
                  className={`space-y-2 ${
                    isInstructor ? "col-span-2" : "col-span-1"
                  }`}
                >
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    תאריך לידה
                  </label>
                  <div className="relative">
                    <input
                      name="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>

                {/* מדריכה מלווה - רק אם לא מדריכה */}
                {!isInstructor && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">
                      מדריכה מלווה
                    </label>
                    <div className="relative">
                      <select
                        name="instructorId"
                        required
                        value={formData.instructorId}
                        onChange={handleInputChange}
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

          {/* Footer */}
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
