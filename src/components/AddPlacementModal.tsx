"use client";
import { useState, useEffect } from "react";
import {
  User,
  Home,
  X,
  Check,
  Clock,
  UserPlus,
  AlertCircle,
  GraduationCap,
  RefreshCcw,
} from "lucide-react";
import { Teacher, RotationRecord } from "@/types";
import CustomDropdown from "./ui/CustomDropdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  refreshData: () => void;
  user: { id: string; roles: string[] };
}

export default function AddPlacementModal({
  isOpen,
  onClose,
  date,
  refreshData,
  user,
}: Props) {
  const [data, setData] = useState<{
    managers: Teacher[];
    substitutes: Teacher[];
    rotations: RotationRecord[];
  }>({ managers: [], substitutes: [], rotations: [] });

  const [activeTab, setActiveTab] = useState<"MANAGER" | "ROTATION">("MANAGER");
  const [selectedAbsentId, setSelectedAbsentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [mode, setMode] = useState<"pending" | "assign" | "closed">("pending");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      fetch(`/api/supervisor/managers?date=${date.toISOString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("שגיאה בטעינת נתונים");
          return res.json();
        })
        .then((fetchedData) => {
          // וודאי שהנתונים שחזרו באמת מכילים את המערכים הדרושים
          setData({
            managers: fetchedData.managers || [],
            substitutes: fetchedData.substitutes || [],
            rotations: fetchedData.rotations || [],
          });
        })
        .catch((err) => {
          console.error(err);
          // במקרה שגיאה - נשאר עם מערכים ריקים ולא ניתן ל-data להיות undefined
          setData({ managers: [], substitutes: [], rotations: [] });
        });
    }
  }, [isOpen, date]);

  const getSubOptions = () => {
    // יצירת עותק של המחליפות (שימוש ב-any כאן כדי לאפשר הוספת שדה זמני isMainManager)
    const baseSubs: any[] = [...data.substitutes];

    if (activeTab === "ROTATION" && selectedAbsentId) {
      const currentRotation = data.rotations.find(
        (r) => r.rotationTeacher.id === selectedAbsentId
      );

      if (currentRotation?.manager) {
        const manager = currentRotation.manager;
        // מוודאים שהיא לא כבר ברשימה
        if (!baseSubs.find((s) => s.id === manager.id)) {
          baseSubs.unshift({
            id: manager.id,
            firstName: `(גננת אם) ${manager.firstName}`,
            lastName: manager.lastName,
            isMainManager: true,
          });
        }
      }
    }
    return baseSubs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsentId) return alert("חובה לבחור גננת נעדרת");
    if (mode === "assign" && !selectedSubId)
      return alert("חובה לבחור גננת מחליפה");

    setLoading(true);
    let instId = "";

    // שליפת ה-ID של המוסד לפי הטאב הפעיל
    if (activeTab === "MANAGER") {
      const m = data.managers.find((m) => m.id === selectedAbsentId);
      instId = m?.mainManagedInstitutions?.[0]?.id || ""; // תיקון ה-Type
    } else {
      const r = data.rotations.find(
        (r) => r.rotationTeacher.id === selectedAbsentId
      );
      instId = r?.manager?.mainManagedInstitutions?.[0]?.id || ""; // תיקון ה-Type
    }

    if (!instId) {
      setLoading(false);
      return alert("לא נמצא מוסד משויך לגננת זו. וודאי שהגן מוגדר במערכת.");
    }

    const payload = {
      date: date.toISOString(),
      mainTeacherId: selectedAbsentId,
      institutionId: instId,
      substituteId: mode === "assign" ? selectedSubId : null,
      status:
        mode === "closed"
          ? "CANCELLED"
          : mode === "assign"
          ? "ASSIGNED"
          : "OPEN",
      creatorRoles: user.roles,
    };

    try {
      const res = await fetch("/api/supervisor/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.json()).message);

      refreshData();
      onClose();
      // איפוס שדות
      setSelectedAbsentId("");
      setSelectedSubId("");
      setMode("pending");
    } catch (e: any) {
      alert(e.message || "שגיאה בשמירה");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 "
      dir="rtl"
    >
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* טאבים */}
        <div className="flex bg-slate-900 p-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("MANAGER");
              setSelectedAbsentId("");
            }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === "MANAGER"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400"
            }`}
          >
            גננת אם
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("ROTATION");
              setSelectedAbsentId("");
            }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeTab === "ROTATION"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400"
            }`}
          >
            גננת רוטציה
          </button>
        </div>

        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-800">הוספת דיווח</h2>
              <p className="text-slate-400 text-xs mt-1">
                לתאריך {new Date(date).toLocaleDateString("he-IL")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* בחירת הנעדרת */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
              {activeTab === "MANAGER"
                ? "גננת אם (נעדרת)"
                : "גננת רוטציה (נעדרת)"}
            </label>
            <div className="relative">
              <CustomDropdown
                label="בחרי גננת"
                placeholder="בחרי גננת..."
                value={selectedAbsentId}
                onChange={(id) => setSelectedAbsentId(id)}
                icon={activeTab === "MANAGER" ? User : RefreshCcw} // אפשר לשים אייקון אם רוצים
                options={
                  activeTab === "MANAGER"
                    ? (data?.managers || []).map((m) => ({
                        id: m.id,
                        label: `${m.firstName} ${m.lastName} (${
                          m.mainManagedInstitutions?.[0]?.name || ""
                        })`,
                      }))
                    : (data?.rotations || []).map((r) => ({
                        id: r.rotationTeacher.id,
                        label: `${r.rotationTeacher.firstName} ${
                          r.rotationTeacher.lastName
                        } (גן ${
                          r.manager.mainManagedInstitutions?.[0]?.name || ""
                        })`,
                      }))
                }
              />
            </div>
          </div>

          {/* מצב דיווח */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
              סטטוס הדיווח
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
              {[
                { key: "pending", label: "ממתין", icon: Clock },
                { key: "assign", label: "שיבוץ", icon: UserPlus },
                { key: "closed", label: "סגור", icon: Home },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key as any)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-[10px] font-black transition-all ${
                    mode === key
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-slate-500"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* בחירת מחליפה */}
          {mode === "assign" && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                גננת מחליפה
              </label>

              <CustomDropdown
                label="" // כי כבר יש label חיצוני
                placeholder="בחרי מחליפה..."
                value={selectedSubId}
                onChange={(id) => setSelectedSubId(id)}
                icon={UserPlus}
                options={(getSubOptions() || []).map((s) => ({
                  id: s.id,
                  label: `${s.firstName} ${s.lastName} ${
                    s.isMainManager ? "(גננת אם)" : ""
                  }`,
                }))}
              />
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition flex items-center justify-center"
            >
              {loading ? "שומר..." : "אישור ושמירה"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-bold transition"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
