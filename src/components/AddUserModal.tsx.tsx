"use client";
import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Lock,
  Shield,
  GraduationCap,
  Building,
  Info,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import { validations } from "@/utils/validations";
import FormInput from "./FormInput";
type AddUserFormData = {
  firstName: string;
  lastName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  password: string;
  dateOfBirth: string;
  instructorId: string;
};
export default function AddUserModal({ isOpen, onClose, onSuccess }: any) {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [freeDays, setFreeDays] = useState<string[]>([]);

  const [formData, setFormData] = useState<AddUserFormData>({
    firstName: "",
    lastName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
    dateOfBirth: "",
    instructorId: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFreeDay = (day: string) => {
    setFreeDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    if (isOpen) {
      fetch("/api/supervisor/instructors")
        .then((res) => res.json())
        .then((data) => setInstructors(Array.isArray(data) ? data : []))
        .catch(() => setInstructors([]));
    }
  }, [isOpen]);

  const handleRoleChange = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const isIdValid = validations.idNumber(formData.idNumber) === "";
    const isPhoneValid = validations.phoneNumber(formData.phoneNumber) === "";
    const isEmailValid = validations.email(formData.email) === "";

    if (!isIdValid || !isPhoneValid || !isEmailValid) {
      alert(
        "לא ניתן לשמור: אחד או יותר מהשדות (ת״ז, טלפון, אימייל) אינם תקינים."
      );
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData(e.target);
      const formProps = Object.fromEntries(formData.entries()) as Record<
        string,
        string
      >;
      const payload = {
        ...formProps,
        ...formData,
        roles: selectedRoles,
        workDays: [
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ].filter((d) => !freeDays.includes(d)),
        dateOfBirth: new Date(formProps.dateOfBirth as string).toISOString(),
      };

      const res = await fetch("/api/supervisor/register", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "שגיאה ברישום");
      }

      onSuccess();
      onClose();
      setSelectedRoles([]);
      setFreeDays([]);
    } catch (err: any) {
      alert(err.message || "שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isManager = selectedRoles.includes("MANAGER");
  const isInstructor = selectedRoles.includes("INSTRUCTOR");
  const hasSelectedRole = selectedRoles.length > 0;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl my-auto overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                רישום משתמשת חדשה
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
                <Info size={14} /> הקימי פרופיל חדש במערכת הפיקוח
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
          className="flex-1 overflow-y-auto p-8 space-y-8 custom-calendar-scroll"
        >
          {/* סקציה 1: בחירת תפקיד */}
          <div className="space-y-4">
            {/* ... אותו קוד של בחירת תפקיד — ללא שינוי ... */}
          </div>

          {!hasSelectedRole ? (
            <div className="p-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-500 font-bold">
                יש לבחור לפחות תפקיד אחד כדי להמשיך
              </p>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* כותרת */}
                <div className="md:col-span-2 flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest pb-2 border-b border-slate-100">
                  <User size={14} /> פרטי זהות ויצירת קשר
                </div>

                <FormInput
                  kind="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />

                <FormInput
                  kind="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />

                <FormInput
                  kind="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                />

                <FormInput
                  kind="phone"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />

                <FormInput
                  kind="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />

                <FormInput
                  kind="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />

                {/* תאריך לידה */}
                <div
                  className={`space-y-2 ${
                    isInstructor ? "col-span-2" : "col-span-1"
                  }`}
                >
                  <label className="text-xs font-bold text-slate-500 mr-2">
                    תאריך לידה
                  </label>
                  <div className="relative">
                    <input
                      name="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                    <Calendar
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>

                {/* מדריכה מלווה - רק אם MANAGER */}
                {!isInstructor && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 mr-2">
                      מדריכה מלווה
                    </label>
                    <div className="relative">
                      <select
                        name="instructorId"
                        required
                        value={formData.instructorId}
                        onChange={handleInputChange}
                        className="w-full pr-10 pl-4 py-3 bg-indigo-50/50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 outline-none appearance-none"
                      >
                        <option value="">בחרי מדריכה...</option>
                        {instructors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.firstName} {i.lastName}
                          </option>
                        ))}
                      </select>
                      <GraduationCap
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400"
                        size={16}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-6 flex gap-4 shrink-0">
            <button
              type="submit"
              disabled={loading || !hasSelectedRole}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:shadow-none active:scale-95"
            >
              {loading ? "יוצר משתמשת..." : "סיום ורישום משתמשת"}
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
