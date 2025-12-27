"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Building2, User, AlertCircle, FileText } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPlacementModal({ isOpen, onClose, onSuccess }: Props) {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      // טעינת רשימת המוסדות
      fetch("/api/supervisor/institutions")
        .then(res => res.json())
        .then(data => setInstitutions(Array.isArray(data) ? data : []))
        .catch(() => setInstitutions([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      institutionId: formData.get("institutionId"),
      date: formData.get("date"),
      priority: formData.get("priority"),
      notes: formData.get("notes") || "",
    };

    try {
      const res = await fetch("/api/supervisor/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        // איפוס הטופס
        setSelectedInstitution("");
        setSearchTerm("");
      } else {
        const err = await res.json();
        alert(err.message || "שגיאה ביצירת הדיווח");
      }
    } catch (error) {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // סינון המוסדות לפי חיפוש
  const filteredInstitutions = institutions.filter(inst => {
    const searchLower = searchTerm.toLowerCase();
    const instName = inst.name.toLowerCase();
    const managerName = `${inst.mainManager?.firstName} ${inst.mainManager?.lastName}`.toLowerCase();
    return instName.includes(searchLower) || managerName.includes(searchLower);
  });

  // פרטי המוסד שנבחר
  const selectedInst = institutions.find(i => i.id === selectedInstitution);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">דיווח היעדרות חדש</h2>
            <p className="text-sm text-gray-500 mt-1">הוספת דיווח על היעדרות גננת והצורך במחליפה</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* בחירת תאריך */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תאריך ההיעדרות</label>
            <div className="relative">
              <input 
                type="date" 
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* חיפוש וברירת גן */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחירת גן</label>
            
            {/* שדה חיפוש */}
            <div className="relative mb-3">
              <input 
                type="text" 
                placeholder="חיפוש לפי שם גן או גננת..."
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* רשימת גנים */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredInstitutions.length > 0 ? (
                filteredInstitutions.map((inst) => (
                  <label
                    key={inst.id}
                    className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer ${
                      selectedInstitution === inst.id ? "bg-gray-100" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="institutionId"
                      value={inst.id}
                      required
                      checked={selectedInstitution === inst.id}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                      className="w-4 h-4 accent-gray-900"
                    />
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{inst.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        גננת: {inst.mainManager?.firstName} {inst.mainManager?.lastName}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  {searchTerm ? "לא נמצאו תוצאות" : "אין גנים זמינים"}
                </div>
              )}
            </div>

            {filteredInstitutions.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {filteredInstitutions.length} גנים נמצאו
              </p>
            )}
          </div>

          {/* פרטי הגן שנבחר */}
          {selectedInst && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-blue-700" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 mb-1">{selectedInst.name}</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>גננת: {selectedInst.mainManager?.firstName} {selectedInst.mainManager?.lastName}</div>
                    <div>כתובת: {selectedInst.address}</div>
                    <div>מספר מוסד: {selectedInst.institutionNumber}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* דחיפות */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">רמת דחיפות</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-all has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50">
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  defaultChecked
                  className="w-4 h-4 accent-gray-900"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">רגיל</div>
                  <div className="text-xs text-gray-500">דיווח סטנדרטי</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-all has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                <input
                  type="radio"
                  name="priority"
                  value="URGENT"
                  className="w-4 h-4 accent-orange-500"
                />
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">דחוף</div>
                    <div className="text-xs text-gray-500">דורש טיפול מיידי</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* הערות */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הערות (אופציונלי)</label>
            <div className="relative">
              <textarea
                name="notes"
                rows={3}
                placeholder="הוסיפי הערות נוספות על ההיעדרות..."
                className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 resize-none"
              />
              <FileText size={18} className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* כפתור שליחה */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !selectedInstitution}
              className="w-full bg-gray-900 text-white p-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "שומר דיווח..." : "שליחת דיווח"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}