"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AddUserModal({ isOpen, onClose, onSuccess }: any) {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // טעינת רשימת מדריכות בלבד
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-auto text-black">
        <div className="p-6 bg-blue-800 text-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold">רישום משתמשת חדשה</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* בחירת תפקיד */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="block font-bold mb-2 text-blue-900 font-sans">בחרי תפקיד:</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes("MANAGER")}
                  onChange={() => handleRoleChange("MANAGER")}
                  className="w-4 h-4 accent-blue-700"
                />
                <span className="font-medium group-hover:text-blue-700">גננת אם</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes("INSTRUCTOR")}
                  onChange={() => handleRoleChange("INSTRUCTOR")}
                  className="w-4 h-4 accent-blue-700"
                />
                <span className="font-medium group-hover:text-blue-700">מדריכה</span>
              </label>
            </div>
          </div>

          {!hasSelectedRole && (
            <div className="text-center text-gray-500 text-sm py-6 animate-pulse">
              יש לבחור תפקיד כדי להמשיך במילוי הטופס
            </div>
          )}

          {hasSelectedRole && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans transition-all duration-300 ease-in-out">

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">שם פרטי</label>
                <input name="firstName" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">שם משפחה</label>
                <input name="lastName" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">תעודת זהות</label>
                <input name="idNumber" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">אימייל</label>
                <input name="email" type="email" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">שם משתמש</label>
                <input name="username" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">סיסמה</label>
                <input name="password" type="password" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">טלפון</label>
                <input name="phoneNumber" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold mr-1">תאריך לידה</label>
                <input name="dateOfBirth" type="date" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {isManager && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-800">מדריכה מלווה</label>
                    <select name="instructorId" required className="w-full border p-2 rounded bg-white outline-none">
                      <option value="">בחרי מדריכה...</option>
                      {Array.isArray(instructors) && instructors.map((i: any) => (
                        <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

            </div>
          )}

          <button
            type="submit"
            disabled={loading || !hasSelectedRole}
            className="w-full bg-blue-700 text-white p-3 rounded-xl font-bold hover:bg-blue-800 disabled:bg-gray-400 transition-all shadow-lg active:scale-95"
          >
            {loading ? "יוצרת משתמשת..." : "סיום והרשמה"}
          </button>

        </form>
      </div>
    </div>
  );
}
