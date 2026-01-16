"use client";
import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import CustomDatePicker from "../ui/CustomDatePicker";

const dayTranslations: Record<string, string> = {
  SUNDAY: "ראשון",
  MONDAY: "שני",
  TUESDAY: "שלישי",
  WEDNESDAY: "רביעי",
  THURSDAY: "חמישי",
  FRIDAY: "שישי",
  SATURDAY: "שבת",
};

export default function ManagerReportModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  existingPlacements,
}: any) {
  const [mode, setMode] = useState<"ABSENCE" | "SWAP">("ABSENCE");
  const [loading, setLoading] = useState(false);
  const [myRotation, setMyRotation] = useState<any>(null);

  const [absenceDate, setAbsenceDate] = useState("");
  const [swapDateAbsent, setSwapDateAbsent] = useState("");
  const [swapDateWorking, setSwapDateWorking] = useState("");

  useEffect(() => {
    if (isOpen && user?.id) {
      fetch("/api/manager/dashboard")
        .then((res) => res.json())
        .then((data) => {
          if (data.rotations && data.rotations.length > 0)
            setMyRotation(data.rotations[0]);
        });
    }
  }, [isOpen, user?.id]);

  // --- פונקציית הבדיקה המרכזית ---
  // בתוך src/components/AddModals/ManagerReportModal.tsx

const validateSelection = (dateStr: string, labelForError: string) => {
  if (!dateStr) return { valid: false };

  // dateStr מגיע מה-CustomDatePicker כנראה בפורמט YYYY-MM-DD
  const selectedDate = new Date(dateStr);
  
  // 1. בדיקת יום שבת (6 זה שבת ב-getJS Day)
  if (selectedDate.getDay() === 6) {
    alert(`שגיאה ב${labelForError}: לא ניתן לדווח על יום שבת. הגן סגור.`);
    return { valid: false };
  }

  // 2. בדיקת כפילות מול existingPlacements
  // אנחנו מדפיסים ל-Console כדי שתוכלי לראות מה המערכת "מוצאת"
  console.log("Checking duplicates for:", dateStr);
  console.log("Current existing placements:", existingPlacements);

  const isDuplicate = existingPlacements.some((p: any) => {
    // התעלמות מדיווחים מבוטלים - אם הגן בוטל, מותר לדווח שוב
    if (p.status === "CANCELLED") return false;

    // המרת התאריך מה-DB לפורמט YYYY-MM-DD נקי לצורך השוואה
    const pDate = new Date(p.date);
    const pYear = pDate.getFullYear();
    const pMonth = String(pDate.getMonth() + 1).padStart(2, '0');
    const pDay = String(pDate.getDate()).padStart(2, '0');
    const pFormatted = `${pYear}-${pMonth}-${pDay}`;

    return pFormatted === dateStr;
  });

  if (isDuplicate) {
    alert(`שגיאה ב${labelForError}: כבר קיים דיווח פעיל (היעדרות או שיבוץ) לתאריך זה.`);
    return { valid: false };
  }

  return { valid: true };
};

  const handleAbsenceSubmit = async (e: any) => {
    e.preventDefault();
    
    const check = validateSelection(absenceDate, "תאריך ההיעדרות");
    if (!check.valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/manager/report", {
        method: "POST",
        body: JSON.stringify({ date: absenceDate }),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        // --- כאן התיקון: חילוץ הודעת השגיאה מהשרת ---
        const errorData = await res.json();
        alert(errorData.message || "שגיאה בשליחת הדיווח");
      }
    } catch (err) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  const handleSwapSubmit = async (e: any) => {
    e.preventDefault();
    if (!myRotation) return alert("לא נמצאה גננת רוטציה");

    const checkAbsent = validateSelection(swapDateAbsent, "יום ההיעדרות שלך");
    if (!checkAbsent.valid) return;

    const checkWorking = validateSelection(swapDateWorking, "יום העבודה במקום הרוטציה");
    if (!checkWorking.valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/manager/swap", {
        method: "POST",
        body: JSON.stringify({ 
          dateAbsent: swapDateAbsent, 
          dateWorking: swapDateWorking, 
          rotationTeacherId: myRotation.rotationTeacherId 
        }),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        // --- כאן התיקון: חילוץ הודעת השגיאה מהשרת ---
        const errorData = await res.json();
        alert(errorData.message || "שגיאה בביצוע ההחלפה");
      }
    } catch (err) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-2xl font-black">עדכון מצב הגן</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 bg-slate-50 flex gap-4">
          <button
            onClick={() => setMode("ABSENCE")}
            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              mode === "ABSENCE"
                ? "bg-white border-indigo-600 text-indigo-600 shadow-md"
                : "border-slate-200 text-slate-400"
            }`}
          >
            <AlertCircle size={24} />
            <span className="font-black text-xs">דיווח היעדרות</span>
          </button>
          <button
            onClick={() => setMode("SWAP")}
            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
              mode === "SWAP"
                ? "bg-white border-indigo-600 text-indigo-600 shadow-md"
                : "border-slate-200 text-slate-400"
            }`}
          >
            <ArrowLeftRight size={24} />
            <span className="font-black text-xs">החלפה פנימית</span>
          </button>
        </div>

        <div className="p-8">
          {mode === "ABSENCE" ? (
            <form onSubmit={handleAbsenceSubmit} className="space-y-6">
              <CustomDatePicker
                label="מתי לא תוכלי להגיע?"
                value={absenceDate}
                onChange={setAbsenceDate}
                allowFutureDates={true}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "שליחת דיווח"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSwapSubmit} className="space-y-6">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between mb-4">
                <p className="font-black text-slate-800">
                  מול: {myRotation?.rotationTeacher.firstName}{" "}
                  {myRotation?.rotationTeacher.lastName}
                </p>
                <span className="text-[10px] font-black text-indigo-600 uppercase">
                  רוטציה קבועה
                </span>
              </div>
              <CustomDatePicker
                label="יום שבו את נעדרת:"
                value={swapDateAbsent}
                onChange={setSwapDateAbsent}
                allowFutureDates={true}
              />
              <CustomDatePicker
                label="יום שבו את עובדת במקומה:"
                value={swapDateWorking}
                onChange={setSwapDateWorking}
                allowFutureDates={true}
              />
              <button
                type="submit"
                disabled={loading || !myRotation} // הכפתור נהיה אפור ברגע שלחצו פעם אחת
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "ביצוע החלפה פנימית"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
