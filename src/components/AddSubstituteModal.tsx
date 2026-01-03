"use client";
import { useState, useEffect } from "react";
import { X, UserCheck, Clock, Info, Calendar } from "lucide-react";
import FormInput from "./FormInput";
import { validations } from "@/utils/validations";

export default function AddSubstituteModal({
  isOpen,
  onClose,
  onSuccess,
}: any) {
  const [role, setRole] = useState<"SUBSTITUTE" | "ROTATION">("SUBSTITUTE");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formDataState, setFormDataState] = useState({
    firstName: "",
    lastName: "",
    idNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });

  const [schedule, setSchedule] = useState<any>({
    SUNDAY: { active: true, instId: "" },
    MONDAY: { active: true, instId: "" },
    TUESDAY: { active: true, instId: "" },
    WEDNESDAY: { active: true, instId: "" },
    THURSDAY: { active: true, instId: "" },
    FRIDAY: { active: true, instId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/test?type=allInstitutions")
        .then((res) => res.json())
        .then((data) => setInstitutions(Array.isArray(data) ? data : []));
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDataState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const isIdValid = validations.idNumber(formDataState.idNumber) === "";
    const isPhoneValid =
      validations.phoneNumber(formDataState.phoneNumber) === "";
    const isEmailValid = validations.email(formDataState.email) === "";

    if (!isIdValid || !isPhoneValid || !isEmailValid) {
      alert("נא לתקן את השגיאות בטופס");
      return;
    }

    if (!formDataState.dateOfBirth) {
      alert("נא להזין תאריך לידה");
      return;
    }

    setLoading(true);

    const activeDays = Object.keys(schedule).filter(
      (day) => schedule[day].active
    );

    const payload = {
      ...formDataState,
      dateOfBirth: new Date(formDataState.dateOfBirth).toISOString(),
      roles: [role],
      isWorking: true,
      workDays:
        role === "SUBSTITUTE"
          ? ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
          : activeDays,
    };

    try {
      const res = await fetch("/api/supervisor/register", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error((await res.json()).message);
      onSuccess();
      onClose();
      setFormDataState({
        firstName: "",
        lastName: "",
        idNumber: "",
        phoneNumber: "",
        email: "",
        password: "",
        dateOfBirth: "",
      });
    } catch (err: any) {
      alert(err.message || "שגיאה ברישום");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white relative shrink-0">
          <h2 className="text-2xl font-black">הוספת צוות מחליף</h2>
          <p className="opacity-90 text-sm font-medium">
            רישום גננת מחליפה או רוטציה
          </p>
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-8 space-y-8"
        >
          {/* בחירת תפקיד */}
          <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole("SUBSTITUTE")}
              className={`p-4 rounded-xl font-black flex items-center justify-center gap-2 ${
                role === "SUBSTITUTE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <UserCheck size={18} /> גננת מחליפה
            </button>
            <button
              type="button"
              onClick={() => setRole("ROTATION")}
              className={`p-4 rounded-xl font-black flex items-center justify-center gap-2 ${
                role === "ROTATION"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <Clock size={18} /> גננת רוטציה
            </button>
          </div>

          {/* פרטים אישיים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              kind="firstName"
              value={formDataState.firstName}
              onChange={handleInputChange}
            />
            <FormInput
              kind="lastName"
              value={formDataState.lastName}
              onChange={handleInputChange}
            />

            <FormInput
              kind="idNumber"
              value={formDataState.idNumber}
              onChange={handleInputChange}
            />
            <FormInput
              kind="phone"
              value={formDataState.phoneNumber}
              onChange={handleInputChange}
            />
            <FormInput
              kind="email"
              value={formDataState.email}
              onChange={handleInputChange}
            />

            <FormInput
              kind="password"
              value={formDataState.password}
              onChange={handleInputChange}
            />
            <FormInput
              kind="dateOfBirth"
              value={formDataState.dateOfBirth}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
          </div>

          {/*כרגע מוותרת על ימי חופשה לרוטציה */}
          {role === "SUBSTITUTE" && (
            <div className="space-y-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase border-b pb-2">
                <Calendar size={14} /> הגדרת ימי עבודה
              </div>

              {Object.keys(schedule).map((day) => (
                <div
                  key={day}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    schedule[day].active
                      ? "bg-white border-emerald-100"
                      : "bg-slate-50 border-slate-100 opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSchedule({
                        ...schedule,
                        [day]: {
                          ...schedule[day],
                          active: !schedule[day].active,
                        },
                      })
                    }
                    className={`w-24 py-2 rounded-lg text-[10px] font-black ${
                      schedule[day].active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {day}
                  </button>
                  <span className="text-sm font-bold text-slate-600">
                    {schedule[day].active ? "יום עבודה פעיל" : "יום חופש"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {role === "SUBSTITUTE" && (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
              <Info className="text-amber-500" />
              <p className="text-xs text-amber-800 leading-relaxed">
                גננת מחליפה מוגדרת כזמינה לפי קריאה.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg active:scale-95 transition disabled:bg-slate-300"
          >
            {loading ? "שומר..." : "סיום ורישום"}
          </button>
        </form>
      </div>
    </div>
  );
}
