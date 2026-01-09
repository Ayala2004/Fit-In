"use client";
import { useState, useEffect } from "react";
import { X, Building2, MapPin, Hash, User, Save, Loader2, Search, Info } from "lucide-react";
import LoadingScreen from "../ui/LoadingScreen";

export default function EditInstitutionModal({ isOpen, onClose, onSuccess, institution }: any) {
  const [managers, setManagers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  // טעינת נתונים ראשונית
  useEffect(() => {
    if (isOpen && institution) {
      setSelectedId(institution.mainManagerId);
      // נביא את כל הגננות הפנויות + הגננת הנוכחית של הגן
      fetch("/api/supervisor/managers")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          // אם הגננת הנוכחית לא ברשימה (כי היא כבר "תפוסה" על ידי הגן הזה), נוסיף אותה ידנית
          if (institution.mainManager && !list.find((m:any) => m.id === institution.mainManagerId)) {
            list.unshift(institution.mainManager);
          }
          setManagers(list);
        });
    }
  }, [isOpen, institution]);

  const filteredManagers = managers.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const selectedManager = managers.find(m => m.id === selectedId);

    const payload = {
      name: formData.get("name"),
      address: formData.get("address"),
      institutionNumber: formData.get("institutionNumber"),
      mainManagerId: selectedId,
      instructorId: selectedManager?.instructorId || institution.instructorId,
    };

    try {
      const res = await fetch(`/api/supervisor/institutions/${institution.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || "שגיאה בעדכון הגן");
      }
    } catch (err) {
      alert("שגיאת תקשורת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !institution) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-2xl font-black">עריכת מוסד</h2>
              <p className="text-slate-400 text-sm">עדכון פרטים עבור: {institution.name}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-calendar-scroll">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">שם הגן</label>
              <div className="relative">
                <input name="name" defaultValue={institution.name} required className="input-standard pr-10" />
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">כתובת</label>
              <div className="relative">
                <input name="address" defaultValue={institution.address} required className="input-standard pr-10" />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 mr-2">מספר מוסד</label>
              <div className="relative">
                <input name="institutionNumber" defaultValue={institution.institutionNumber} required className="input-standard pr-10" />
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <label className="text-sm font-black text-slate-700 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> גננת אם אחראית
            </label>
            <input 
              type="text" 
              placeholder="חפשי להחלפת גננת..." 
              className="w-full p-2 bg-slate-100 rounded-xl text-xs outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100">
              {filteredManagers.map((m: any) => (
                <div 
                  key={m.id} 
                  onClick={() => setSelectedId(m.id)}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition-colors border-b last:border-0 ${selectedId === m.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedId === m.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                    {selectedId === m.id && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                  </div>
                  <span className="text-sm font-bold">{m.firstName} {m.lastName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              {loading ? <LoadingScreen /> : <><Save size={18} /> שמירת שינויים</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}