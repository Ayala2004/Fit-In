"use client";

import { useEffect, useState } from "react";
import PlacementModal from "@/components/PlacementModal";
import InstructorPlacementsModal from "@/components/InstructorPlacementsModal";
import { highlightText } from "@/lib/utils/formatters";
import AddInstitutionModal from "@/components/AddInstitutionModal";
import { isRegistrationOpen } from "@/utils/dateHelpers";
import AddUserModal from "@/components/AddUserModal.tsx";
import { Search, UserPlus, Building2, Users, ChevronLeft, Loader2 } from "lucide-react";

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

  // חישוב filteredData
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

  // פתיחה אוטומטית של מודאל אם יש חיפוש שמתאים לגננת
  useEffect(() => {
    if (searchTerm.trim() && filteredData.length > 0) {
      const instructorWithMatch = filteredData.find((instructor) => {
        const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
          `${g.firstName} ${g.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
        const instructorNameMatch = `${instructor.firstName} ${instructor.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        
        // פתח רק אם יש התאמה לגננת (לא למדריכה עצמה)
        return hasMatchingGanenet && !instructorNameMatch;
      });

      if (instructorWithMatch && activeInstructor?.id !== instructorWithMatch.id) {
        openInstructorModal(instructorWithMatch);
      }
    }
  }, [searchTerm, data]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-lg font-medium text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">ניהול שיבוצים והדרכה</h1>
              <p className="text-sm text-gray-500 mt-1">מערכת ניהול מדריכות וגננות</p>
            </div>
            
            {/* כפתורי פעולה */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsAddTeacherOpen(true)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all text-sm"
              >
                <UserPlus size={18} />
                הוספת גננת
              </button>

              <button
                onClick={() => setIsAddInstitutionOpen(true)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all text-sm"
              >
                <Building2 size={18} />
                הוספת גן
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* חיפוש וכותרת */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">רשימת מדריכות</h2>
            <p className="text-sm text-gray-500 mt-0.5">{filteredData.length} מדריכות במערכת</p>
          </div>

          {/* שדה חיפוש */}
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש מדריכה או גננת..."
              className="w-full sm:w-80 px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((instructor: any) => {
            const teacherCount =
              instructor.subordinatesIns?.filter((g: any) =>
                g.roles.includes("MANAGER")
              ).length || 0;

            return (
              <div
                key={instructor.id}
                onClick={() => openInstructorModal(instructor)}
                className="group bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* כותרת הכרטיס */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {highlightText(
                          `${instructor.firstName} ${instructor.lastName}`,
                          searchTerm
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users size={14} />
                        <span>מדריכה</span>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
                      <Users size={20} className="text-gray-600" />
                    </div>
                  </div>

                  {/* מספר גננות */}
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="text-lg font-bold text-gray-900">{teacherCount}</span>
                    <span className="text-xs text-gray-600 font-medium">גננות אם</span>
                  </div>
                </div>

                {/* תחתית הכרטיס */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">לחצי לצפייה בפרטים</span>
                    <ChevronLeft size={16} className="text-gray-400 group-hover:translate-x-[-2px] transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              לא נמצאו תוצאות
            </h3>
            <p className="text-sm text-gray-500">נסי לשנות את מילות החיפוש</p>
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