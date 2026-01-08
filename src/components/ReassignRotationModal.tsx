"use client";
import { useState, useEffect } from "react";
import {
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import CustomDropdown from "./ui/CustomDropdown";

export default function ReassignRotationModal({
  isOpen,
  brokenRotations,
  onComplete,
}: any) {
  const [rotations, setRotations] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/users-stats")
        .then((res) => res.json())
        .then((data) =>
          setRotations(
            data.filter((u: any) => u.roles.includes("ROTATION") && u.isWorking)
          )
        );
    }
  }, [isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // יצירת מערך של שיבוצים חדשים מתוך ה-State
      const newAssignments = Object.entries(assignments)
        .map(([key, teacherId]) => {
          const [managerId, day] = key.split("_");
          return { managerId, day, rotationTeacherId: teacherId };
        })
        .filter((a) => a.rotationTeacherId !== "");

      // שליחת עדכון לשרת (נשתמש ב-route הקיים של ה-register או משהו דומה)
      // לצורך הפשטות, נשלח ל-API ייעודי שיוצר FixedRotations
      await fetch("/api/supervisor/users/bulk-rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: newAssignments }),
      });

      onComplete();
    } catch (e) {
      alert("שגיאה בשיבוץ");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-8 bg-indigo-600 text-white shrink-0">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <RefreshCcw size={28} /> שיבוץ רוטציה חלופי
          </h2>
          <p className="opacity-90 font-bold mt-1">
            עקב שינוי ימי העבודה, הגננות הבאות נותרו ללא רוטציה:
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-calendar-scroll">
          {brokenRotations.map((br: any) => {
            const dayNames: any = {
              SUNDAY: "ראשון",
              MONDAY: "שני",
              TUESDAY: "שלישי",
              WEDNESDAY: "רביעי",
              THURSDAY: "חמישי",
              FRIDAY: "שישי",
            };
            const availableForThisDay = rotations.filter(
              (r) =>
                r.workDays.includes(br.day) &&
                !r.fixedRotationsAsRotation?.some(
                  (fr: any) => fr.day === br.day
                )
            );

            return (
              <div
                key={`${br.managerId}_${br.day}`}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-700">
                    גננת אם: {br.manager.firstName} {br.manager.lastName}
                  </span>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">
                    יום {dayNames[br.day]}
                  </span>
                </div>

                <CustomDropdown
                  label="בחרי רוטציה חלופית"
                  value={assignments[`${br.managerId}_${br.day}`] || ""}
                  options={availableForThisDay.map((r) => ({
                    id: r.id,
                    label: `${r.firstName} ${r.lastName}`,
                  }))}
                  onChange={(val) =>
                    setAssignments({
                      ...assignments,
                      [`${br.managerId}_${br.day}`]: val,
                    })
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="p-6 bg-slate-50 flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "עדכן שיבוצים חדשים"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
