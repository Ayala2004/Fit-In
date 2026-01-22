"use client";
import { useState } from "react";
import { X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import CustomDropdown from "./ui/CustomDropdown"; // ייבוא הקומפוננטה

export default function ReassignTeachersModal({
  isOpen,
  teachers,
  instructors,
  onComplete,
  isForced = false,
  onClose,
  excludedId, // זה ה-ID של המדריכה שאנחנו משביתים
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
        const remaining = teachers.filter((t: any) => !selectedIds.includes(t.id));
        if (remaining.length === 0) onComplete();
        else {
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

  // סינון המדריכה המושבתת מרשימת האפשרויות
  const availableInstructors = instructors
    .filter((i: any) => i.isWorking === true && i.id !== excludedId)
    .map((i: any) => ({
      id: i.id,
      label: `${i.firstName} ${i.lastName}`,
    }));

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="p-8 bg-gray-800 text-white shrink-0">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <AlertTriangle size={28} /> שיבוץ מחדש של גננות
          </h2>
          <p className="opacity-90 font-bold mt-1">
            המדריכה הקודמת אינה פעילה. חובה להעביר את הגננות למדריכה חדשה.
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
            <button onClick={toggleSelectAll} className="text-sm font-black text-indigo-600 hover:underline">
              {selectedIds.length === teachers.length ? "ביטול בחירת הכל" : "בחר הכל"}
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
                  selectedIds.includes(t.id) ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                    selectedIds.includes(t.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                }`}>
                  {selectedIds.includes(t.id) && <CheckCircle size={14} className="text-white" />}
                </div>
                <span className="font-bold text-slate-700">{t.firstName} {t.lastName}</span>
              </div>
            ))}
          </div>

          {/* שימוש ב-CustomDropdown החדש */}
          <div className="space-y-3 pt-4 border-t">
            <CustomDropdown
              label="עבור הנבחרות, בחרי מדריכה חדשה:"
              placeholder="בחרי מדריכה פעילה..."
              value={newInstructorId}
              options={availableInstructors}
              onChange={(val) => setNewInstructorId(val)}
            />
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-4">
          <button
            onClick={handleReassign}
            disabled={loading || selectedIds.length === 0 || !newInstructorId}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "בצע שיבוץ מחדש"}
          </button>
          
          {/* כפתור בטל השבתה */}
          <button
            onClick={onCancelDisabling}
            type="button"
            className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black hover:bg-slate-50 transition-all"
          >
            בטל השבתה
          </button>
        </div>
      </div>
    </div>
  );
}