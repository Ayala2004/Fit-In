// src/app/supervisor/placements/page.tsx
"use client";

import { useEffect, useState } from "react";
import { highlightText } from "@/lib/utils/formatters";
import AddInstitutionModal from "@/components/AddInstitutionModal";
import AddUserModal from "@/components/AddUserModal.tsx";
import AddSubstituteModal from "@/components/AddSubstituteModal";
import InstructorPlacementsModal from "@/components/InstructorPlacementsModal";
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
} from "lucide-react";
import UserDetailsModal from "@/components/UserDetailsModal";

export default function DistrictManagementPage() {
  // 1. States - כולם ברמה העליונה של הקומפוננטה
  const [activeTab, setActiveTab] = useState<"STAFF" | "INSTITUTIONS" | "ALL_USERS">("STAFF");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals States
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddSubstituteOpen, setIsAddSubstituteOpen] = useState(false);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

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
    loadData();
  }, []);

  // 3. משתנים מחושבים (סינון) - מחוץ לפונקציות
  const filteredStaff = (Array.isArray(staffData) ? staffData : []).filter(
    (inst) =>
      `${inst.firstName} ${inst.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.subordinatesIns?.some((g: any) =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const filteredInstitutions = (Array.isArray(institutions) ? institutions : []).filter(
    (inst) =>
      inst.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.institutionNumber?.includes(searchTerm)
  );

  // 4. טיפול במצבי טעינה ושגיאה (UI)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-bold gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p>טוען נתוני מחוז...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 font-bold gap-4">
        <p>אופס! קרתה שגיאה:</p>
        <code className="bg-red-50 p-4 rounded border border-red-200">{error}</code>
        <button onClick={loadData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">נסה שוב</button>
      </div>
    );
  }

  // 5. הרינדור הראשי
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700" dir="rtl">
      {/* Header & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Settings2 size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">מרכז ניהול מחוז</h1>
            <p className="text-slate-500 font-medium italic">ניהול כוח אדם, מוסדות והדרכה</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
          <button onClick={() => setIsAddTeacherOpen(true)} className="p-3 hover:bg-slate-50 rounded-xl text-indigo-600" title="הוספת צוות ניהול">
            <UserPlus size={22} />
          </button>
          <button onClick={() => setIsAddSubstituteOpen(true)} className="p-3 hover:bg-slate-50 rounded-xl text-emerald-600" title="הוספת צוות מחליף">
            <SparklesIcon size={22} />
          </button>
          <button onClick={() => setIsAddInstitutionOpen(true)} className="p-3 hover:bg-slate-50 rounded-xl text-pink-600" title="הקמת גן חדש">
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 p-1.5 bg-slate-100 rounded-3xl w-full max-w-md">
        <button
          onClick={() => setActiveTab("STAFF")}
          className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === "STAFF" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          צוות הדרכה
        </button>
        <button
          onClick={() => { setActiveTab("ALL_USERS"); loadAllUsers(); }}
          className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === "ALL_USERS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
        >
         ניהול כח אדם
        </button>
        <button
          onClick={() => setActiveTab("INSTITUTIONS")}
          className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === "INSTITUTIONS" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          מוסדות
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
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
          {filteredStaff.map((instructor) => (
            <div key={instructor.id} onClick={() => setActiveInstructor(instructor)} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col">
              <div className="p-8 pb-4">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg inline-block mb-4">מדריכה</div>
                <h3 className="text-xl font-black text-slate-800">{instructor.firstName} {instructor.lastName}</h3>
                <p className="text-slate-400 text-sm mb-6">{instructor.email}</p>
                <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 w-full font-bold text-slate-700">
                  <Users size={18} className="text-indigo-500" /> {instructor.subordinatesIns?.length || 0} גננות אם
                </div>
              </div>
              <div className="mt-auto p-6 bg-slate-50/50 border-t flex justify-between items-center text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                <span>צפייה בפרטים ושיבוץ</span>
                <ChevronLeft size={18} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALL USERS TAB */}
      {activeTab === "ALL_USERS" && (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-400">
              <tr>
                <th className="p-4">שם מלא</th>
                <th className="p-4">תפקיד</th>
                <th className="p-4">ת.ז</th>
                <th className="p-4">טלפון</th>
                <th className="p-4">סטטוס</th>
                <th className="p-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allUsers.filter(u => `${u.firstName} ${u.lastName}`.includes(searchTerm) || u.idNumber.includes(searchTerm)).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{u.firstName} {u.lastName}</td>
                  <td className="p-4 flex gap-1">
                    {u.roles.map((r: any) => (
                      <span key={r} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-500">
                        {r === "MANAGER" ? "אם" : r === "SUBSTITUTE" ? "מחליפה" : r === "INSTRUCTOR" ? "מדריכה" : "רוטציה"}
                      </span>
                    ))}
                  </td>
                  <td className="p-4 text-sm font-mono text-slate-600">{u.idNumber}</td>
                  <td className="p-4 text-sm text-slate-600">{u.phoneNumber}</td>
                  <td className="p-4">
                    <span className={`w-2 h-2 rounded-full inline-block ${u.isWorking ? "bg-emerald-500" : "bg-red-500"}`} />
                  </td>
                  <td className="p-4">
                    <button onClick={() => setSelectedUserForEdit(u)} className="text-indigo-600 font-bold text-xs hover:underline">עריכה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INSTITUTIONS TAB */}
      {activeTab === "INSTITUTIONS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstitutions.map((inst) => (
            <div key={inst.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col hover:shadow-lg transition-all relative group">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><Building2 size={24} /></div>
              <h3 className="text-xl font-black text-slate-800 mb-1">{inst.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase mb-6">סמל: {inst.institutionNumber}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium"><MapPin size={14} className="text-indigo-500" /> {inst.address}</div>
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium"><Users size={14} className="text-indigo-500" /> גננת: {inst.mainManager?.firstName} {inst.mainManager?.lastName}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeInstructor && (
        <InstructorPlacementsModal isOpen={!!activeInstructor} onClose={() => setActiveInstructor(null)} instructor={activeInstructor} searchTerm={searchTerm} onAssignClick={(p) => setSelectedPlacement(p)} />
      )}
      {selectedUserForEdit && (
        <UserDetailsModal isOpen={!!selectedUserForEdit} user={selectedUserForEdit} onClose={() => setSelectedUserForEdit(null)} onUpdateSuccess={() => { loadAllUsers(); loadData(); }} />
      )}
      <AddUserModal isOpen={isAddTeacherOpen} onClose={() => setIsAddTeacherOpen(false)} onSuccess={loadData} />
      <AddSubstituteModal isOpen={isAddSubstituteOpen} onClose={() => setIsAddSubstituteOpen(false)} onSuccess={loadData} />
      <AddInstitutionModal isOpen={isAddInstitutionOpen} onClose={() => setIsAddInstitutionOpen(false)} onSuccess={loadData} />
    </div>
  );
}