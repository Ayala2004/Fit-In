"use client";

import { useEffect, useState } from "react";

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableSubs, setAvailableSubs] = useState<any[]>([]);
  const [currentPlacementId, setCurrentPlacementId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supervisor/placements")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const firstMatch = data.find((inst) =>
          `${inst.firstName} ${inst.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.subordinatesIns?.some((g: any) =>
            `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      if (firstMatch) setSelectedInstructor(firstMatch.id);
    }
  }, [searchTerm, data]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 p-0 rounded">{part}</mark>
          ) : (part)
        )}
      </span>
    );
  };

  const filteredData = data.filter((instructor) => {
    const instructorName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return instructorName.includes(searchTerm.toLowerCase()) || hasMatchingGanenet;
  });

  const openAssignModal = async (placement: any) => {
    setCurrentPlacementId(placement.id);
    const res = await fetch(`/api/supervisor/available-substitutes?date=${placement.date}`);
    const subs = await res.json();
    setAvailableSubs(subs);
    setIsModalOpen(true);
  };

  const handleAssign = async (subId: string) => {
    const res = await fetch("/api/test", {
      method: "POST",
      body: JSON.stringify({
        type: "assign",
        data: { placementId: currentPlacementId, substituteId: subId },
      }),
    });

    if (res.ok) {
      alert("השיבוץ בוצע בהצלחה!");
      setIsModalOpen(false);
      window.location.reload();
    }
  };

  if (loading) return <div className="p-10 text-center">טוען נתונים...</div>;

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
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
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
                <h2 className="text-xl font-semibold">{highlightText(`${instructor.firstName} ${instructor.lastName}`, searchTerm)}</h2>
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
                        <div className="font-bold">{highlightText(`${ganenet.firstName} ${ganenet.lastName}`, searchTerm)}</div>
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
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold animate-pulse border border-red-200">חסרה</span>
                      ) : (
                        <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full font-bold border border-green-200">מאויש</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* מודאל - מחוץ ללופ! */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-900">מחליפות פנויות</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {availableSubs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">אין מחליפות פנויות ביום זה</p>
              ) : (
                availableSubs.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-blue-50 transition-colors">
                    <div>
                      <p className="font-bold text-lg">{sub.firstName} {sub.lastName}</p>
                      <p className="text-xs text-gray-500">{sub.phoneNumber}</p>
                    </div>
                    <button 
                      onClick={() => handleAssign(sub.id)}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700"
                    >
                      שיבוץ
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}