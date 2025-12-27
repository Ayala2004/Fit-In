"use client";
import { useState, useEffect } from "react";
import { User, Home, X, Check } from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  mainManagedInstitutions?: { id: string; name: string }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  refreshData: () => void;
  user: { roles: string[] };
}

export default function AddPlacementModal({ isOpen, onClose, date, refreshData, user }: Props) {
  const [data, setData] = useState<{ managers: Teacher[]; substitutes: Teacher[] }>({ managers: [], substitutes: [] });
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [isGardenClosed, setIsGardenClosed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      fetch(`/api/supervisor/managers?date=${date.toISOString()}`)
        .then((res) => res.json())
        .then(setData);
    }
  }, [isOpen, date]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ולידציה
    if (!selectedManagerId) return alert("חובה לבחור גננת אם");
    if (!isGardenClosed && !selectedSubId) return alert("חובה לבחור גננת מחליפה או לסמן שהגן סגור");

    setLoading(true);

    const manager = data.managers.find((m) => m.id === selectedManagerId);

    const payload = {
      date: date.toISOString(),
      mainTeacherId: selectedManagerId,
      institutionId: manager?.mainManagedInstitutions?.[0]?.id,
      substituteId: isGardenClosed ? null : selectedSubId,
      status: isGardenClosed ? "CANCELLED" : "ASSIGNED",
      creatorRoles: user.roles.includes("SUPERVISOR") ? ["SUPERVISOR"] : ["INSTRUCTOR"],
      notes: isGardenClosed ? "הגן נסגר על ידי הפיקוח" : "",
    };

    try {
      const res = await fetch("/api/supervisor/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        refreshData();
        onClose();
        setSelectedManagerId("");
        setSelectedSubId("");
        setIsGardenClosed(false);
      } else {
        alert("שגיאה בשמירת השיבוץ");
      }
    } catch {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="bg-slate-800 p-6 text-white">
          <h2 className="text-xl font-bold">דיווח שיבוץ סופי</h2>
          <p className="text-slate-400 text-sm">{date.toLocaleDateString("he-IL")}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* בחירת גננת אם */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">גננת אם (נעדרת):</label>
            <select
              className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none bg-gray-50 transition-all"
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              required
            >
              <option value="">-- בחרי גננת אם --</option>
              {data.managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.mainManagedInstitutions?.[0]?.name})
                </option>
              ))}
            </select>
          </div>

          {/* בחירה בין שיבוץ לסגירה */}
          <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsGardenClosed(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${
                !isGardenClosed ? "bg-white shadow-sm text-blue-600" : "text-gray-500"
              }`}
            >
              <User size={18} /> שיבוץ מחליפה
            </button>
            <button
              type="button"
              onClick={() => setIsGardenClosed(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${
                isGardenClosed ? "bg-white shadow-sm text-red-600" : "text-gray-500"
              }`}
            >
              <Home size={18} /> הגן סגור
            </button>
          </div>

          {/* בחירת מחליפה */}
          {!isGardenClosed ? (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">גננת מחליפה:</label>
              <select
                className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none bg-blue-50/30 transition-all"
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                required={!isGardenClosed}
              >
                <option value="">-- בחרי מחליפה פנויה --</option>
                {data.substitutes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in zoom-in-95">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <Check size={16} /> הדיווח יישמר כ"גן סגור" (בוטל)
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] p-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                isGardenClosed ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
              }`}
            >
              {loading ? "שומר..." : "אישור וביצוע שיבוץ"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-2xl font-bold"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
