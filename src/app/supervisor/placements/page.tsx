"use client";

import { useEffect, useState } from "react";
import PlacementModal from "@/components/PlacementModal";
import InstructorPlacementsModal from "@/components/InstructorPlacementsModal";
import { highlightText } from "@/lib/utils/formatters";
import AddInstitutionModal from "@/components/AddInstitutionModal";
import AddUserModal from "@/components/AddUserModal.tsx";
import { 
  Search, UserPlus, Building2, Users, ChevronLeft, 
  Sparkles, GraduationCap, MapPin, Plus, UserCheck, LayoutGrid
} from "lucide-react";

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals States
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch("/api/supervisor/placements")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openInstructorModal = (instructor: any) => {
    setActiveInstructor(instructor);
    setIsInstructorModalOpen(true);
  };

  const openAssignModal = (placement: any) => {
    setSelectedPlacement(placement);
    setIsAssignModalOpen(true);
  };

  const filteredData = data.filter((instructor) => {
    const instructorName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return instructorName.includes(searchTerm.toLowerCase()) || hasMatchingGanenet;
  });

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold">טוען נתונים...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700" dir="rtl">
      
      {/* --- Header Section (Style matched with Statistics) --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">ניהול שיבוצים והדרכה</h1>
            <p className="text-slate-500 font-medium italic">ניהול מדריכות, גננות ומוסדות חינוך</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAddTeacherOpen(true)}
            className="flex-1 md:flex-none px-5 py-3 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={18} />
            הוספת גננת/מדריכה
          </button>
          <button
            onClick={() => setIsAddInstitutionOpen(true)}
            className="flex-1 md:flex-none px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            הקמת גן חדש
          </button>
        </div>
      </div>

      {/* --- Search Bar --- */}
      <div className="relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="חיפוש לפי שם מדריכה או גננת אם..."
          className="w-full pr-14 pl-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- Instructors Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((instructor, index) => {
          const teacherCount = instructor.subordinatesIns?.filter((g: any) => g.roles.includes("MANAGER")).length || 0;

          return (
            <div
              key={instructor.id}
              onClick={() => openInstructorModal(instructor)}
              className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    מדריכה
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  {highlightText(`${instructor.firstName} ${instructor.lastName}`, searchTerm)}
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-6">{instructor.email}</p>

                <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                   <Users size={18} className="text-indigo-500" />
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">גננות אם בניהולה</p>
                     <p className="text-lg font-black text-slate-800 leading-none">{teacherCount}</p>
                   </div>
                </div>
              </div>

              <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-50 group-hover:bg-indigo-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">צפייה בפרטים ושיבוץ</span>
                  <ChevronLeft size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Empty State --- */}
      {filteredData.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
          <Search className="mx-auto text-slate-200 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800">לא נמצאו תוצאות</h3>
          <p className="text-slate-400">נסו לשנות את מילות החיפוש</p>
        </div>
      )}

      {/* --- Modals (Keep as they were) --- */}
      <InstructorPlacementsModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructor={activeInstructor}
        searchTerm={searchTerm}
        onAssignClick={(placement) => openAssignModal(placement)}
      />

      {selectedPlacement && (
        <PlacementModal
          isOpen={isAssignModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => { loadData(); setIsAssignModalOpen(false); }}
        />
      )}

      <AddUserModal isOpen={isAddTeacherOpen} onClose={() => setIsAddTeacherOpen(false)} onSuccess={loadData} />
      <AddInstitutionModal isOpen={isAddInstitutionOpen} onClose={() => setIsAddInstitutionOpen(false)} onSuccess={loadData} />
    </div>
  );
}