"use client";
import { useState, useEffect } from "react";
import {
  X,
  Search,
  Building2,
  MapPin,
  Hash,
  User,
  Info,
  CheckCircle2,
  Plus,
  Sparkles,
  Building,
} from "lucide-react";
import LoadingScreen from "./ui/LoadingScreen";

export default function AddInstitutionModal({
  isOpen,
  onClose,
  onSuccess,
}: any) {
  const [managers, setManagers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(""); // <--- הוספת State לבחירה



 useEffect(() => {
  if (isOpen) {
    fetch("/api/supervisor/managers")
      .then((res) => res.json())
      .then((data) => {
        console.log("Managers fetched:", data); // בדיקה
        setManagers(Array.isArray(data) ? data : []);
      });
  }
}, [isOpen]);


  const filteredManagers = managers.filter((m) =>
    `${m.firstName} ${m.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedId) return alert("חובה לבחור גננת אם"); // בדיקה שנבחרה גננת

    setLoading(true);
    const formData = new FormData(e.target);
    const selectedManager = managers.find((m) => m.id === selectedId);

    const payload = {
      name: formData.get("name"),
      address: formData.get("address"),
      institutionNumber: formData.get("institutionNumber"),
      mainManagerId: selectedId, // שימוש ב-State
      instructorId: selectedManager?.instructorId,
    };

    const res = await fetch("/api/supervisor/institutions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      onSuccess();
      onClose();
      setSearchTerm("");
      setSelectedId(""); // איפוס
    } else {
      const err = await res.json();
      alert(err.message || "שגיאה ביצירת הגן");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl my-auto overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header - סגנון כהה ויוקרתי */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                הקמת גן חדש
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
                <Plus size={14} /> רישום מוסד חינוכי חדש במחוז
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-6 custom-calendar-scroll"
        >
          {/* פרטי הגן */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <Building size={14} /> פרטי המוסד
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">
                שם הגן
              </label>
              <div className="relative">
                <input
                  name="name"
                  required
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  placeholder="לדוגמה: גן אורן"
                />
                <Building2
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">
                כתובת
              </label>
              <div className="relative">
                <input
                  name="address"
                  required
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                  placeholder="רחוב ומספר, עיר"
                />
                <MapPin
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">
                מספר מוסד
              </label>
              <div className="relative">
                <input
                  name="institutionNumber"
                  required
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="מספר זיהוי משרד החינוך"
                />
                <Hash
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
              </div>
            </div>
          </div>

          {/* בחירת גננת אם */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-50">
              <User size={14} /> גננת אם אחראית
            </div>

            <div className="relative group">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="חפשי גננת ברשימה..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 custom-calendar-scroll">
              {filteredManagers.length > 0 ? (
                filteredManagers.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)} // הבחירה מתבצעת בלחיצה על כל השטח
                    className={`flex items-center gap-4 p-4 transition-all cursor-pointer border-b border-slate-50 last:border-0 group ${
                      selectedId === m.id
                        ? "bg-indigo-50/80 shadow-inner"
                        : "hover:bg-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedId === m.id
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedId === m.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>

                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        selectedId === m.id
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {m.firstName[0]}
                    </div>

                    <div className="flex-1 text-right">
                      <div
                        className={`text-sm font-black ${
                          selectedId === m.id
                            ? "text-indigo-900"
                            : "text-slate-700"
                        }`}
                      >
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        גננת זמינה לשיבוץ מוסד
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Info className="mx-auto text-slate-300 mb-2" size={24} />
                  <p className="text-slate-400 text-xs font-bold italic">
                    {searchTerm
                      ? "לא נמצאו תוצאות"
                      : "אין גננות אם פנויות כרגע"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 flex gap-4 shrink-0">
            <button
              type="submit"
              disabled={loading || managers.length === 0}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <LoadingScreen message="מקים גן..." />
                
              ) : (
                <>
                  <Sparkles size={18} />
                  סיום והקמת הגן
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
