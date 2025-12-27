"use client";
import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";

export default function AddInstitutionModal({ isOpen, onClose, onSuccess }: any) {
  const [managers, setManagers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/managers")
        .then(res => res.json())
        .then(data => setManagers(Array.isArray(data) ? data : []));
    }
  }, [isOpen]);

  // פונקציית סינון לפי חיפוש
  const filteredManagers = managers.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const selectedManagerId = formData.get("mainManagerId");
    const selectedManager = managers.find(m => m.id === selectedManagerId);

    const payload = {
      name: formData.get("name"),
      address: formData.get("address"),
      institutionNumber: formData.get("institutionNumber"),
      mainManagerId: selectedManagerId,
      instructorId: selectedManager?.instructorId,
    };

    // שימי לב לכתובת המעודכנת כאן:
    const res = await fetch("/api/supervisor/institutions", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      const err = await res.json();
      alert(err.message || "שגיאה ביצירת הגן");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-black" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-emerald-700 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">הקמת גן חדש</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input name="name" required placeholder="שם הגן" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 placeholder-black outline-none" />
          <input name="address" required placeholder="כתובת" className="w-full border p-2 rounded focus:ring-2 focus:ring-emerald-500 placeholder-black outline-none" />
          <input name="institutionNumber" required placeholder="מספר מוסד" className="w-full border p-2 rounded focus:ring-2  placeholder-black-emerald-500 outline-none" />

          <div className="space-y-2 border-t pt-4">
            <label className="text-sm font-bold text-emerald-800">בחרי גננת אם פנויה:</label>
            
            {/* שדה חיפוש בתוך המודאל */}
            <div className="relative">
              <Search className="absolute right-2 top-2.5 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="חפשי גננת..." 
                className="w-full border p-2 pr-8 rounded text-sm placeholder-black bg-gray-50 outline-none focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select name="mainManagerId" required className="w-full border p-2 rounded bg-white outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">-- בחרי מרשימה ({filteredManagers.length} נמצאו) --</option>
              {filteredManagers.map((m: any) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading || managers.length === 0} 
            className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold hover:bg-emerald-700 disabled:bg-gray-400 transition-all shadow-lg mt-4"
          >
            {loading ? "מקים גן..." : "צור גן חדש"}
          </button>
        </form>
      </div>
    </div>
  );
}