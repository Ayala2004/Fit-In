// src/app/supervisor/placements/page.tsx
"use client";

import { useEffect, useState } from "react";
import { highlightText } from "@/lib/utils/formatters";
import AddInstitutionModal from "@/components/AddInstitutionModal";
import AddUserModal from "@/components/AddUserModal.tsx";
import AddSubstituteModal from "@/components/AddSubstituteModal";
import InstructorPlacementsModal from "@/components/InstructorCardModal";
import PlacementModal from "@/components/PlacementModal";
import {
  Search,
  UserPlus,
  Building2,
  Users,
  ChevronLeft,
  SparklesIcon,
  Plus,
  MapPin,
  Edit3,
  Settings2,
  Loader2,
  User2Icon,
  PlusCircle,
  Power,
} from "lucide-react";
import EditUserModal from "@/components/EditUserModal";
import EditInstitutionModal from "@/components/EditInstitutionModal";
import ReassignTeachersModal from "@/components/ReassignTeachersModal";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function DistrictManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "STAFF" | "INSTITUTIONS" | "ALL_USERS"
  >("ALL_USERS");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [selectedInstitutionForEdit, setSelectedInstitutionForEdit] =
    useState<any>(null);

  // Modals States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddSubstituteOpen, setIsAddSubstituteOpen] = useState(false);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [orphanedTeachers, setOrphanedTeachers] = useState<any[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]); // לצורך בחירה במודאל
  const [isTabLoading, setIsTabLoading] = useState(false);

  const dayTranslations: Record<string, string> = {
    SUNDAY: "א'",
    MONDAY: "ב'",
    TUESDAY: "ג'",
    WEDNESDAY: "ד'",
    THURSDAY: "ה'",
    FRIDAY: "ו'",
  };
  const allWeekDays = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];
  // 2. פונקציות טעינה
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, instRes] = await Promise.all([
        fetch("/api/supervisor/placements"),
        fetch("/api/supervisor/institutions"),
      ]);

      if (!staffRes.ok || !instRes.ok) {
        throw new Error("שגיאה במשיכת נתונים מהשרת");
      }

      const staffJson = await staffRes.json();
      const instJson = await instRes.json();

      setStaffData(Array.isArray(staffJson) ? staffJson : []);
      setInstitutions(Array.isArray(instJson) ? instJson : []);
    } catch (err: any) {
      console.error("Load Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch("/api/supervisor/users-stats");
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setAllUsers([]);
    }
  };

  // טעינה ראשונית
  useEffect(() => {
    const initFetch = async () => {
      await loadData(); // טוען מוסדות ומדריכות

      // אם הטאב הנוכחי הוא ALL_USERS, נטען גם את כל המשתמשים
      if (activeTab === "ALL_USERS") {
        await loadAllUsers();
      }
    };

    initFetch();
  }, []);

  useEffect(() => {
    const checkOrphans = async () => {
      try {
        const res = await fetch("/api/supervisor/dashboard");
        const data = await res.json();
        if (data.orphanedManagers?.length > 0) {
          setOrphanedTeachers(data.orphanedManagers);
          setShowReassignModal(true);
        }
      } catch (err) {
        console.error("Failed to check for orphaned managers", err);
      }
    };
    checkOrphans();
  }, []);
  // טעינת מדריכות בטעינה ראשונית כדי שיהיו זמינות למודאל
  useEffect(() => {
    fetch("/api/supervisor/instructors")
      .then((res) => res.json())
      .then((data) => setInstructorsList(data));
  }, []);

  const switchTab = async (tab: "STAFF" | "ALL_USERS" | "INSTITUTIONS") => {
    setIsTabLoading(true);
    setActiveTab(tab);
    setSearchTerm("");

    if (tab === "ALL_USERS") {
      await loadAllUsers();
    }

    // אם בעתיד יש עוד טאבים עם טעינה — כאן
    setIsTabLoading(false);
  };

  const filteredAndSortedUsers = allUsers
    .filter((u) => {
      // הגנה: וודאי שהשדות קיימים לפני ביצוע toLowerCase
      const firstName = u.firstName || "";
      const lastName = u.lastName || "";
      const idNumber = u.idNumber || "";
      const roles = u.roles || [];

      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        idNumber.includes(searchTerm);

      let matchesRole = false;

      if (selectedRoleFilter === "ALL") {
        matchesRole = true;
      } else if (selectedRoleFilter === "NO_ROTATION") {
        // גננת אם שאין לה אף רוטציה רשומה
        matchesRole =
          u.roles.includes("MANAGER") &&
          (!u.fixedRotationsAsManager ||
            u.fixedRotationsAsManager.length === 0);
      } else {
        matchesRole = u.roles.includes(selectedRoleFilter);
      }

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      // אם נבחר "הכל", נקבץ לפי תפקיד לפי סדר חשיבות
      if (selectedRoleFilter === "ALL") {
        const rolePriority: any = {
          INSTRUCTOR: 1,
          MANAGER: 2,
          ROTATION: 3,
          SUBSTITUTE: 4,
        };
        // לוקחים את התפקיד הראשון של כל משתמשת לצורך המיון
        const priorityA = rolePriority[a.roles[0]] || 5;
        const priorityB = rolePriority[b.roles[0]] || 5;

        if (priorityA !== priorityB) return priorityA - priorityB;
      }
      // בתוך אותו תפקיד (או אם מסונן), מיין לפי שם פרטי
      return a.firstName.localeCompare(b.firstName, "he");
    });

  const roleFilters = [
    { id: "ALL", label: "כל הצוות", color: "bg-slate-100 text-slate-600" },
    {
      id: "INSTRUCTOR",
      label: "מדריכות",
      color: "bg-purple-100 text-purple-600",
    },
    { id: "MANAGER", label: "גננות אם", color: "bg-pink-50 text-pink-400" },
    {
      id: "NO_ROTATION",
      label: "גננות ללא רוטציה ⚠️",
      color: "bg-red-50 text-red-600 border-red-200",
    },
    {
      id: "ROTATION",
      label: "גננות רוטציה",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "SUBSTITUTE",
      label: "גננות מחליפות",
      color: "bg-sky-100 text-sky-600",
    },
  ];

  // 3. משתנים מחושבים (סינון) - מחוץ לפונקציות
  const filteredStaff = (Array.isArray(staffData) ? staffData : []).filter(
    (inst) =>
      `${inst.firstName} ${inst.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      inst.subordinatesIns?.some((g: any) =>
        `${g.firstName} ${g.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  const sortedInstructors = [...filteredStaff].sort((a, b) => {
    if (a.isWorking === b.isWorking) return 0;
    return a.isWorking ? -1 : 1;
  });

  const filteredInstitutions = (
    Array.isArray(institutions) ? institutions : []
  ).filter(
    (inst) =>
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.institutionNumber?.includes(searchTerm)
  );

  // 4. טיפול במצבי טעינה ושגיאה (UI)
  if (loading) {
    return <LoadingScreen message="טוען נתוני מחוז" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 font-bold gap-4">
        <p>אופס! קרתה שגיאה:</p>
        <code className="bg-red-50 p-4 rounded border border-red-200">
          {error}
        </code>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // 5. הרינדור הראשי
  return (
    <div
      className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700"
      dir="rtl"
    >
      {/* Header & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Settings2 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              מרכז ניהול מחוז
            </h1>
            <p className="text-slate-500 font-medium italic">
              ניהול כוח אדם, מוסדות והדרכה
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
          <button
            onClick={() => setIsAddTeacherOpen(true)}
            className="p-3 hover:bg-slate-50 rounded-xl text-indigo-600"
            title="הוספת צוות ניהול"
          >
            <UserPlus size={22} />
          </button>
          <button
            onClick={() => setIsAddSubstituteOpen(true)}
            className="p-3 hover:bg-slate-50 rounded-xl text-emerald-600"
            title="הוספת צוות מחליף"
          >
            <PlusCircle size={22} />
          </button>
          <button
            onClick={() => setIsAddInstitutionOpen(true)}
            className="p-3 hover:bg-slate-50 rounded-xl text-pink-600"
            title="הקמת גן חדש"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 p-1.5 bg-slate-100 rounded-3xl w-full max-w-md">
        <button
          onClick={() => switchTab("ALL_USERS")}
          className={`tab-buttons ${
            activeTab === "ALL_USERS"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ניהול כח אדם
        </button>
        <button
          onClick={() => switchTab("INSTITUTIONS")}
          className={`tab-buttons  ${
            activeTab === "INSTITUTIONS"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          מוסדות
        </button>
        <button
          onClick={() => switchTab("STAFF")}
          className={`tab-buttons  ${
            activeTab === "STAFF"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          צוות הדרכה
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search
          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="חיפוש..."
          className="input-standard pr-14 py-4 rounded-[2rem]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* STAFF TAB */}
      {activeTab === "STAFF" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedInstructors.map((instructor) => (
            <div
              key={instructor.id}
              onClick={() => setActiveInstructor(instructor)}
              className={`group rounded-[2rem] border transition-all overflow-hidden flex flex-col ${
                instructor.isWorking
                  ? "bg-white border-slate-100 hover:shadow-xl shadow-sm cursor-pointer "
                  : "bg-red-50/50 border-red-100 opacity-90 cursor-not-allowed" // צבע אדום בהיר ללא פעילות
              }`}
            >
              <div className="p-8 pb-4">
                <div className="flex justify-between items-start">
                  <div
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg inline-block mb-4 ${
                      instructor.isWorking
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {instructor.isWorking ? "מדריכה" : "מדריכה - לא פעילה"}
                  </div>
                </div>

                <h3
                  className={`text-xl font-black ${
                    instructor.isWorking ? "text-slate-800" : "text-red-900"
                  }`}
                >
                  {instructor.firstName} {instructor.lastName}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  {instructor.email}
                </p>

                <div
                  className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border w-full font-bold ${
                    instructor.isWorking
                      ? "bg-slate-50 border-slate-100 text-slate-700"
                      : "bg-red-100/50 border-red-200 text-red-800"
                  }`}
                >
                  <Users
                    size={18}
                    className={
                      instructor.isWorking ? "text-indigo-500" : "text-red-500"
                    }
                  />{" "}
                  {instructor.subordinatesIns?.length || 0} גננות אם
                </div>
              </div>

              <div
                className={`mt-auto p-6 border-t flex justify-between items-center text-sm font-bold transition-colors ${
                  instructor.isWorking
                    ? "bg-slate-50/50 text-slate-500 group-hover:text-indigo-600"
                    : "bg-red-100/30 text-red-500"
                }`}
              >
                <span>
                  {instructor.isWorking
                    ? "צפייה בגננות האם המשויכות"
                    : "מדריכה מושבתת"}
                </span>
                <ChevronLeft size={18} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALL USERS TAB */}
      {activeTab === "ALL_USERS" && (
        <div className="space-y-4">
          {/* כפתורי סינון תפקידים */}
          <div className="flex flex-wrap gap-2 mb-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs font-black text-slate-400 w-full mb-1 mr-2">
              סנני לפי תפקיד:
            </span>
            {roleFilters.map((filter) => {
              // חישוב כמות במידה וזה הפילטר של "ללא רוטציה"
              const count =
                filter.id === "NO_ROTATION"
                  ? allUsers.filter(
                      (u) =>
                        u.roles.includes("MANAGER") &&
                        (!u.fixedRotationsAsManager ||
                          u.fixedRotationsAsManager.length === 0)
                    ).length
                  : null;

              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedRoleFilter(filter.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    selectedRoleFilter === filter.id
                      ? `${filter.color} ring-2 ring-offset-1 ring-current`
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {filter.label}
                  {count !== null && count > 0 && (
                    <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* הטבלה */}
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="p-5">שם מלא</th>
                    <th className="p-5">תפקיד</th>
                    <th className="p-5">ת.ז</th>
                    <th className="p-5">טלפון</th>
                    <th className="p-5">ימי חופש</th>
                    <th className="p-5">מדריכה</th>
                    <th className="p-5">גננת רוטציה</th>
                    <th className="p-5">סטטוס</th>
                    <th className="p-5 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isTabLoading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <LoadingScreen />
                      </td>
                    </tr>
                  ) : filteredAndSortedUsers.length > 0 ? (
                    filteredAndSortedUsers.map((u) => {
                      const userWorkDays = u.workDays || [];
                      const freeDays = allWeekDays
                        .filter((d) => !userWorkDays.includes(d))
                        .map((d) => dayTranslations[d]);
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="p-5 font-bold text-slate-700">
                            {highlightText(
                              `${u.firstName} ${u.lastName}`,
                              searchTerm
                            )}
                          </td>
                          <td className="p-5">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r: any) => (
                                <span
                                  key={r}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                                    r === "MANAGER"
                                      ? "bg-pink-50 text-pink-400"
                                      : r === "INSTRUCTOR"
                                      ? "bg-purple-100 text-purple-600"
                                      : r === "ROTATION"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-sky-100 text-sky-600"
                                  }`}
                                >
                                  {r === "MANAGER"
                                    ? "גננת אם"
                                    : r === "SUBSTITUTE"
                                    ? "מחליפה"
                                    : r === "INSTRUCTOR"
                                    ? "מדריכה"
                                    : "רוטציה"}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-5 text-sm font-mono text-slate-500">
                            {u.idNumber}
                          </td>
                          <td
                            className="p-5 text-sm text-slate-600 font-medium"
                            dir="ltr"
                          >
                            {u.phoneNumber}
                          </td>
                          <td className="p-5">
                            <div className="flex gap-1">
                              {freeDays.length > 0 ? (
                                freeDays.map((d, i) => (
                                  <span
                                    key={i}
                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 rounded-md text-[10px] font-black border border-slate-200"
                                  >
                                    {d}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-300 font-bold italic">
                                  ללא
                                </span>
                              )}
                            </div>
                          </td>

                          {/* עמודה חדשה: מדריכה מלווה (רק לגננות אם) */}
                          <td className="p-5 text-sm">
                            {u.roles.includes("MANAGER") ? (
                              u.instructor ? (
                                <span className="text-slate-700 font-medium">
                                  {u.instructor.firstName}{" "}
                                  {u.instructor.lastName}
                                </span>
                              ) : (
                                <span className="text-amber-500 font-bold text-xs italic">
                                  לא שויכה
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="p-5 text-sm">
                            {u.roles.includes("MANAGER") ? (
                              u.fixedRotationsAsManager &&
                              u.fixedRotationsAsManager.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {/* מקבצים את שמות גננות הרוטציה (אם יש כמה בימים שונים) */}
                                  {Array.from(
                                    new Set<string>(
                                      u.fixedRotationsAsManager
                                        .map((r: any) =>
                                          `${
                                            r.rotationTeacher?.firstName ?? ""
                                          } ${
                                            r.rotationTeacher?.lastName ?? ""
                                          }`.trim()
                                        )
                                        .filter(Boolean)
                                    )
                                  ).map((name, idx) => (
                                    <span
                                      key={idx}
                                      className="text-indigo-600 font-bold"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-red-400 font-bold italic">
                                  אין רוטציה
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">-</span> // אם זו לא גננת אם
                            )}
                          </td>

                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  u.isWorking
                                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    : "bg-red-500"
                                }`}
                              />
                              <span className="text-[10px] font-bold text-slate-400">
                                {u.isWorking ? "פעילה" : "לא פעילה"}
                              </span>
                            </div>
                          </td>
                          <td className="p-5 text-center">
                            <button
                              onClick={() => setSelectedUserForEdit(u)}
                              className="p-2 bg-indigo-50 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              title="עריכת פרטים"
                            >
                              <Edit3 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-20 text-center text-slate-400 italic font-medium"
                      >
                        לא נמצאו משתמשות התואמות לסינון הנבחר
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSTITUTIONS TAB */}
      {activeTab === "INSTITUTIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstitutions.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8 flex flex-col hover:shadow-lg transition-all relative group"
            >
              <button
                onClick={() => setSelectedInstitutionForEdit(inst)}
                className="absolute top-6 left-6 opacity-100 p-2 bg-indigo-50 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                <Edit3 size={18} />
              </button>

              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Building2 size={24} />
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-1">
                {inst.name}
              </h3>

              <p className="text-slate-400 text-xs font-bold uppercase mb-6">
                סמל מוסד: {inst.institutionNumber}
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                    <MapPin size={14} className="text-indigo-500" />{" "}
                    {inst.address}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                    <Users size={14} className="text-indigo-500" /> גננת אם:{" "}
                    <span className="font-bold">
                      {inst.mainManager?.firstName} {inst.mainManager?.lastName}
                    </span>
                  </div>
                </div>

                {/* --- הצגת גננות רוטציה קבועות --- */}
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    צוות משלים קבוע (רוטציה):
                  </p>
                  <div className="space-y-2">
                    {inst.mainManager?.fixedRotationsAsManager?.length > 0 ? (
                      inst.mainManager.fixedRotationsAsManager.map(
                        (rot: any) => (
                          <div
                            key={rot.id}
                            className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100/50"
                          >
                            <span className="w-fit h-fit p-2 flex items-center justify-center text-[13px] font-black text-indigo-600 ">
                              ביום: {dayTranslations[rot.day]}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {rot.rotationTeacher?.firstName}{" "}
                              {rot.rotationTeacher?.lastName}
                            </span>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        טרם הוגדרה רוטציה קבועה
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeInstructor && (
        <InstructorPlacementsModal
          isOpen={!!activeInstructor}
          onClose={() => setActiveInstructor(null)}
          instructor={activeInstructor}
          searchTerm={searchTerm}
          onAssignClick={(p) => setSelectedPlacement(p)}
        />
      )}
      {selectedUserForEdit && (
        <EditUserModal
          isOpen={!!selectedUserForEdit}
          user={selectedUserForEdit}
          onClose={() => setSelectedUserForEdit(null)}
          onUpdateSuccess={() => {
            loadAllUsers();
            loadData();
          }}
        />
      )}
      <AddUserModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onSuccess={loadData}
      />
      <AddSubstituteModal
        isOpen={isAddSubstituteOpen}
        onClose={() => setIsAddSubstituteOpen(false)}
        onSuccess={loadData}
      />
      <AddInstitutionModal
        isOpen={isAddInstitutionOpen}
        onClose={() => setIsAddInstitutionOpen(false)}
        onSuccess={loadData}
      />
      {selectedInstitutionForEdit && (
        <EditInstitutionModal
          isOpen={!!selectedInstitutionForEdit}
          institution={selectedInstitutionForEdit}
          onClose={() => setSelectedInstitutionForEdit(null)}
          onSuccess={loadData}
        />
      )}
      {showReassignModal && (
        <ReassignTeachersModal
          isOpen={showReassignModal}
          teachers={orphanedTeachers}
          instructors={instructorsList}
          isForced={true} // גורם להשתלטות על המסך
          onClose={() => setShowReassignModal(false)}
          onComplete={(remaining?: any) => {
            if (remaining && remaining.length > 0) {
              setOrphanedTeachers(remaining);
            } else {
              setShowReassignModal(false);
              loadData(); // רענון הנתונים הכללי בדף
            }
          }}
        />
      )}
    </div>
  );
}
