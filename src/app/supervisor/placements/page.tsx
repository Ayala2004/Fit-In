"use client";

import { useEffect, useState } from "react";
import PlacementModal from "@/components/PlacementModal";
import InstructorPlacementsModal from "@/components/InstructorPlacementsModal";
import { highlightText } from "@/lib/utils/formatters";
import AddInstitutionModal from "@/components/AddInstitutionModal";
import { isRegistrationOpen } from "@/utils/dateHelpers";
import AddUserModal from "@/components/AddUserModal.tsx";

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

  // מודאל 4: הוספת מוסד
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-transparent mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">טוען נתונים...</p>
        </div>
      </div>
    );

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
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                ניהול שיבוצים והדרכה
              </h1>
              <p className="text-gray-600">מערכת ניהול מדריכות וגננות</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setIsAddTeacherOpen(true)}
            className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <span className="text-xl">+</span>
            הוספת גננת אם חדשה
          </button>

          <button
            onClick={() => setIsAddInstitutionOpen(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <span className="text-xl">+</span>
            הוספת גן חדש
          </button>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="w-1 h-8 bg-slate-700 rounded"></span>
            רשימת מדריכות
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({filteredData.length} מדריכות)
            </span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש מדריכה או גננת..."
              className="w-full sm:w-80 px-5 text-gray-700 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 outline-none shadow-sm transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((instructor: any) => {
            const teacherCount =
              instructor.subordinatesIns?.filter((g: any) =>
                g.roles.includes("MANAGER")
              ).length || 0;

            return (
              <div
                key={instructor.id}
                onClick={() => openInstructorModal(instructor)}
                className="group bg-white rounded-lg shadow-md border border-gray-200 hover:border-slate-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="bg-slate-700 p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold leading-tight">
                      {highlightText(
                        `${instructor.firstName} ${instructor.lastName}`,
                        searchTerm
                      )}
                    </h2>
                    <div className="bg-slate-600 px-3 py-1.5 rounded group-hover:bg-slate-500 transition-colors">
                      <span className="text-xs font-semibold">לחצי לצפייה</span>
                    </div>
                  </div>

                  <div className="items-center gap-2 bg-slate-600 px-4 py-2 rounded inline-flex">
                    <span className="text-2xl font-bold">{teacherCount}</span>
                    <span className="text-sm">גננות אם</span>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-xl">👥</span>
                      <span className="text-sm font-medium">
                        ניהול גנים ושיבוצים
                      </span>
                    </div>
                    <div className="text-slate-700 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      פרטים ←
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              לא נמצאו תוצאות
            </h3>
            <p className="text-gray-500">נסה לשנות את מילות החיפוש</p>
          </div>
        )}
      </div>

      {/* Modals */}
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
          onSuccess={() => {
            loadData();
            setIsAssignModalOpen(false);
          }}
        />
      )}

      <AddUserModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />

      <AddInstitutionModal
        isOpen={isAddInstitutionOpen}
        onClose={() => setIsAddInstitutionOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}