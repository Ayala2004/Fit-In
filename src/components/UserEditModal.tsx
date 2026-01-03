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
  PersonStanding,
  RefreshCcw,
} from "lucide-react";
import FormInput from "./FormInput";

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: any) {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [rotationData, setRotationData] = useState<Record<string, string>>({});
  const [isInstructorOpen, setIsInstructorOpen] = useState(false);
  const [openRotationDay, setOpenRotationDay] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    idNumber: user.idNumber || "",
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
    dateOfBirth: user.dateOfBirth || "",
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

  const weekDays = [
    { id: "SUNDAY", label: "א'" },
    { id: "MONDAY", label: "ב'" },
    { id: "TUESDAY", label: "ג'" },
    { id: "WEDNESDAY", label: "ד'" },
    { id: "THURSDAY", label: "ה'" },
    { id: "FRIDAY", label: "ו'" },
  ];

useEffect(() => {
  if (!isOpen || !user) return;

  // טעינת מדריכות
  fetch("/api/supervisor/instructors")
    .then((res) => res.json())
    .then((data) => setInstructors(Array.isArray(data) ? data : []));

  // טעינת גננות רוטציה
  fetch("/api/supervisor/users-stats")
    .then((res) => res.json())
    .then((data) => {
      setRotations(data.filter((u: any) => u.roles.includes("ROTATION")));
    });

  // ⬅️ אתחול נכון של rotationData מתוך הנתון של המשתמשת
  const mapping: Record<string, string> = {};
  if (user.fixedRotationsAsManager?.length) {
    user.fixedRotationsAsManager.forEach((r: any) => {
      mapping[r.day] = r.rotationTeacherId;
    });
  }

  setRotationData(mapping);
}, [user, isOpen]);


  const getCurrentComboId = () => {
    const combo = ALLOWED_ROLE_COMBINATIONS.find(
      (c) =>
        c.roles.length === formData.roles.length &&
        c.roles.every((r) => formData.roles.includes(r))
    );
    return combo ? combo.id : null;
  };

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
      // 1. יצירת עותק נקי של נתוני הרוטציה
      const cleanedRotationData = { ...rotationData };

      // 2. טיפול באופציית REMOVE:
      // אנחנו עוברים על כל הימים, ואם נבחר REMOVE, נהפוך אותו לערך ריק
      // כדי שהשרת ידע לא ליצור את השיבוץ הזה מחדש
      Object.keys(cleanedRotationData).forEach((day) => {
        if (cleanedRotationData[day] === "REMOVE") {
          cleanedRotationData[day] = "";
        }
      });

      const payload = {
        ...formData,
        rotationData: cleanedRotationData, // שולחים את הנתונים המנוקים
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : null,
      };

      const res = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
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
  const handleComboSelect = (roles: string[]) => {
    setFormData((prev: any) => ({ ...prev, roles }));
  };

  if (!isOpen) return null;
  // פונקציית עזר להצגת שם הרוטציה הנוכחית אם יש
  const getRotationLabel = (
    dayId: string,
    availableRotationsForThisDay: any[],
    existingRotation: any
  ) => {
    const selectedId = rotationData[dayId];

    if (selectedId === "REMOVE") return "❌ הסרת שיבוץ";

    if (selectedId) {
      const selected = availableRotationsForThisDay.find(
        (r) => r.id === selectedId
      );
      if (selected) return `${selected.firstName} ${selected.lastName}`;
    }

    if (existingRotation) {
      return `נוכחית: ${existingRotation.rotationTeacher.firstName} ${existingRotation.rotationTeacher.lastName}`;
    }

    return "-- בחרי גננת פנויה --";
  };

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
          {/* פרטים אישיים */}
          <section className="space-y-4">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
              <Award size={20} className="text-indigo-500" /> פרטים אישיים
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="firstName"
                kind="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <FormInput
                name="lastName"
                kind="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
              <FormInput
                name="idNumber"
                kind="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
              />
              <FormInput
                name="phoneNumber"
                kind="phone"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              <FormInput
                name="email"
                kind="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <FormInput
                name="dateOfBirth"
                kind="dateOfBirth"
                value={formData.dateOfBirth || ""}
                onChange={handleInputChange}
              />
            </div>
          </section>

          {/* הגדרת תפקידים */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Shield size={20} className="text-indigo-500" /> הגדרת תפקיד
              </h4>
              <div className="relative dropdown">
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className="w-full p-3 rounded-xl border-2 flex items-center justify-between font-bold text-sm bg-white"
                >
                  <span>
                    {ALLOWED_ROLE_COMBINATIONS.find(
                      (c) => c.id === getCurrentComboId()
                    )?.label || "בחרי תפקיד"}
                  </span>
                  <ChevronDown
                    size={18}
                    className={isRoleOpen ? "rotate-180" : ""}
                  />
                </button>
                {isRoleOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
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

            {/* ימי עבודה / חופש */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Clock size={20} className="text-indigo-500" /> ימי עבודה / חופש
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
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

          {/* סטטוס עבודה */}
          <section>
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
              <Power size={20} className="text-indigo-500" /> סטטוס עבודה
            </h4>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, isWorking: !prev.isWorking }))
              }
              className={`w-full p-4 mt-2 rounded-2xl border-2 flex items-center justify-between transition-all ${
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
          </section>

          {/* שיוך מדריכה / רוטציה */}
          {formData.roles.includes("MANAGER") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* עמודה ימנית: מדריכה מלווה */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                    <PersonStanding size={20} className="text-indigo-500" />{" "}
                    מדריכה מלווה
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-2">
                    המדריכה האחראית על גננת האם
                  </p>

                  <div className="relative dropdown">
                    <button
                      type="button"
                      onClick={() => setIsInstructorOpen(!isInstructorOpen)}
                      className="w-full p-3 rounded-xl border-2 flex items-center justify-between font-bold text-sm bg-white"
                    >
                      <span>
                        {instructors.find((i) => i.id === formData.instructorId)
                          ? `${
                              instructors.find(
                                (i) => i.id === formData.instructorId
                              )?.firstName
                            } ${
                              instructors.find(
                                (i) => i.id === formData.instructorId
                              )?.lastName
                            }`
                          : "בחרי מדריכה..."}
                      </span>
                      <ChevronDown
                        size={18}
                        className={isInstructorOpen ? "rotate-180" : ""}
                      />
                    </button>

                    {isInstructorOpen && (
                      <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                        {instructors.map((ins) => {
                          const isSelected = ins.id === formData.instructorId;

                          return (
                            <button
                              key={ins.id}
                              type="button"
                              onClick={() => {
                                handleInputChange({
                                  target: {
                                    name: "instructorId",
                                    value: ins.id,
                                  },
                                });
                                setIsInstructorOpen(false);
                              }}
                              className={`w-full p-3 text-right flex items-center justify-between text-sm font-bold transition ${
                                isSelected
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              {ins.firstName} {ins.lastName}
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
              </div>

              {/* עמודה שמאלית: הגדרת רוטציה קבועה */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                    <RefreshCcw size={20} className="text-indigo-500" />{" "}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-2">
                    שיבוץ גננת קבועה לימים שבהם גננת האם ביום חופשי.
                  </p>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {weekDays.map((day) => {
                      // 1. האם זה יום חופשי של גננת האם? (יום שלא נבחר ב-workDays)
                      const isFreeDay = !formData.workDays.includes(day.id);
                      if (!isFreeDay) return null;

                      // 2. מציאת גננת הרוטציה הנוכחית שמשובצת ביום הזה ב-DB
                      const existingRotation =
                        user.fixedRotationsAsManager?.find(
                          (r: any) => r.day === day.id
                        );

                      // 3. סינון רשימת הגננות עבור היום הספציפי הזה
                      const availableRotationsForThisDay = rotations.filter(
                        (rt) => {
                          // האם הגננת תפוסה ביום הזה בגן *אחר*?
                          const isBusyElsewhere =
                            rt.fixedRotationsAsRotation?.some(
                              (assignment: any) =>
                                assignment.day === day.id &&
                                assignment.managerId !== user.id
                            );
                          return !isBusyElsewhere;
                        }
                      );

                      return (
                        <div
                          key={day.id}
                          className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-indigo-50 shadow-sm"
                        >
                          <div className="flex justify-between items-center px-1">
                            <span className="text-xs font-black text-indigo-600 uppercase">
                              יום {day.label}
                            </span>
                            {existingRotation && !rotationData[day.id] && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                שיבוץ פעיל
                              </span>
                            )}
                          </div>

                          <div className="relative dropdown">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenRotationDay(
                                  openRotationDay === day.id ? null : day.id
                                )
                              }
                              className={`w-full p-2.5 rounded-xl border-2 flex items-center justify-between text-xs font-bold transition ${
                                rotationData[day.id] || existingRotation
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span>
                                {getRotationLabel(
                                  day.id,
                                  availableRotationsForThisDay,
                                  existingRotation
                                )}
                              </span>

                              <ChevronDown
                                size={14}
                                className={
                                  openRotationDay === day.id ? "rotate-180" : ""
                                }
                              />
                            </button>

                            {openRotationDay === day.id && (
                              <div className="absolute z-20 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                                {availableRotationsForThisDay.map((rt) => {
                                  const isSelected =
                                    rotationData[day.id] === rt.id;

                                  return (
                                    <button
                                      key={rt.id}
                                      type="button"
                                      onClick={() => {
                                        setRotationData({
                                          ...rotationData,
                                          [day.id]: rt.id,
                                        });
                                        setOpenRotationDay(null);
                                      }}
                                      className={`w-full p-3 text-right flex items-center justify-between text-sm font-bold transition ${
                                        isSelected
                                          ? "bg-indigo-50 text-indigo-700"
                                          : "hover:bg-slate-50 text-slate-600"
                                      }`}
                                    >
                                      {rt.firstName} {rt.lastName}
                                      {isSelected && (
                                        <CheckCircle2
                                          size={14}
                                          className="text-indigo-600"
                                        />
                                      )}
                                    </button>
                                  );
                                })}

                                {existingRotation && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRotationData({
                                        ...rotationData,
                                        [day.id]: "REMOVE",
                                      });
                                      setOpenRotationDay(null);
                                    }}
                                    className="w-full p-3 text-right flex items-center justify-between text-sm font-bold text-red-600 hover:bg-red-50 transition"
                                  >
                                    ❌ הסרת גננת רוטציה ביום זה
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 flex gap-4 mt-auto bottom-0 bg-white border-t border-slate-50">
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
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
