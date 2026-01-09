"use client";

import { useState, useEffect } from "react";
import {
  X,
  Award,
  Shield,
  Save,
  Clock,
  User as UserIcon,
  Power,
  UserCheck,
  UserMinus,
  PersonStanding,
  RefreshCcw,
  Lock,
} from "lucide-react";
import FormInput from "../FormInput";
import CustomDropdown from "../ui/CustomDropdown";
import ReassignTeachersModal from "../ReassignTeachersModal";
import ReassignRotationModal from "../ReassignRotationModal";


export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: any) {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [rotationData, setRotationData] = useState<Record<string, string>>({});
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [orphanedTeachers, setOrphanedTeachers] = useState([]);
  const [lastDisabledId, setLastDisabledId] = useState<string | null>(null);
  const [showRotationMigration, setShowRotationMigration] = useState(false);
  const [brokenRotations, setBrokenRotations] = useState([]);

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
    if (
      user.fixedRotationsAsManager &&
      Array.isArray(user.fixedRotationsAsManager)
    ) {
      user.fixedRotationsAsManager.forEach((r: any) => {
        mapping[r.day] = r.rotationTeacherId;
      });
    }

    setRotationData(mapping);

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

      const data = await res.json();

      if (res.ok) {
        if (data.needsRotationMigration) {
          setBrokenRotations(data.brokenRotations);
          setShowRotationMigration(true);
        } else if (data.needsReassignment) {
          // ... הלוגיקה של המדריכות ...
        } else {
          onUpdateSuccess();
          onClose();
        }
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

  const handleCancelDisabling = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isWorking: true }), // מחזירים לפעילה
      });

      if (res.ok) {
        setShowReassignModal(false);
        onUpdateSuccess();
        onClose(); // סוגרים את הכל
      }
    } catch (err) {
      alert("שגיאה בביטול ההשבתה");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async () => {
    if (
      !confirm(
        `האם את בטוחה שברצונך לאפס את הסיסמה עבור ${formData.firstName}? הסיסמה החדשה תהיה 123456`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/supervisor/users/${user.id}/reset-password`,
        {
          method: "POST",
        }
      );

      if (res.ok) {
        alert(`הסיסמה של ${formData.firstName} אותחלה בהצלחה ל: 123456`);
      } else {
        alert("שגיאה באיפוס הסיסמה");
      }
    } catch (err) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };
  const handleCancelRotationMigration = async () => {
    setLoading(true);
    try {
      // שלב 1: החזרת ימי העבודה המקוריים של הגננת (כדי שלא יהיה חוסר התאמה)
      const updateRes = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...formData,
          workDays: user.workDays, // מחזירים לערכים המקוריים שקיבלנו ב-Props
          isWorking: user.isWorking,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!updateRes.ok) throw new Error("Failed to restore user days");

      // שלב 2: שחזור השיבוצים שנמחקו בטבלת FixedRotation
      // אנחנו משתמשים במערך brokenRotations שהבאקנד שלח לנו קודם לכן
      const restoreAssignments = brokenRotations.map((br: any) => ({
        managerId: br.managerId,
        day: br.day,
        rotationTeacherId: user.id, // הגננת שאנחנו עורכים כרגע
      }));

      if (restoreAssignments.length > 0) {
        const restoreRes = await fetch("/api/supervisor/users/bulk-rotation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: restoreAssignments }),
        });

        if (!restoreRes.ok) throw new Error("Failed to restore rotation links");
      }

      // שלב 3: ניקוי ה-State וסגירה מוחלטת
      setShowRotationMigration(false);
      setBrokenRotations([]);

      // רענון הנתונים בטבלה הראשית כדי שהכל יהיה מסונכרן
      await onUpdateSuccess();
      onClose();

      alert("השינויים בוטלו והשיבוצים הקודמים שוחזרו בהצלחה.");
    } catch (err) {
      console.error("Rollback error:", err);
      alert("חלה שגיאה בביטול הפעולה. מומלץ לרענן את הדף ולבדוק את השיבוצים.");
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

              <CustomDropdown
                label=""
                searchable={false}
                placeholder="בחרי תפקיד"
                value={getCurrentComboId() || ""}
                options={ALLOWED_ROLE_COMBINATIONS.map((combo) => ({
                  id: combo.id,
                  label: combo.label,
                }))}
                onChange={(id) => {
                  const combo = ALLOWED_ROLE_COMBINATIONS.find(
                    (c) => c.id === id
                  );
                  if (combo) handleComboSelect(combo.roles);
                }}
              />
            </div>

            {/* ימי עבודה / חופש */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                <Clock size={20} className="text-indigo-500" /> ימי עבודה / חופש
              </h4>
              <div className="grid grid-cols-6 gap-2">
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

          <section className="grid grid-cols-2 gap-8">
            {/* סטטוס עבודה */}
            <div className="">
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
            </div>
            <div>
              <div className="space-y-4">
                <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg border-b pb-2">
                  <Lock size={20} className="text-indigo-500" /> אבטחה וסיסמה
                </h4>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      איפוס סיסמת משתמש
                    </p>
                    <p className="text-xs text-amber-700">
                      הסיסמה תהפוך ל-123456 באופן מיידי
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="px-4 py-2 bg-white border-2 border-amber-200 text-amber-600 rounded-xl font-black text-xs hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    איפוס סיסמה
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* שיוך מדריכה / רוטציה */}
          {formData.roles.includes("MANAGER") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* מדריכה מלווה */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg ">
                    <PersonStanding size={20} className="text-indigo-500" />{" "}
                    מדריכה מלווה
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-2">
                    המדריכה האחראית על גננת האם
                  </p>
                  <div className="border-b"></div>

                  <div className="flex flex-col-1 pt-3 justify-start items-center">
                    <span></span>
                    <CustomDropdown
                      label=""
                      value={formData.instructorId || ""}
                      placeholder="בחרי מדריכה..."
                      options={instructors.map((i) => ({
                        id: i.id,
                        label: `${i.firstName} ${i.lastName}`,
                      }))}
                      onChange={(id) =>
                        handleInputChange({
                          target: { name: "instructorId", value: id },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* רוטציה קבועה */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg ">
                    <RefreshCcw size={20} className="text-indigo-500" />
                    הגדרת רוטציה קבועה
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mb-2">
                    שיבוץ גננת קבועה לימים שבהם גננת האם ביום חופשי.
                  </p>
                  <div className="border-b"></div>

                  {weekDays.map((day) => {
                    const isFreeDay = !formData.workDays.includes(day.id);
                    if (!isFreeDay) return null;

                    const existingRotation = user.fixedRotationsAsManager?.find(
                      (r: any) => r.day === day.id
                    );

                    const availableRotationsForThisDay = rotations.filter(
                      (rt) => {
                        const worksThisDay = rt.workDays?.includes(day.id);
                        const isBusyElsewhere =
                          rt.fixedRotationsAsRotation?.some(
                            (assignment: any) =>
                              assignment.day === day.id &&
                              assignment.managerId !== user.id
                          );
                        return worksThisDay && !isBusyElsewhere;
                      }
                    );

                    return (
                      <div
                        key={day.id}
                        className="flex flex-col-1 pt-3 gap-2 justify-start items-center"
                      >
                        <span className="text-xs font-black text-black uppercase">
                          מחליפה ליום {day.label}
                        </span>

                        <CustomDropdown
                          label=""
                          value={rotationData[day.id] || ""}
                          placeholder={
                            existingRotation
                              ? `${existingRotation.firstName} ${existingRotation.lastName}`
                              : "-- בחרי גננת --"
                          }
                          options={availableRotationsForThisDay.map((rt) => ({
                            id: rt.id,
                            label: `${rt.firstName} ${rt.lastName}`,
                          }))}
                          onChange={(id) =>
                            setRotationData({
                              ...rotationData,
                              [day.id]: id,
                            })
                          }
                        />
                      </div>
                    );
                  })}
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
        {showReassignModal && (
          <ReassignTeachersModal
            isOpen={showReassignModal}
            teachers={orphanedTeachers}
            instructors={instructors}
            excludedId={lastDisabledId} // <-- שליחת ה-ID להחרגה
            isForced={true}
            onCancelDisabling={handleCancelDisabling}
            onComplete={(remaining?: any) => {
              if (remaining) {
                setOrphanedTeachers(remaining);
              } else {
                setShowReassignModal(false);
                onUpdateSuccess();
                onClose();
              }
            }}
          />
        )}
        {showRotationMigration && (
          <ReassignRotationModal
            isOpen={showRotationMigration}
            brokenRotations={brokenRotations}
            onCancel={handleCancelRotationMigration}
            onComplete={() => {
              setShowRotationMigration(false);
              onUpdateSuccess();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
