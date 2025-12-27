"use client";
import { useState, useEffect } from "react";
import { X, Search, Building2, MapPin, Hash, User } from "lucide-react";

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
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">

      {/* כותרת */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">הקמת גן חדש</h2>
          <p className="text-sm text-gray-500 mt-1">הזיני את פרטי הגן החדש</p>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* שם הגן */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">שם הגן</label>
            <div className="relative">
              <input 
                name="name" 
                required 
                placeholder="לדוגמה: גן הילדים הקטנים"
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
              />
              <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* כתובת */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">כתובת</label>
            <div className="relative">
              <input 
                name="address" 
                required 
                placeholder="רחוב, עיר"
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
              />
              <MapPin size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* מספר מוסד */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מספר מוסד</label>
            <div className="relative">
              <input 
                name="institutionNumber" 
                required 
                placeholder="מספר מזהה של המוסד"
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
              />
              <Hash size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* בחירת גננת אם */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">גננת אם לגן</label>
            
            {/* שדה חיפוש */}
            <div className="relative mb-3">
              <input 
                type="text" 
                placeholder="חיפוש גננת..." 
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* רשימת גננות */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredManagers.length > 0 ? (
                filteredManagers.map((m: any) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="mainManagerId"
                      value={m.id}
                      required
                      className="w-4 h-4 accent-gray-900"
                    />
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                      <User size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {m.firstName} {m.lastName}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  {searchTerm ? "לא נמצאו תוצאות" : "אין גננות פנויות"}
                </div>
              )}
            </div>
            
            {filteredManagers.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {filteredManagers.length} גננות נמצאו
              </p>
            )}
          </div>

          {/* כפתור שליחה */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading || managers.length === 0} 
              className="w-full bg-gray-900 text-white p-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "יוצר גן..." : "יצירת גן חדש"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}