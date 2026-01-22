"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  subMonths,
  subYears,
  startOfMonth,
  addDays,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { BarChart3, Calendar, User, Info } from "lucide-react";
import EditUserModal from "@/components/EditModals/EditUserModal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import CustomDatePicker from "@/components/ui/CustomDatePicker";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [includeInternal, setIncludeInternal] = useState(false);

  // פילטרים
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeShortcut, setActiveShortcut] = useState<"month" | "year" | null>(
    "month",
  );

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // טעינת משתמשות
  useEffect(() => {
    fetch("/api/supervisor/users-stats")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []));
  }, []);

  // שליפת הנתונים מהשרת
  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        includeInternal: String(includeInternal), // שליחת הפרמטר
        ...(selectedUserId && { userId: selectedUserId }),
      });
      const res = await fetch(`/api/supervisor/stats?${params}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate, selectedUserId, includeInternal]);

  // זיהוי תפקיד המשתמשת הנבחרת
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [selectedUserId, users],
  );

  const isManager = selectedUser?.roles.includes("MANAGER");
  const isSubstitute = selectedUser?.roles.some((r: string) =>
    ["SUBSTITUTE", "ROTATION"].includes(r),
  );

  // פונקציה להגדרת קיצור דרך
  const handleShortcut = (type: "month" | "year") => {
    const end = new Date();
    const start = type === "month" ? subMonths(end, 1) : subYears(end, 1);

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    setActiveShortcut(type);
  };

  const normalize = (d: string) => startOfDay(new Date(d + "T00:00:00"));

  const handleDateChange = (type: "start" | "end", val: string) => {
    setActiveShortcut(null);

    const selectedDate = normalize(val);
    const currentStart = normalize(startDate);
    const currentEnd = normalize(endDate);

    if (type === "start") {
      setStartDate(val);

      if (selectedDate >= currentEnd) {
        alert(
          "שימי לב: תאריך ההתחלה חייב להיות לפני תאריך הסיום, לכן התאריכים שונו בהתאם.",
        );

        const nextDay = format(addDays(selectedDate, 1), "yyyy-MM-dd");
        setEndDate(nextDay);
      }
    } else {
      if (selectedDate <= currentStart) {
        alert(
          "שימי לב: תאריך הסיום חייב להיות לפחות יום אחד אחרי תאריך ההתחלה, לכן התאריכים שונו בהתאם.",
        );

        const forcedDate = format(addDays(currentStart, 1), "yyyy-MM-dd");
        setEndDate(forcedDate);
      } else {
        setEndDate(val);
      }
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto space-y-8 pb-10 animate-in fade-in duration-700"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <BarChart3 size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            מרכז נתונים וסטטיסטיקה
          </h1>
          <p className="text-slate-500 font-medium  ">
            ניתוח פעילות הגנים וצוותי ההוראה
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        {/* טווח תאריכים */}
        <div className="space-y-0">
          <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" /> טווח תאריכים
          </label>
          <div className="space-y-0 grid grid-cols-2 gap-2">
            <CustomDatePicker
              label="תאריך התחלה"
              value={startDate}
              onChange={(val) => handleDateChange("start", val)}
              allowAllDates={true}
            />

            <CustomDatePicker
              label="תאריך סיום"
              value={endDate}
              onChange={(val) => handleDateChange("end", val)}
              allowAllDates={true}
            />
          </div>
        </div>

        {/* בחירת משתמשת */}
        <div className="space-y-3">
          <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
            <User size={16} className="text-indigo-500" /> בחירת גננת / מחליפה
          </label>

          <CustomDropdown
            placeholder="-- כל המשתמשות --"
            label=""
            value={selectedUserId || ""}
            options={users.map((u) => ({
              id: u.id,
              label: `${u.firstName} ${u.lastName} (${
                u.roles.includes("MANAGER") ? "גננת אם" : "צוות מחליף"
              })`,
            }))}
            onChange={(id) => setSelectedUserId(id)}
          />
        </div>

        {/* קיצורים */}
        <div className="flex gap-3 h-[52px]">
          <button
            onClick={() => handleShortcut("month")}
            className={`flex-1 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
              activeShortcut === "month"
                ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            בחודש האחרון
          </button>

          <button
            onClick={() => handleShortcut("year")}
            className={`flex-1 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
              activeShortcut === "year"
                ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
          >
            בשנה האחרונה
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <>
          {/* Toggle Switch */}
          <div className="flex justify-start px-2 mb-4">
            <button
              onClick={() => setIncludeInternal(!includeInternal)}
              className={`group flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 border-2 ${
                includeInternal
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-white border-slate-100 text-slate-500 hover:border-indigo-200"
              }`}
            >
              <div
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  includeInternal ? "bg-indigo-400" : "bg-slate-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${
                    includeInternal ? "-translate-x-6" : "-translate-x-1"
                  }`}
                />
              </div>
              <span className="text-sm font-black uppercase tracking-tight">
                הכלל החלפות של רוטציה וגננת אם
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                סה"כ אירועים בטווח
              </p>
              <h2 className="text-5xl font-black text-slate-800 mt-3">
                {stats.total}
              </h2>
            </div>

            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm">
              <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">
                גנים שאויישו
              </p>
              <h2 className="text-5xl font-black text-emerald-700 mt-3">
                {stats.assigned}
              </h2>
            </div>

            <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 shadow-sm">
              <p className="text-red-600 font-bold text-xs uppercase tracking-widest">
                גנים שנסגרו
              </p>
              <h2 className="text-5xl font-black text-red-700 mt-3">
                {stats.cancelled}
              </h2>
            </div>
          </div>
        </>
      )}
      {isDetailsOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            fetchStats(); // רענון הנתונים בדף אחרי העריכה
          }}
        />
      )}
      {loading && <LoadingScreen />}
      {/* Empty State */}
      {!loading && stats?.total === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
          <Info className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-bold text-lg">
            אין נתונים להצגה בטווח התאריכים הנבחר
          </p>
        </div>
      )}
    </div>
  );
}
