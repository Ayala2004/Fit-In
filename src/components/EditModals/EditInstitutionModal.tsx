"use client";
import { useState, useEffect, useMemo } from "react";
import {
  X,
  Building2,
  MapPin,
  Hash,
  User,
  Save,
  Search,
  Clock,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import LoadingScreen from "../ui/LoadingScreen";
import CustomDropdown from "../ui/CustomDropdown";

export default function EditInstitutionModal({
  isOpen,
  onClose,
  onSuccess,
  institution,
}: any) {
  const [managers, setManagers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [rotationData, setRotationData] = useState<Record<string, string>>({});

  const dayNames: Record<string, string> = {
    SUNDAY: "ראשון",
    MONDAY: "שני",
    TUESDAY: "שלישי",
    WEDNESDAY: "רביעי",
    THURSDAY: "חמישי",
    FRIDAY: "שישי",
  };

  useEffect(() => {
    if (isOpen && institution) {
      setSelectedManagerId(institution.mainManagerId);

      fetch("/api/supervisor/users-stats")
        .then((res) => res.json())
        .then((data) => {
          setAllUsers(data);
          const managersList = data.filter((u: any) =>
            u.roles.includes("MANAGER")
          );
          setManagers(managersList);

          // כאן אנחנו מוצאים את המנהלת הנוכחית של המוסד הספציפי הזה
          const currentManager = data.find(
            (u: any) => u.id === institution.mainManagerId
          );

          if (currentManager?.fixedRotationsAsManager) {
            const mapping: Record<string, string> = {};
            currentManager.fixedRotationsAsManager.forEach((r: any) => {
              mapping[r.day] = r.rotationTeacherId;
            });
            // עדכון הסטייט של הרוטציות הקיימות
            setRotationData(mapping);
          }
        });
    }
  }, [isOpen, institution.id]); // הוספנו את ה-ID של המוסד כתלות

  const selectedManager = useMemo(
    () => managers.find((m) => m.id === selectedManagerId),
    [selectedManagerId, managers]
  );

  const freeDays = useMemo(() => {
    if (!selectedManager) return [];
    const workDays = selectedManager.workDays || [];
    return Object.keys(dayNames).filter((day) => !workDays.includes(day));
  }, [selectedManager]);

  // --- פונקציית הבדיקה והאזהרה ---
  // בתוך EditInstitutionModal.tsx

  const handleRotationChange = (dayId: string, teacherId: string) => {
    // אם המשתמש בחר לרוקן את השדה
    if (!teacherId) {
      setRotationData((prev) => ({ ...prev, [dayId]: "" }));
      return;
    }

    const selectedTeacher = allUsers.find((u) => u.id === teacherId);

    // בדיקה האם היא כבר משובצת ביום הזה אצל מישהי אחרת
    const conflict = selectedTeacher?.fixedRotationsAsRotation?.find(
      (r: any) => r.day === dayId && r.managerId !== selectedManagerId
    );

    if (conflict) {
      const otherManager = managers.find((m) => m.id === conflict.managerId);
      const managerName = otherManager
        ? `${otherManager.firstName} ${otherManager.lastName}`
        : "גן אחר";

      const confirmed = window.confirm(
        `שימי לב: ${selectedTeacher.firstName} כבר משובצת כרוטציה ביום ${dayNames[dayId]} אצל ${managerName}.\n\nהאם את בטוחה שברצונך להעביר אותה?`
      );

      if (!confirmed) {
        // --- התיקון הקריטי: ---
        // אנחנו מעדכנים את הסטייט לאותו ערך בדיוק כדי להכריח את ה-Dropdown
        // "להתאפס" חזרה למה שהיה רשום בו קודם.
        setRotationData((prev) => ({ ...prev }));
        return;
      }
    }

    // אם אין קונפליקט או שהמשתמש אישר - מעדכנים כרגיל
    setRotationData((prev) => ({ ...prev, [dayId]: teacherId }));
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const instPayload = {
      name: formData.get("name"),
      address: formData.get("address"),
      institutionNumber: formData.get("institutionNumber"),
      mainManagerId: selectedManagerId,
    };

    try {
      const resInst = await fetch(
        `/api/supervisor/institutions/${institution.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(instPayload),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (resInst.ok) {
        // עדכון הרוטציות בטבלת המשתמש
        await fetch(`/api/supervisor/users/${selectedManagerId}`, {
          method: "PATCH",
          body: JSON.stringify({ rotationData }),
          headers: { "Content-Type": "application/json" },
        });

        onSuccess();
        onClose();
      }
    } catch (err) {
      alert("שגיאת תקשורת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !institution) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-black  ">עריכת גן וצוות</h2>
            <p className="text-slate-400 text-sm">ניהול הגן והצוות הקבוע</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8 overflow-y-auto custom-scrollbar"
        >
          {/* פרטי המוסד */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <Building2 size={16} /> פרטי המוסד
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  שם הגן
                </label>
                <input
                  name="name"
                  defaultValue={institution.name}
                  required
                  className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  מספר מוסד
                </label>
                <input
                  name="institutionNumber"
                  defaultValue={institution.institutionNumber}
                  required
                  className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 mr-2">
                  כתובת
                </label>
                <input
                  name="address"
                  defaultValue={institution.address}
                  required
                  className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>
          </section>

          {/* בחירת גננת אם */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <User size={16} /> גננת אם אחראית
            </div>
            <CustomDropdown
              label=""
              placeholder="בחרי גננת אם..."
              value={selectedManagerId}
              options={managers.map((m) => ({
                id: m.id,
                label: `${m.firstName} ${m.lastName}`,
              }))}
              onChange={(id) => setSelectedManagerId(id)}
              icon={Search}
            />
          </section>

          {/* צוות רוטציה - עם מנגנון האזהרה */}
          {freeDays.length > 0 && (
            <section className="space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
                <RefreshCcw size={16} /> צוות רוטציה לימי חופש (
                {selectedManager?.firstName})
              </div>
              <div className="grid gap-3">
                {freeDays.map((dayId) => {
                  // מציגים את כל גננות הרוטציה שעובדות ביום הזה
                  const availableRotations = allUsers.filter((u) => {
                    const isRotation = u.roles.includes("ROTATION");
                    const worksThisDay = u.workDays.includes(dayId);
                    const isCurrentlyAssignedHere =
                      rotationData[dayId] === u.id; // <--- הוספנו את זה

                    return (
                      isRotation && (worksThisDay || isCurrentlyAssignedHere)
                    );
                  });
                  return (
                    <div
                      key={dayId}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          <Clock size={18} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">
                          יום {dayNames[dayId]}
                        </span>
                      </div>
                      <div className="w-64">
                        <CustomDropdown
                          label=""
                          placeholder="בחרי גננת רוטציה..."
                          value={rotationData[dayId] || ""}
                          options={availableRotations.map((r) => ({
                            id: r.id,
                            label: `${r.firstName} ${r.lastName}`,
                          }))}
                          onChange={(val) => handleRotationChange(dayId, val)} // <--- שימוש בפונקציית הבדיקה
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="flex gap-4 pt-6 shrink-0 mt-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                "שומר..."
              ) : (
                <>
                  <Save size={18} /> שמירת כל השינויים
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
