"use client";

import { useState, useEffect } from "react";
import { X, Search, UserCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

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
  const [isAssigning, setIsAssigning] = useState(false); // סטייט למניעת כפילות לחיצות

  useEffect(() => {
    if (isOpen && placement?.date) {
      setLoading(true);
      const dateParam = encodeURIComponent(
        new Date(placement.date).toISOString()
      );

      fetch(`/api/supervisor/substitutes?date=${dateParam}`)
        .then((res) => res.json())
        .then((data) => {
          setSubstitutes(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("טעינת מחליפות נכשלה:", err);
          setLoading(false);
        });
    }
  }, [isOpen, placement]);

  const handleAssign = async (substituteId: string) => {
    setIsAssigning(true); // מתחילים טעינה של הכפתור
    try {
      const response = await fetch('/api/supervisor/placements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: placement.id,
          substituteId: substituteId,
          status: 'ASSIGNED'
        }),
      });

      if (response.ok) {
        // קריאה לפונקציה שמרעננת את הנתונים בדף הראשי
        if (onSuccess) onSuccess();
        // סגירת המודאל
        onClose();
      } else {
        alert('שגיאה בעדכון השיבוץ');
      }
    } catch (error) {
      console.error("Error updating placement:", error);
      alert('שגיאת תקשורת');
    } finally {
      setIsAssigning(false); // מסיימים טעינה
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* כותרת המודאל */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold italic tracking-tight">
              שיבוץ מחליפה
            </h3>
            <p className="text-slate-400 text-sm">
              גן: {placement.institution?.name} |{" "}
              {format(new Date(placement.date), "dd/MM/yyyy", { locale: he })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* שורת חיפוש */}
        <div className="p-4 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חפשי לפי שם או טלפון..."
              className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* רשימת המחליפות */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-3">
              <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
              <p className="text-slate-400 text-sm font-medium">
                בודק זמינות מחליפות...
              </p>
            </div>
          ) : filteredSubstitutes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-medium">
                לא נמצאו מחליפות פנויות ליום זה
              </p>
            </div>
          ) : (
            filteredSubstitutes.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-blue-50 transition-all group border-b-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                    {sub.firstName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none mb-1">
                      {sub.firstName} {sub.lastName}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {sub.phoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  disabled={isAssigning}
                  onClick={() => handleAssign(sub.id)}
                  className="flex items-center gap-1 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 shadow-sm min-w-[100px] justify-center"
                >
                  {isAssigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      שבצי עכשיו
                    </>
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