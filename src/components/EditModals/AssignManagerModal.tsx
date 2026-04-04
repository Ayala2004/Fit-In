"use client";
import { useState, useEffect } from "react";
import { X, UserPlus, Shield, Loader2, Sparkles, AlertCircle } from "lucide-react";
import CustomDropdown from "../ui/CustomDropdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institution: any;
}

export default function AssignManagerModal({ isOpen, onClose, onSuccess, institution }: Props) {
  const [availableManagers, setAvailableManagers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFetching(true);
      // שליפת כל המשתמשות כדי למצוא גננת אם פנויה
      fetch("/api/supervisor/users-stats")
        .then((res) => res.json())
        .then((data) => {
          // סינון: רק מי שהיא MANAGER, פעילה (isWorking), וכרגע לא מנהלת אף מוסד פעיל
          const filtered = data.filter((u: any) => 
            u.roles.includes("MANAGER") && 
            u.isWorking === true &&
            (!u.mainManagedInstitutions || u.mainManagedInstitutions.length === 0)
          );
          setAvailableManagers(filtered);
          setFetching(false);
        })
        .catch((err) => {
          console.error("Error fetching managers:", err);
          setFetching(false);
        });
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setLoading(true);

    try {
      // מציאת פרטי הגננת שנבחרה כדי לשלוף את המדריכה שלה
      const manager = availableManagers.find((m) => m.id === selectedId);
      
      const res = await fetch(`/api/supervisor/institutions/${institution.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mainManagerId: selectedId,
          instructorId: manager.instructorId, // סנכרון המדריכה
          isActive: true // וידוא שהמוסד חוזר להיות פעיל
        }),
      });

      if (res.ok) {
        onSuccess(); // יגרום ל-mutate בדאשבורד וההודעה תיעלם
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "שגיאה בשיוך המנהלת");
      }
    } catch (e) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        
        {/* Header - Slate 900 */}
        <div className="p-8 bg-slate-900 text-white relative shrink-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">שיוך מנהלת חדשה</h2>
              <p className="text-slate-400 text-sm font-medium mt-1 italic">
                עבור גן: {institution?.name}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8">
          {/* Info Box */}
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3 items-start">
            <Shield className="text-indigo-600 shrink-0" size={20} />
            <p className="text-xs text-indigo-900 font-bold leading-relaxed">
              שימי לב: בחירת מנהלת חדשה תעדכן אוטומטית גם את המדריכה של הגן בהתאם למדריכה המלווה שמוגדרת לגננת שנבחרה.
            </p>
          </div>

          {/* Selection Area */}
          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
              <UserPlus size={18} className="text-indigo-500" /> בחרי גננת אם פנויה מהרשימה:
            </label>
            
            {fetching ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-slate-400 text-xs font-bold">טוען גננות פנויות...</p>
              </div>
            ) : availableManagers.length > 0 ? (
              <CustomDropdown
                label=""
                placeholder="חפשי גננת לפי שם..."
                value={selectedId}
                options={availableManagers.map((m) => ({
                  id: m.id,
                  label: `${m.firstName} ${m.lastName}`
                }))}
                onChange={setSelectedId}
              />
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={24} />
                <p className="text-slate-500 text-sm font-bold">לא נמצאו גננות אם פנויות לשיבוץ.</p>
                <p className="text-slate-400 text-xs mt-1">יש לוודא שהגננת קיימת במערכת ואינה מנהלת גן אחר.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex gap-4">
            <button
              onClick={handleAssign}
              disabled={loading || !selectedId}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Sparkles size={20} />
                  בצע שיוך מנהלת
                </>
              )}
            </button>
            <button 
              onClick={onClose} 
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}