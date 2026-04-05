"use client";
import { useState, useEffect } from "react";
import {
  User,
  Home,
  X,
  UserPlus,
  Clock,
  RefreshCcw,
  Calendar,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import CustomDropdown from "../ui/CustomDropdown";

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
  const [data, setData] = useState<any>({
    managers: [],
    substitutes: [],
    rotations: [],
  });
  const [activeTab, setActiveTab] = useState<"MANAGER" | "ROTATION">("MANAGER");
  const [selectedAbsentId, setSelectedAbsentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [mode, setMode] = useState<"pending" | "assign" | "closed">("pending");
  const [loading, setLoading] = useState(false);

  // תיקון באג התאריכים: במקום toISOString שקופץ יום אחורה בגלל UTC, נשלח פורמט נקי
  const getFormattedDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // טעינת גננות אם ורוטציות
  useEffect(() => {
    if (isOpen && date) {
      const dateStr = getFormattedDate(date);
      fetch(`/api/supervisor/managers?date=${dateStr}`)
        .then((res) => res.json())
        .then((fetchedData) => {
          setData((prev: any) => ({
            ...prev,
            managers: Array.isArray(fetchedData.managers) ? fetchedData.managers : [],
            rotations: Array.isArray(fetchedData.rotations) ? fetchedData.rotations : [],
          }));
        })
        .catch(err => console.error("Error fetching managers:", err));
    }
  }, [isOpen, date]);

  // טעינת מחליפות פנויות
  useEffect(() => {
    if (isOpen && date && selectedAbsentId) {
      const dateStr = getFormattedDate(date);
      fetch(
        `/api/supervisor/substitutes?date=${dateStr}&absentTeacherId=${selectedAbsentId}`,
      )
        .then((res) => res.json())
        .then((fetchedSubs) => {
          // בדיקת הגנה: רק אם חזר מערך, נשמור אותו. אם חזרה שגיאה, נשמור מערך ריק.
          setData((prev: any) => ({ 
            ...prev, 
            substitutes: Array.isArray(fetchedSubs) ? fetchedSubs : [] 
          }));
        })
        .catch(err => {
          console.error("Error fetching substitutes:", err);
          setData((prev: any) => ({ ...prev, substitutes: [] }));
        });
    }
  }, [selectedAbsentId, date, isOpen]);

  const getAbsentOptions = () => {
    if (activeTab === "MANAGER") {
      return (data.managers || []).map((m: any) => ({
        id: m.id,
        label: `${m.firstName} ${m.lastName} (${
          m.mainManagedInstitutions?.[0]?.name || "ללא גן"
        })`,
      }));
    } else {
      return (data.rotations || [])
        .filter((r: any) => r.fixedRotationsAsRotation?.length > 0)
        .map((r: any) => {
          const fixedGarden = r.fixedRotationsAsRotation[0]?.manager?.mainManagedInstitutions?.[0]?.name;
          return {
            id: r.id,
            label: `${r.firstName} ${r.lastName} (קבועה ב${fixedGarden || 'גן'})`,
          };
        });
    }
  };

  const getSubstituteOptions = () => {
    // הגנה נוספת מפני נתונים שאינם מערך
    if (!Array.isArray(data.substitutes)) return [];
    
    return data.substitutes.map((s: any) => ({
      id: s.id,
      label: s.label || `${s.firstName} ${s.lastName}`,
      warning: s.isDayOff ? "שימי לב: זהו יום חופש של הגננת" : undefined,
      info: s.isFixedRotationToday
        ? "גננת זו משובצת היום ברוטציה קבועה בגן אחר"
        : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsentId) return;
    setLoading(true);

    let instId = "";
    if (activeTab === "MANAGER") {
      const m = data.managers.find((m: any) => m.id === selectedAbsentId);
      instId = m?.mainManagedInstitutions?.[0]?.id;
    } else {
      const r = data.rotations.find((r: any) => r.id === selectedAbsentId);
      instId = r?.fixedRotationsAsRotation?.[0]?.manager?.mainManagedInstitutions?.[0]?.id;
    }

    try {
      const res = await fetch("/api/supervisor/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: getFormattedDate(date), // שימוש בתאריך נקי
          mainTeacherId: selectedAbsentId,
          institutionId: instId,
          substituteId: mode === "assign" ? selectedSubId : null,
          status: mode === "closed" ? "CANCELLED" : mode === "assign" ? "ASSIGNED" : "OPEN",
          creatorRoles: user.roles,
        }),
      });

      if (res.ok) {
        refreshData();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || "שגיאה בשמירה");
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
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">הוספת דיווח שיבוץ</h2>
              <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
                <Calendar size={14} /> {new Date(date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* סוג הדיווח */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <Info size={14} /> סוג הדיווח
            </div>
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setActiveTab("MANAGER"); setSelectedAbsentId(""); }}
                className={`py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === "MANAGER" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                <User size={16} /> גננת אם
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("ROTATION"); setSelectedAbsentId(""); }}
                className={`py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === "ROTATION" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
              >
                <RefreshCcw size={16} /> גננת רוטציה
              </button>
            </div>
          </div>

          {/* בחירת גננת נעדרת */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <AlertCircle size={14} /> פרטי היעדרות
            </div>
            <CustomDropdown
              label="בחרי את הגננת הנעדרת"
              placeholder="חפשי שם גננת או גן..."
              value={selectedAbsentId}
              onChange={(id) => setSelectedAbsentId(id)}
              options={getAbsentOptions()}
              icon={activeTab === "MANAGER" ? User : RefreshCcw}
            />
          </div>

          {/* בחירת סטטוס */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <Sparkles size={14} /> סטטוס וטיפול
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "pending", label: "ממתין", icon: Clock, active: "border-amber-500 bg-amber-50 text-amber-600" },
                { id: "assign", label: "שיבוץ", icon: UserPlus, active: "border-indigo-500 bg-indigo-50 text-indigo-600" },
                { id: "closed", label: "סגור", icon: Home, active: "border-red-500 bg-red-50 text-red-600" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id as any)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all shadow-sm ${mode === item.id ? item.active : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"}`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-black uppercase">{item.label}</span>
                </button>
              ))}
            </div>

            {mode === "assign" && (
              <div className="pt-4 animate-in slide-in-from-top-4">
                <CustomDropdown
                  label="בחירת גננת מחליפה"
                  placeholder="חפשי מחליפה פנויה..."
                  value={selectedSubId}
                  onChange={(id) => setSelectedSubId(id)}
                  options={getSubstituteOptions()}
                  icon={UserPlus}
                />
              </div>
            )}
          </div>

          {/* כפתורי סיום */}
          <div className="pt-6 flex gap-4 mt-auto">
            <button
              type="submit"
              disabled={loading || !selectedAbsentId || (mode === "assign" && !selectedSubId)}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all disabled:bg-slate-200 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? "שומר דיווח..." : <><CheckCircle2 size={18} /> שמירת דיווח שיבוץ</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}