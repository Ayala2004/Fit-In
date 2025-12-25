"use client";

import { useEffect, useState } from "react";
// ייבוא הקומפוננטה החדשה
import PlacementModal from "@/components/PlacementModal";

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States החדשים לניהול המודאל
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

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

  // פתיחת המודאל - הרבה יותר פשוט עכשיו!
  const openAssignModal = (placement: any) => {
    setSelectedPlacement(placement);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-10 text-center font-bold">טוען נתונים...</div>;

  // פילטר החיפוש (נשאר כפי שהיה)
  const filteredData = data.filter((instructor) => {
    const instructorName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return instructorName.includes(searchTerm.toLowerCase()) || hasMatchingGanenet;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-black" dir="rtl">
      {/* כותרת וחיפוש */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-900">ניהול שיבוצים והדרכה</h1>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="חיפוש מדריכה או גננת..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((instructor) => (
          <div key={instructor.id} className={`bg-white rounded-xl shadow-md border ${selectedInstructor === instructor.id ? "ring-2 ring-blue-500" : "border-gray-200"}`}>
            <div 
              className="bg-blue-600 p-4 text-white cursor-pointer flex justify-between items-center"
              onClick={() => setSelectedInstructor(selectedInstructor === instructor.id ? null : instructor.id)}
            >
              <div>
                <h2 className="text-xl font-semibold">{instructor.firstName} {instructor.lastName}</h2>
                <p className="text-xs opacity-80">מדריכה ({instructor.subordinatesIns?.length || 0} גנים)</p>
              </div>
              <span>{selectedInstructor === instructor.id ? "▲" : "▼"}</span>
            </div>

            {selectedInstructor === instructor.id && (
              <div className="p-4 space-y-3">
                {instructor.subordinatesIns?.map((ganenet: any) => {
                  const todaysPlacement = ganenet.placementsAsMain?.[0];
                  return (
                    <div key={ganenet.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-start">
                      <div>
                        <div className="font-bold">{ganenet.firstName} {ganenet.lastName}</div>
                        <div className="text-xs text-gray-600">{ganenet.mainManagedInstitutions?.[0]?.name || "ללא מוסד"}</div>
                        
                        {todaysPlacement?.status === "OPEN" && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openAssignModal(todaysPlacement); }}
                            className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                          >
                            + חפשי מחליפה עכשיו
                          </button>
                        )}
                      </div>

                      {/* באדג' סטטוס */}
                      {!todaysPlacement ? (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded-full">בגן</span>
                      ) : todaysPlacement.status === "OPEN" ? (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold animate-pulse">חסרה</span>
                      ) : (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold">מאויש</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* השימוש בקומפוננטה המשותפת */}
      {selectedPlacement && (
        <PlacementModal
          isOpen={isModalOpen}
          placement={selectedPlacement}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}