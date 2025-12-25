"use client";

import { useEffect, useState } from "react";
import PlacementModal from "@/components/PlacementModal";
import InstructorPlacementsModal from "@/components/InstructorPlacementsModal";
import { highlightText } from "@/lib/utils/formatters";
import AddUserModal from "@/components/AddUserModal.tsx";
import AddInstitutionModal from "@/components/AddInstitutionModal";

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // מודאל 1: רשימת הגננות של מדריכה
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [activeInstructor, setActiveInstructor] = useState<any>(null);

  // מודאל 2: שיבוץ מחליפה
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

  // מודאל 3: הוספת גננת אם חדשה
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  const [isAddInstitutionOpen, setIsAddInstitutionOpen] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch("/api/supervisor/placements")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openInstructorModal = (instructor: any) => {
    setActiveInstructor(instructor);
    setIsInstructorModalOpen(true);
  };

  const openAssignModal = (placement: any) => {
    setSelectedPlacement(placement);
    setIsAssignModalOpen(true);
  };

  if (loading)
    return <div className="p-10 text-center font-bold">טוען נתונים...</div>;

  const filteredData = data.filter((instructor) => {
    const instructorName =
      `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
      `${g.firstName} ${g.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    return (
      instructorName.includes(searchTerm.toLowerCase()) || hasMatchingGanenet
    );
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-black" dir="rtl">
      {/* כותרת וחיפוש */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-blue-900 italic">
          ניהול שיבוצים והדרכה
        </h1>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="חיפוש מדריכה או גננת..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* כותרת רשימת מדריכות + כפתור הוספה */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-700">רשימת מדריכות</h2>
        <button
          onClick={() => setIsAddTeacherOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md"
        >
          <span className="text-xl">+</span>
          הוספת גננת אם חדשה
        </button>
      </div>

      {/* גריד המדריכות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((instructor: any) => (
          <div
            key={instructor.id}
            onClick={() => openInstructorModal(instructor)}
            className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer overflow-hidden group"
          >
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center group-hover:bg-blue-700 transition-colors">
              <div>
                <h2 className="text-xl font-bold">
                  {highlightText(
                    `${instructor.firstName} ${instructor.lastName}`,
                    searchTerm
                  )}
                </h2>
                <p className="text-xs opacity-80 mt-1">
                  {instructor.subordinatesIns?.filter((g: any) =>
                    g.roles.includes("MANAGER")
                  ).length || 0}{" "}
                  גננות אם שתחתיה
                </p>
              </div>
              <div className="bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                <span className="text-xs font-bold">צפייה ←</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 text-slate-500 text-xs flex justify-between items-center">
              <span>ניהול גנים ושיבוצים</span>
              <span className="text-blue-600 font-bold">לחצי לפירוט</span>
            </div>
          </div>
        ))}
      </div>

      {/* מודאל: רשימת גננות אם */}
      <InstructorPlacementsModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructor={activeInstructor}
        searchTerm={searchTerm}
        onAssignClick={(placement) => openAssignModal(placement)}
      />

      {/* מודאל: שיבוץ מחליפה */}
      {selectedPlacement && (
        <PlacementModal
          isOpen={isAssignModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            loadData();
            setIsAssignModalOpen(false);
          }}
        />
      )}

      {/* מודאל: הוספת משתמש */}
      <AddUserModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onSuccess={() => {
          loadData();
          alert("הגננת נוספה בהצלחה!");
        }}
      />
      <button
        onClick={() => setIsAddInstitutionOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md"
      >
        + הוספת גן חדש
      </button>

      {/* המודאל */}
      <AddInstitutionModal
        isOpen={isAddInstitutionOpen}
        onClose={() => setIsAddInstitutionOpen(false)}
        onSuccess={() => {
          loadData();
          alert("הגן הוקם בהצלחה!");
        }}
      />
    </div>
  );
}
