"use client";

import { useState, useEffect } from "react";
import { X, Search, UserCheck, Loader2, AlertCircle, Home, Clock, Info } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import LoadingScreen from "./ui/LoadingScreen";

interface PlacementModalProps {
  placement: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlacementModal({
  placement,
  isOpen,
  onClose,
  onSuccess,
}: PlacementModalProps) {
  const [substitutes, setSubstitutes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && placement?.date) {
      setLoading(true);
      const dateParam = encodeURIComponent(
        new Date(placement.date).toISOString()
      );

      // הקריאה ל-API עכשיו מחזירה גם את הדגלים isDayOff ו-isFixedRotationToday
      fetch(`/api/supervisor/substitutes?date=${dateParam}`)
        .then((res) => res.json())
        .then((data) => {
          setSubstitutes(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("טעינת מחליפות נכשלה:", err);
          setLoading(false);
        });
    }
  }, [isOpen, placement]);

  const updatePlacement = async (subId: string | null, status: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/supervisor/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placementId: placement.id,
          substituteId: subId,
          status: status,
        }),
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        alert("שגיאה בעדכון הדיווח");
      }
    } catch (error) {
      console.error("Error updating placement:", error);
      alert("שגיאת תקשורת");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseGarden = () => {
    if (
      confirm(
        `האם את בטוחה שברצונך לסגור את גן ${placement.institution?.name} לתאריך זה?`
      )
    ) {
      updatePlacement(null, "CANCELLED");
    }
  };

  if (!isOpen) return null;

  const filteredSubstitutes = substitutes.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.includes(searchQuery) ||
      s.phoneNumber?.includes(searchQuery)
  );

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-black tracking-tight italic">
              עדכון סטטוס גן
            </h3>
            <p className="text-slate-400 text-sm font-medium mt-1">
              גן {placement.institution?.name} |{" "}
              {format(new Date(placement.date), "dd/MM/yyyy", { locale: he })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- פעולה מהירה: סגירת גן --- */}
        <div className="p-6 bg-red-50/50 border-b border-red-100 shrink-0">
          <button
            onClick={handleCloseGarden}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-3 p-4 bg-white rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm group font-black uppercase text-sm tracking-widest disabled:opacity-50"
          >
            <Home
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            סגירת הגן עקב חוסר במחליפה
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-2 shrink-0">
          <label className="block text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-500" /> או שיבוץ מחליפה
            פנויה:
          </label>
          <div className="relative group">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="חפשי לפי שם או טלפון..."
              className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2 mt-4 custom-calendar-scroll">
          {loading ? (
            <LoadingScreen message="בודק זמינות מחליפות..." />
          ) : filteredSubstitutes.length === 0 ? (
            <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-4" size={32} />
              <p className="text-slate-900 font-black text-lg">
                אין מחליפות פנויות
              </p>
              <p className="text-slate-500 text-sm mt-1">
                לא נמצאו גננות פנויות ביום זה
              </p>
            </div>
          ) : (
            filteredSubstitutes.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shadow-md">
                    {sub.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800">
                          {sub.firstName} {sub.lastName}
                        </p>
                        
                        {/* --- האייקונים החדשים --- */}
                        {sub.isDayOff && (
                            <span title="שימי לב: זהו יום חופש של הגננת" className="text-amber-500 cursor-help">
                                <Info size={16} />
                            </span>
                        )}
                        {sub.isFixedRotationToday && (
                            <span title="גננת זו משובצת היום ברוטציה קבועה בגן אחר" className="text-blue-500 cursor-help">
                                <Clock size={16} />
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {sub.phoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  disabled={isProcessing}
                  onClick={() => updatePlacement(sub.id, "ASSIGNED")}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "שבצי"
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}