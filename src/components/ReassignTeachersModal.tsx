"use client";
import { useState } from "react";
import {
  X,
  Users,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import LoadingScreen from "./ui/LoadingScreen";

export default function ReassignTeachersModal({
  isOpen,
  teachers,
  instructors,
  onComplete,
  isForced = false,
  onClose,
  excludedId,
  onCancelDisabling,
}: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newInstructorId, setNewInstructorId] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === teachers.length) setSelectedIds([]);
    else setSelectedIds(teachers.map((t: any) => t.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReassign = async () => {
    if (!newInstructorId || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/supervisor/users/bulk-reassign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerIds: selectedIds, newInstructorId }),
      });
      if (res.ok) {
        const remaining = teachers.filter(
          (t: any) => !selectedIds.includes(t.id)
        );
        if (remaining.length === 0) onComplete();
        else {
          // אם נשארו עוד, נעדכן את הרשימה (שיבוץ חלקי)
          onComplete(remaining);
          setSelectedIds([]);
          setNewInstructorId("");
        }
      }
    } catch (e) {
      alert("שגיאה בשיבוץ מחדש");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* כפתור סגירה - מופיע רק אם זה לא מצב כפוי */}
        {!isForced && (
          <button
            onClick={onClose}
            className="absolute top-5 left-5 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-2 transition z-10"
          >
            <X size={24} />
          </button>
        )}

        {/* Header */}
        <div className="p-8 bg-gray-800 text-white shrink-0">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <AlertTriangle size={28} /> שיבוץ מחדש של גננות
          </h2>
          <p className="opacity-90 font-bold mt-1">
            המדריכה הקודמת אינה פעילה. חובה להעביר את הגננות למדריכה חדשה.
          </p>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
            <button
              onClick={toggleSelectAll}
              className="text-sm font-black text-indigo-600 hover:underline"
            >
              {selectedIds.length === teachers.length
                ? "ביטול בחירת הכל"
                : "בחר הכל"}
            </button>
            <span className="text-xs font-bold text-slate-500">
              נבחרו {selectedIds.length} מתוך {teachers.length} גננות
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teachers.map((t: any) => (
              <div
                key={t.id}
                onClick={() => toggleSelect(t.id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  selectedIds.includes(t.id)
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    selectedIds.includes(t.id)
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedIds.includes(t.id) && (
                    <CheckCircle size={14} className="text-white" />
                  )}
                </div>
                <span className="font-bold text-slate-700">
                  {t.firstName} {t.lastName}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="text-sm font-black text-slate-700 block">
              עבור הנבחרות, בחרי מדריכה חדשה:
            </label>
            <select
              className="input-standard bg-slate-50"
              value={newInstructorId}
              onChange={(e) => setNewInstructorId(e.target.value)}
            >
              <option value="">-- בחרי מדריכה פעילה --</option>
              {instructors
                .filter((i: any) => i.isWorking === true && i.id !== excludedId) // סינון כפול
                .map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.firstName} {i.lastName}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-4">
          <button
            onClick={handleReassign}
            disabled={loading || selectedIds.length === 0 || !newInstructorId}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:bg-slate-300"
          >
            {loading ? "שומר..." : "בצע שיבוץ מחדש"}
          </button>
          {isForced && (
            <button
              onClick={onCancelDisabling}
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all"
            >
              בטל השבתה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
