"use client";
import { useState, useEffect } from "react";
import { User, Home, X, Check, Clock, UserPlus, AlertCircle } from "lucide-react";

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
  user: { id: string; roles: string[] };
}

export default function AddPlacementModal({ isOpen, onClose, date, refreshData, user }: Props) {
  const [data, setData] = useState<{ managers: Teacher[]; substitutes: Teacher[] }>({ managers: [], substitutes: [] });
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  
  // מצבים: 'pending' (ממתין), 'assign' (שיבוץ), 'closed' (גן סגור)
  const [mode, setMode] = useState<'pending' | 'assign' | 'closed'>('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      fetch(`/api/supervisor/managers?date=${date.toISOString()}`)
        .then((res) => res.json())
        .then(setData);
    }
  }, [isOpen, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManagerId) return alert("חובה לבחור גננת אם");
    if (mode === 'assign' && !selectedSubId) return alert("חובה לבחור גננת מחליפה");

    setLoading(true);
    const manager = data.managers.find((m) => m.id === selectedManagerId);

    const payload = {
      date: date.toISOString(),
      mainTeacherId: selectedManagerId,
      institutionId: manager?.mainManagedInstitutions?.[0]?.id,
      substituteId: mode === 'assign' ? selectedSubId : null,
      status: mode === 'closed' ? "CANCELLED" : mode === 'assign' ? "ASSIGNED" : "OPEN",
      creatorRoles: user.roles,
      notes: mode === 'closed' ? "הגן נסגר על ידי הפיקוח" : "",
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
        resetForm();
      } else {
        const err = await res.json();
        alert(err.message || "שגיאה בשמירת השיבוץ");
      }
    } catch {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedManagerId("");
    setSelectedSubId("");
    setMode('pending');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">הוספת דיווח חדש</h2>
            <p className="text-indigo-100 text-sm opacity-90">
              {new Date(date).toLocaleString("IL-he")}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. בחירת גננת אם */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> גננת אם (נעדרת):
            </label>
            <select
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none bg-slate-50 transition-all font-medium"
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              required
            >
              <option value="">-- בחרי גננת אם --</option>
              {data.managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.mainManagedInstitutions?.[0]?.name || 'ללא גן'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. בחירת סוג הדיווח */}
          <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-indigo-500" /> מה תרצי לבצע?
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode('pending')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-[11px] font-bold transition-all ${
                  mode === 'pending' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Clock size={18} /> דיווח בלבד
              </button>
              <button
                type="button"
                onClick={() => setMode('assign')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-[11px] font-bold transition-all ${
                  mode === 'assign' ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserPlus size={18} /> שיבוץ מחליפה
              </button>
              <button
                type="button"
                onClick={() => setMode('closed')}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-[11px] font-bold transition-all ${
                  mode === 'closed' ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Home size={18} /> סגירת גן
              </button>
            </div>
          </div>

          {/* 3. שדות דינמיים לפי המצב */}
          <div className="min-h-[80px] flex items-end">
            {mode === 'assign' && (
              <div className="w-full animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-bold text-slate-700 mb-2">בחירת גננת מחליפה:</label>
                <select
                  className="w-full p-3 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 outline-none bg-emerald-50/30 transition-all font-medium"
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  required
                >
                  <option value="">-- בחרי מחליפה פנויה --</option>
                  {data.substitutes.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'pending' && (
              <div className="w-full p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in duration-300">
                <p className="text-amber-800 text-xs font-medium flex items-center gap-2">
                  <Clock size={14} /> הדיווח יישמר במצב "ממתין" ויופיע בדאשבורד כקריאה פתוחה.
                </p>
              </div>
            )}

            {mode === 'closed' && (
              <div className="w-full p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in duration-300">
                <p className="text-red-800 text-xs font-medium flex items-center gap-2">
                  <Check size={14} /> הגן יסומן כסגור ולא יחפשו עבורו מחליפה להיום.
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4">
             <button
              type="submit"
              disabled={loading}
              className={`flex-[2] p-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                mode === 'closed' ? "bg-red-600 hover:bg-red-700 shadow-red-100" : 
                mode === 'assign' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" :
                "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
              }`}
            >
              {loading ? "מעבד..." : "אישור וביצוע"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-2xl font-bold transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}