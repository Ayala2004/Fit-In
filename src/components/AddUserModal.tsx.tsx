"use client";
import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, CreditCard, Lock, UserCheck } from "lucide-react";

export default function AddUserModal({ isOpen, onClose, onSuccess }: any) {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/instructors")
        .then(res => res.json())
        .then(data => setInstructors(Array.isArray(data) ? data : []))
        .catch(() => setInstructors([]));
    }
  }, [isOpen]);

  const handleRoleChange = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);

    const payload = {
      ...formProps,
      roles: selectedRoles,
    };

    try {
      const res = await fetch("/api/supervisor/register", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.message || "שגיאה ברישום");
      }
    } catch {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isManager = selectedRoles.includes("MANAGER");
  const hasSelectedRole = selectedRoles.length > 0;

  return (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
     
        {/* כותרת */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">רישום משתמשת חדשה</h2>
            <p className="text-sm text-gray-500 mt-1">הזיני את פרטי המשתמשת החדשה</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* בחירת תפקיד */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">בחירת תפקיד</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange("MANAGER")}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  selectedRoles.includes("MANAGER")
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedRoles.includes("MANAGER")
                      ? "border-gray-900 bg-gray-900"
                      : "border-gray-300"
                  }`}>
                    {selectedRoles.includes("MANAGER") && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">גננת אם</div>
                    <div className="text-xs text-gray-500">ניהול גן</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("INSTRUCTOR")}
                className={`p-4 rounded-lg border-2 transition-all text-right ${
                  selectedRoles.includes("INSTRUCTOR")
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedRoles.includes("INSTRUCTOR")
                      ? "border-gray-900 bg-gray-900"
                      : "border-gray-300"
                  }`}>
                    {selectedRoles.includes("INSTRUCTOR") && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">מדריכה</div>
                    <div className="text-xs text-gray-500">ליווי והדרכה</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {!hasSelectedRole && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">יש לבחור תפקיד כדי להמשיך</p>
            </div>
          )}

          {hasSelectedRole && (
            <div className="space-y-4">
              
              {/* שם פרטי ושם משפחה */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם פרטי</label>
                  <div className="relative">
                    <input 
                      name="firstName" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="הזיני שם פרטי"
                    />
                    <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שם משפחה</label>
                  <div className="relative">
                    <input 
                      name="lastName" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="הזיני שם משפחה"
                    />
                    <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* תעודת זהות ואימייל */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תעודת זהות</label>
                  <div className="relative">
                    <input 
                      name="idNumber" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="9 ספרות"
                    />
                    <CreditCard size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                  <div className="relative">
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="example@email.com"
                    />
                    <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* סיסמה וטלפון */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה</label>
                  <div className="relative">
                    <input 
                      name="password" 
                      type="password" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="לפחות 6 תווים"
                    />
                    <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                  <div className="relative">
                    <input 
                      name="phoneNumber" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400" 
                      placeholder="05X-XXXXXXX"
                    />
                    <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* תאריך לידה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תאריך לידה</label>
                <div className="relative">
                  <input 
                    name="dateOfBirth" 
                    type="date" 
                    required 
                    className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                  />
                  <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* מדריכה מלווה - רק אם בחרו גננת אם */}
              {isManager && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">מדריכה מלווה</label>
                  <div className="relative">
                    <select 
                      name="instructorId" 
                      required 
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white appearance-none"
                    >
                      <option value="">בחרי מדריכה...</option>
                      {Array.isArray(instructors) && instructors.map((i: any) => (
                        <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                      ))}
                    </select>
                    <UserCheck size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* כפתור שליחה */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !hasSelectedRole}
              className="w-full bg-gray-900 text-white p-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "שומר..." : "רישום משתמשת"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}