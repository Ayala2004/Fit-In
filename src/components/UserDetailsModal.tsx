"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Award,
  Shield,
  Save,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Clock,
  User as UserIcon,
  CreditCard,
  Power,
  UserCheck,
  UserMinus,
} from "lucide-react";

export default function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: any) {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    idNumber: user.idNumber || "", // מגיע כבר מפוענח מה-API
    phoneNumber: user.phoneNumber || "",
    roles: user.roles || [],
    isWorking: user.isWorking ?? true,
    instructorId: user.instructorId || "",
    workDays: user.workDays || [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ],
    rotationTeacherId: user.rotationTeacherId || "",
  });

  // שליפת מדריכות עבור שיוך לגננת אם
  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/instructors")
        .then((res) => res.json())
        .then((data) => setInstructors(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Error fetching instructors:", err));
      fetch("/api/supervisor/users-stats")
        .then((res) => res.json())
        .then((data) => {
          const onlyRotations = data.filter((u: any) =>
            u.roles.includes("ROTATION")
          );
          setRotations(onlyRotations);
        });
    }
  }, [isOpen]);

  const roleLabels: any = {
    MANAGER: "גננת אם",
    INSTRUCTOR: "מדריכה",
    SUBSTITUTE: "גננת מחליפה",
    ROTATION: "גננת רוטציה",
  };

  const weekDays = [
    { id: "SUNDAY", label: "א'" },
    { id: "MONDAY", label: "ב'" },
    { id: "TUESDAY", label: "ג'" },
    { id: "WEDNESDAY", label: "ד'" },
    { id: "THURSDAY", label: "ה'" },
    { id: "FRIDAY", label: "ו'" },
  ];

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRole = (role: string) => {
    setFormData((prev: any) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r: string) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const toggleWorkDay = (dayId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      workDays: prev.workDays.includes(dayId)
        ? prev.workDays.filter((d: string) => d !== dayId)
        : [...prev.workDays, dayId],
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        onUpdateSuccess();
        onClose();
      } else {
        alert("שגיאה בעדכון הנתונים");
      }
    } catch (err) {
      alert("שגיאת תקשורת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserIcon size={30} />
            </div>
            <div>
              <h2 className="text-2xl font-black">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-slate-400 text-sm">ניהול ועריכת פרטי משתמשת</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <form
          onSubmit={handleUpdate}
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll"
        >
          {/* 1. פרטים אישיים בסיסיים */}
          <section className="space-y-4">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
              <Award size={20} className="text-indigo-500" /> פרטים אישיים
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  שם פרטי
                </label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="input-standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  שם משפחה
                </label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="input-standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <CreditCard size={14} /> תעודת זהות
                </label>
                <input
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  className="input-standard"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <Phone size={14} /> טלפון
                </label>
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="input-standard text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                  <Mail size={14} /> אימייל (שם משתמש)
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-standard text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* 2. ניהול תפקידים וסטטוס פעילות */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Shield size={20} className="text-indigo-500" /> תפקידים במערכת
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(roleLabels).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${
                      formData.roles.includes(role)
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-slate-100 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Power size={20} className="text-indigo-500" /> סטטוס עבודה
              </h4>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isWorking: !prev.isWorking,
                  }))
                }
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  formData.isWorking
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-red-500 bg-red-50 text-red-700"
                }`}
              >
                <span className="font-black">
                  {formData.isWorking ? "עובדת פעילה" : "מושבתת / לא פעילה"}
                </span>
                {formData.isWorking ? <UserCheck /> : <UserMinus />}
              </button>
            </div>
          </section>

          {/* 3. ימים חופשיים (workDays) */}
          <section className="space-y-4">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
              <Clock size={20} className="text-indigo-500" /> ימי עבודה / חופש
            </h4>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => {
                const isActive = formData.workDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkDay(day.id)}
                    className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? "bg-white border-slate-200 text-slate-700 hover:border-indigo-400"
                        : "bg-red-50 border-red-500 text-red-700 shadow-sm"
                    }`}
                  >
                    <span className="text-lg font-black">{day.label}</span>
                    <span className="text-[8px] font-bold uppercase">
                      {isActive ? "עבודה" : "חופש"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic">
              * ימים המסומנים באדום נחשבים ל"יום חופשי" קבוע במערכת.
            </p>
          </section>

          {/* 4. שיוך מדריכה (רק אם גננת אם) */}
          {formData.roles.includes("MANAGER") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* שיוך מדריכה (קיים) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  מדריכה מלווה
                </label>
                <select
                  name="instructorId"
                  value={formData.instructorId || ""}
                  onChange={handleInputChange}
                  className="input-standard"
                >
                  <option value="">בחרי מדריכה...</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.firstName} {ins.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* חדש: שיוך גננת רוטציה קבועה */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  גננת רוטציה קבועה (אופציונלי)
                </label>
                <select
                  name="rotationTeacherId"
                  value={formData.rotationTeacherId || ""}
                  onChange={handleInputChange}
                  className="input-standard border-emerald-200 focus:border-emerald-500"
                >
                  <option value="">ללא רוטציה קבועה</option>
                  {rotations.map((rot) => (
                    <option key={rot.id} value={rot.id}>
                      {rot.firstName} {rot.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-6 flex gap-4 sticky bottom-0 bg-white border-t border-slate-50 mt-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                "מעדכן..."
              ) : (
                <>
                  <Save size={20} /> שמירת כל השינויים
                </>
              )}
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
