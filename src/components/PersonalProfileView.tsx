"use client";
import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Phone,
  Mail,
  MapPin,
  Shield,
  Save,
  Key,
  UserCircle,
  CreditCard,
  Calendar,
  BriefcaseBusiness,
} from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function PersonalProfileView() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"INFO" | "SECURITY">("INFO");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.address || "",
        });
        setLoading(false);
      });
  }, []);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) alert("הפרטים עודכנו בהצלחה ✨");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm)
      return alert("הסיסמאות החדשות לא תואמות");
    setSaving(true);
    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) setPasswords({ current: "", new: "", confirm: "" });
    setSaving(false);
  };

  if (loading) return <LoadingScreen message="טוען פרופיל אישי..." />;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-200 mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100 relative z-10">
            {user.firstName[0]}
          </div>
          <div className="text-center md:text-right relative z-10">
            <h1 className="text-3xl font-black text-slate-800">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2 mt-1">
              <BriefcaseBusiness size={16} className="text-indigo-500" />
              {user.roles.includes("SUPERVISOR")
                ? "מפקחת"
                : user.roles.includes("INSTRUCTOR")
                  ? user.roles.includes("MANAGER")
                    ? "מדריכה וגננת אם"
                    : "מדריכה"
                  : user.roles.includes("MANAGER")
                    ? "גננת אם"
                    : user.roles.includes("SUBSTITUTE")
                      ? "מחליפה"
                      : user.roles.includes("ROTATION")
                        ? "גננת משלימה"
                        : "צוות הוראה"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("INFO")}
              className={`flex-1 py-3 font-black text-sm transition-all ${
                activeTab === "INFO"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              פרטים אישיים
            </button>
            <button
              onClick={() => setActiveTab("SECURITY")}
              className={`flex-1 py-3 font-black text-sm transition-all ${
                activeTab === "SECURITY"
                  ? "border-b-4 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              אבטחה וסיסמה
            </button>
          </div>

          {/* Main Content */}
          <div className="p-8 space-y-6">
            {activeTab === "INFO" && (
              <>
                <form onSubmit={handleUpdateInfo} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase">
                        שם פרטי
                      </label>
                      <input
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-400 uppercase">
                        שם משפחה
                      </label>
                      <input
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase">
                      טלפון ליצירת קשר
                    </label>
                    <div className="relative">
                      <input
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 pr-10"
                      />
                      <Phone
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={18}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase">
                      כתובת מגורים
                    </label>
                    <div className="relative">
                      <input
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 pr-10"
                        placeholder="עיר, רחוב ומספר"
                      />
                      <MapPin
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={18}
                      />
                    </div>
                  </div>

                  {/* Employment Details (Read Only) */}
                  <div className="pt-6 border-t border-slate-100 space-y-4 flex flex-col">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        מידע ארגוני
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        לא ניתן לשינוי, במידת הצורך פני למפקחת
                      </span>
                    </div>
                    <div
                      className={`grid grid-cols-1 ${user.instructor ? "md:grid-cols-3" : "md:grid-cols-2"}  gap-4`}
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl cursor-not-allowed">
                        <p className="text-[10px] font-bold text-slate-400">
                          תעודת זהות
                        </p>
                        <p className="font-black text-slate-400">
                          {user.idNumber}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl cursor-not-allowed">
                        <p className="text-[10px] font-bold text-slate-400">
                          אימייל מערכת
                        </p>
                        <p className="font-black text-slate-400">
                          {user.email}
                        </p>
                      </div>
                      {user.instructor && (
                        <div className="p-4 bg-slate-50 rounded-2xl cursor-not-allowed">
                          <p className="text-[10px] font-bold text-slate-400">
                            מדריכה מלווה
                          </p>
                          <p className="font-black text-slate-400">
                            {user.instructor.firstName}{" "}
                            {user.instructor.lastName}
                          </p>
                        </div>
                      )}
                     
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 mt-6"
                  >
                    {saving ? (
                      "שומר..."
                    ) : (
                      <>
                        <Save size={18} /> שמירת שינויים
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {activeTab === "SECURITY" && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">
                    סיסמה נוכחית
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="h-px bg-slate-100 my-4" />
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">
                    סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">
                    אימות סיסמה חדשה
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2 mt-6"
                >
                  {saving ? "מעדכן..." : "עדכון סיסמה"}
                </button>

                <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Lock className="text-amber-500 shrink-0" size={20} />
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    שימי לב: לאחר שינוי הסיסמה תצטרכי להשתמש בסיסמה החדשה בכל
                    כניסה עתידית למערכת. מומלץ לבחור סיסמה חזקה המשלבת אותיות
                    ומספרים.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
