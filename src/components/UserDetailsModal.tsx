"use client";

import { useState, useEffect } from "react";
import {
  X, MapPin, Phone, Mail, Award, Shield, Save,
  CheckCircle2, GraduationCap, Calendar, Clock,
  User as UserIcon, CreditCard, Power, UserCheck,
  UserMinus, ChevronDown, Loader2
} from "lucide-react";
import ValidatedField from "./ValidatedField"; // ייבוא הקומפוננטה
import { validations } from "@/utils/validations"; // ייבוא הלוגיקה

export default function UserDetailsModal({ user, isOpen, onClose, onUpdateSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rotations, setRotations] = useState<any[]>([]);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    idNumber: user.idNumber || "", 
    phoneNumber: user.phoneNumber || "",
    roles: user.roles || [],
    isWorking: user.isWorking ?? true,
    instructorId: user.instructorId || "",
    workDays: user.workDays || ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    rotationTeacherId: user.rotationTeacherId || "",
  });

  const ALLOWED_ROLE_COMBINATIONS = [
    { id: "MANAGER_ONLY", label: "גננת אם בלבד", roles: ["MANAGER"] },
    { id: "INSTRUCTOR_ONLY", label: "מדריכה בלבד", roles: ["INSTRUCTOR"] },
    { id: "MANAGER_INSTRUCTOR", label: "גננת אם וגם מדריכה", roles: ["MANAGER", "INSTRUCTOR"] },
    { id: "SUBSTITUTE_ONLY", label: "מחליפה בלבד", roles: ["SUBSTITUTE"] },
    { id: "ROTATION_ONLY", label: "רוטציה בלבד", roles: ["ROTATION"] },
  ];

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/instructors")
        .then((res) => res.json())
        .then((data) => setInstructors(Array.isArray(data) ? data : []));
      
      fetch("/api/supervisor/users-stats")
        .then((res) => res.json())
        .then((data) => {
          const onlyRotations = data.filter((u: any) => u.roles.includes("ROTATION"));
          setRotations(onlyRotations);
        });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleWorkDay = (dayId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      workDays: prev.workDays.includes(dayId)
        ? prev.workDays.filter((d: string) => d !== dayId)
        : [...prev.workDays, dayId],
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- הוספת וולידציה לפני עדכון ---
    const isIdValid = validations.idNumber(formData.idNumber) === "";
    const isPhoneValid = validations.phoneNumber(formData.phoneNumber) === "";
    const isEmailValid = validations.email(formData.email) === "";

    if (!isIdValid || !isPhoneValid || !isEmailValid) {
      alert("לא ניתן לשמור: אחד או יותר מהשדות (ת\"ז, טלפון, אימייל) אינם תקינים.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        dateOfBirth: new Date(user.dateOfBirth).toISOString(),
      };

      const res = await fetch(`/api/supervisor/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onUpdateSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "שגיאה בעדכון");
      }
    } catch (err) {
      alert("שגיאת תקשורת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><UserIcon size={30} /></div>
            <div>
              <h2 className="text-2xl font-black">{formData.firstName} {formData.lastName}</h2>
              <p className="text-slate-400 text-sm italic">עריכת פרופיל משתמשת</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
        </div>

        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll">
          
          {/* שמות */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-2">שם פרטי</label>
              <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 mr-2">שם משפחה</label>
              <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium" />
            </div>
          </section>

          {/* שדות עם וולידציה */}
          <section className="space-y-4">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg"><Award size={20} className="text-indigo-500" /> פרטי זיהוי וקשר</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ValidatedField
                name="idNumber"
                label="תעודת זהות"
                value={formData.idNumber}
                onChange={handleInputChange}
              />
              <ValidatedField
                name="phoneNumber"
                label="מספר טלפון"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            <ValidatedField
              name="email"
              label="כתובת אימייל"
              value={formData.email}
              onChange={handleInputChange}
            />
          </section>

          {/* ימי עבודה */}
          <section className="space-y-4 border-t pt-6">
            <h4 className="font-black text-slate-700 flex items-center gap-2 text-lg"><Clock size={20} className="text-indigo-500" /> ימי עבודה קבועים</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { id: "SUNDAY", label: "א'" }, { id: "MONDAY", label: "ב'" },
                { id: "TUESDAY", label: "ג'" }, { id: "WEDNESDAY", label: "ד'" },
                { id: "THURSDAY", label: "ה'" }, { id: "FRIDAY", label: "ו'" }
              ].map((day) => {
                const isActive = formData.workDays.includes(day.id);
                return (
                  <button
                    key={day.id} type="button" onClick={() => toggleWorkDay(day.id)}
                    className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                      isActive ? "bg-white border-slate-200 text-slate-700" : "bg-red-50 border-red-500 text-red-700 shadow-sm"
                    }`}
                  >
                    <span className="text-lg font-black">{day.label}</span>
                    <span className="text-[8px] font-bold">{isActive ? "עבודה" : "חופש"}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* סטטוס פעילות */}
          <section className="space-y-4 border-t pt-6">
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, isWorking: !p.isWorking }))}
              className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                formData.isWorking ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700"
              }`}
            >
              <span className="font-black">{formData.isWorking ? "המשתמשת פעילה במערכת" : "המשתמשת מושבתת (לא תופיע לשיבוצים)"}</span>
              {formData.isWorking ? <UserCheck /> : <UserMinus />}
            </button>
          </section>

          {/* Footer */}
          <div className="pt-6 flex gap-4 sticky bottom-0 bg-white border-t mt-auto">
            <button
              type="submit" disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> שמירת שינויים</>}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}