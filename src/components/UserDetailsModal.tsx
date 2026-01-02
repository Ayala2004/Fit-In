"use client";

import { useState, useEffect } from "react";
import {
  X,
  Award,
  Shield,
  Save,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Power,
  UserCheck,
  UserMinus,
  ChevronDown,
} from "lucide-react";
import ValidatedField from "./ValidatedField";

export default function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: any) {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
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

  const ALLOWED_ROLE_COMBINATIONS = [
    { id: "MANAGER_ONLY", label: "גננת אם בלבד", roles: ["MANAGER"] },
    { id: "INSTRUCTOR_ONLY", label: "מדריכה בלבד", roles: ["INSTRUCTOR"] },
    {
      id: "MANAGER_INSTRUCTOR",
      label: "גננת אם וגם מדריכה",
      roles: ["MANAGER", "INSTRUCTOR"],
    },
    { id: "SUBSTITUTE_ONLY", label: "מחליפה בלבד", roles: ["SUBSTITUTE"] },
    { id: "ROTATION_ONLY", label: "רוטציה בלבד", roles: ["ROTATION"] },
  ];

  const getCurrentComboId = () => {
    const currentRoles = formData.roles;
    const combo = ALLOWED_ROLE_COMBINATIONS.find(
      (c) =>
        c.roles.length === currentRoles.length &&
        c.roles.every((r) => currentRoles.includes(r))
    );
    return combo ? combo.id : null;
  };

  const handleComboSelect = (roles: string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      roles: roles,
    }));
  };

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
      // הכנת הנתונים למשלוח - וודאי שכל שדות ה-ID מנוקים
      const payload = {
        ...formData,
        // המרת תאריך לידה חזרה לפורמט ISO שהשרת מצפה לו
        dateOfBirth: new Date(user.dateOfBirth).toISOString(),
      };

      const res = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload), // משלוח ה-payload הנקי
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onUpdateSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "שגיאה בעדכון הנתונים");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-150 bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-300"
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
              <ValidatedField
                name="idNumber"
                label="תעודת זהות"
                value={formData.idNumber}
                onChange={handleInputChange}
              />
              <ValidatedField
                name="phoneNumber"
                label="מספר טלפון"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              <ValidatedField
                name="email"
                label="אימייל (שם משתמש)"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@email.com"
              />
            </div>
          </section>

          {/*  ניהול תפקידים ויום חופשי */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg">
                  <Shield size={20} className="text-indigo-500" /> הגדרת תפקיד
                </h4>
                <p className="text-[13px] text-slate-400 font-medium italic">
                  * בלחיצה על החץ תפתח רשימה של תפקידים אפשריים
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRoleOpen((v) => !v)}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 flex items-center justify-between font-bold text-sm text-slate-700 bg-white hover:border-indigo-400 transition"
                >
                  <span>
                    {ALLOWED_ROLE_COMBINATIONS.find(
                      (c) => c.id === getCurrentComboId()
                    )?.label || "בחרי תפקיד"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${
                      isRoleOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isRoleOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {ALLOWED_ROLE_COMBINATIONS.map((combo) => {
                      const isSelected = getCurrentComboId() === combo.id;

                      return (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => {
                            handleComboSelect(combo.roles);
                            setIsRoleOpen(false);
                          }}
                          className={`w-full p-3 text-right flex items-center justify-between text-sm font-bold transition ${
                            isSelected
                              ? "bg-indigo-50 text-indigo-700"
                              : "hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {combo.label}
                          {isSelected && (
                            <CheckCircle2
                              size={16}
                              className="text-indigo-600"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg ">
                  <Clock size={20} className="text-indigo-500" /> ימי עבודה /
                  חופש
                </h4>
                <p className="text-[13px] text-slate-400 font-medium italic">
                  * ימים המסומנים באדום נחשבים ל"יום חופשי" קבוע במערכת.
                </p>
              </div>
              <div className="grid grrid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
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
            </div>
          </section>

          <section>
            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Power size={20} className="text-indigo-500" /> סטטוס עבודה
              </h4>
              {/* כפתור סטטוס עבודה נשאר אותו דבר */}
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
          <div className="pt-6 flex gap-4  bottom-0 bg-white border-t border-slate-50 mt-auto">
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
