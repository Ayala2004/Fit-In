"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { highlightText } from "@/lib/utils/formatters";
import InstructorPlacementsModal from "@/components/InstructorCardModal";
import {
  Search,
  UserPlus,
  Building2,
  Users,
  ChevronLeft,
  Plus,
  MapPin,
  Edit3,
  Settings2,
  PlusCircle,
} from "lucide-react";
import EditUserModal from "@/components/EditModals/EditUserModal";
import EditInstitutionModal from "@/components/EditModals/EditInstitutionModal";
import ReassignTeachersModal from "@/components/ReassignTeachersModal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import AddUserModal from "@/components/AddModals/AddUserModal.tsx";
import AddSubstituteModal from "@/components/AddModals/AddSubstituteModal";
import AddInstitutionModal from "@/components/AddModals/AddInstitutionModal";

export default function DistrictManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "STAFF" | "INSTITUTIONS" | "ALL_USERS"
  >("ALL_USERS");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // --- הגדרת SWR לסנכרון נתונים בזמן אמת ---
  const {
    data: allUsers = [],
    mutate: mutateUsers,
    isLoading: loadingUsers,
  } = useSWR("/api/supervisor/users-stats", fetcher, { refreshInterval: 5000 });
  const { data: staffData = [], mutate: mutateStaff } = useSWR(
    "/api/supervisor/placements",
    fetcher,
    { refreshInterval: 5000 },
  );
  const { data: institutions = [], mutate: mutateInst } = useSWR(
    "/api/supervisor/institutions",
    fetcher,
    { refreshInterval: 5000 },
  );

  // Modals States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [selectedInstitutionForEdit, setSelectedInstitutionForEdit] =
    useState<any>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddSubstituteOpen, setIsAddSubstituteOpen] = useState(false);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [orphanedTeachers, setOrphanedTeachers] = useState<any[]>([]);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);

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

  // פונקציה שקוראת לכל ה-mutates (לשימוש אחרי הוספה/עריכה)
  const refreshAllData = () => {
    mutateUsers();
    mutateStaff();
    mutateInst();
  };

  // בדיקת יתומות וטעינת רשימת מדריכות למודאלים (קורה פעם אחת)
  useEffect(() => {
    fetch("/api/supervisor/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.orphanedManagers?.length > 0) {
          setOrphanedTeachers(data.orphanedManagers);
          setShowReassignModal(true);
        }
      });
    fetch("/api/supervisor/instructors")
      .then((res) => res.json())
      .then((data) => setInstructorsList(data));
  }, []);

  const ROLE_PRIORITY: Record<string, number> = {
    INSTRUCTOR: 1,
    MANAGER: 2,
    ROTATION: 3,
    SUBSTITUTE: 4,
  };

  // --- לוגיקת סינון ומיון משתמשים ---
  const filteredAndSortedUsers = useMemo(() => {
    return allUsers
      .filter((u: any) => {
        const roles = u.roles ?? [];
        const fullName =
          `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();

        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          (u.idNumber || "").includes(searchTerm);

        const matchesRole =
          selectedRoleFilter === "ALL"
            ? true
            : selectedRoleFilter === "NO_ROTATION"
              ? roles.includes("MANAGER") &&
                (!u.fixedRotationsAsManager ||
                  u.fixedRotationsAsManager.length === 0)
              : roles.includes(selectedRoleFilter);

        return matchesSearch && matchesRole;
      })
      .sort((a: any, b: any) => {
        if (a.isWorking !== b.isWorking) {
          return a.isWorking ? -1 : 1;
        }
        const aRoles = a.roles ?? [];
        const bRoles = b.roles ?? [];

        // עדיפות לפי תפקיד
        const aPriority = Math.min(
          ...aRoles.map((r: string) => ROLE_PRIORITY[r] ?? 99),
        );
        const bPriority = Math.min(
          ...bRoles.map((r: string) => ROLE_PRIORITY[r] ?? 99),
        );

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // אם אותו תפקיד – מיון אלפביתי
        return (a.firstName || "").localeCompare(b.firstName || "", "he");
      });
  }, [allUsers, searchTerm, selectedRoleFilter]);

  // --- לוגיקת סינון מוסדות ---
  const filteredInstitutions = useMemo(() => {
    return institutions.filter(
      (inst: any) =>
        inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.institutionNumber?.includes(searchTerm),
    );
  }, [institutions, searchTerm]);

  // --- לוגיקת סינון ומיון מדריכות ---
  const sortedInstructors = useMemo(() => {
    const filtered = staffData.filter((inst: any) =>
      `${inst.firstName} ${inst.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
    return [...filtered].sort((a: any, b: any) =>
      a.isWorking === b.isWorking ? 0 : a.isWorking ? -1 : 1,
    );
  }, [staffData, searchTerm]);

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

  // פונקציה להחלפת טאב (תואם למבנה המקורי)
  const switchTab = (tab: any) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  if (loadingUsers && allUsers.length === 0)
    return <LoadingScreen message="טוען נתוני מחוז..." />;

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
            <p className="text-slate-500 font-medium  ">
              ניהול כוח אדם, מוסדות והדרכה
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
          {/* הוספת צוות ניהול */}
          <span className="relative group">
            <button
              onClick={() => setIsAddTeacherOpen(true)}
              className="p-3 hover:bg-slate-50 rounded-xl text-indigo-600"
            >
              <UserPlus size={22} />
            </button>
            <span className="tooltip-add-models text-indigo-600">
              הוספת צוות ניהול
            </span>
          </span>

          {/* הוספת צוות מחליף */}
          <span className="relative group">
            <button
              onClick={() => setIsAddSubstituteOpen(true)}
              className="p-3 hover:bg-slate-50 rounded-xl text-emerald-600"
            >
              <PlusCircle size={22} />
            </button>
            <span className="tooltip-add-models text-emerald-600">
              הוספת צוות מחליף
            </span>
          </span>

          {/* הקמת גן חדש */}
          <span className="relative group">
            <button
              onClick={() => setIsAddInstitutionOpen(true)}
              className="p-3 hover:bg-slate-50 rounded-xl text-pink-600"
            >
              <Plus size={22} />
            </button>
            <span className="tooltip-add-models text-pink-600">
              הקמת גן חדש
            </span>
          </span>
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
                      (u: any) =>
                        u.roles.includes("MANAGER") &&
                        (!u.fixedRotationsAsManager ||
                          u.fixedRotationsAsManager.length === 0),
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
                    <th className="p-5 hidden md:table-cell">ת.ז</th>
                    <th className="p-5">טלפון</th>
                    <th className="p-5 hidden md:table-cell">ימי חופש</th>
                    <th className="p-5 hidden md:table-cell">מדריכה</th>
                    <th className="p-5 hidden md:table-cell">גננת רוטציה</th>
                    <th className="p-5">סטטוס</th>
                    <th className="p-5 text-center">עריכה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedUsers.length > 0 ? (
                    filteredAndSortedUsers.map((u: any) => {
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
                              searchTerm,
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
                          <td className="p-5 text-sm font-mono text-slate-500 hidden md:table-cell">
                            {u.idNumber}
                          </td>
                          <td
                            className="p-5 text-sm text-slate-600 font-medium"
                            dir="ltr"
                          >
                            {u.phoneNumber}
                          </td>
                          <td className="p-5 hidden md:table-cell">
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
                                <span className="text-[10px] text-slate-300 font-bold  ">
                                  ללא
                                </span>
                              )}
                            </div>
                          </td>

                          {/* עמודה חדשה: מדריכה מלווה (רק לגננות אם) */}
                          <td className="p-5 text-sm hidden md:table-cell">
                            {u.roles.includes("MANAGER") ? (
                              u.instructor ? (
                                <span className="text-slate-700 font-medium">
                                  {u.instructor.firstName}{" "}
                                  {u.instructor.lastName}
                                </span>
                              ) : (
                                <span className="text-amber-500 font-bold text-xs  ">
                                  לא שויכה
                                </span>
                              )
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          <td className="p-5 text-sm hidden md:table-cell">
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
                                          }`.trim(),
                                        )
                                        .filter(Boolean),
                                    ),
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
                                <span className="text-red-400 font-bold  ">
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
                        className="p-20 text-center text-slate-400   font-medium"
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
          {filteredInstitutions.map((inst: any) => (
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
                        ),
                      )
                    ) : (
                      <p className="text-[11px] text-slate-400  ">
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
          onUpdateSuccess={refreshAllData}
        />
      )}
      <AddUserModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onSuccess={refreshAllData}
      />
      <AddSubstituteModal
        isOpen={isAddSubstituteOpen}
        onClose={() => setIsAddSubstituteOpen(false)}
        onSuccess={refreshAllData}
      />
      <AddInstitutionModal
        isOpen={isAddInstitutionOpen}
        onClose={() => setIsAddInstitutionOpen(false)}
        onSuccess={refreshAllData}
      />
      {selectedInstitutionForEdit && (
        <EditInstitutionModal
          isOpen={!!selectedInstitutionForEdit}
          institution={selectedInstitutionForEdit}
          onClose={() => setSelectedInstitutionForEdit(null)}
          onSuccess={refreshAllData}
        />
      )}
      {showReassignModal && (
        <ReassignTeachersModal
          isOpen={showReassignModal}
          teachers={orphanedTeachers}
          instructors={instructorsList}
          isForced={true}
          onClose={() => setShowReassignModal(false)}
          onComplete={() => {
            setShowReassignModal(false);
            refreshAllData();
          }}
        />
      )}
    </div>
  );
}
