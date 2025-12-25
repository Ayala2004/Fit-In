'use client';

import { useEffect, useState } from 'react';

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- הבאת נתונים מהשרת ---
  useEffect(() => {
    fetch('/api/supervisor/placements')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  // --- פתיחת כרטיס אוטומטית לפי חיפוש ---
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const firstMatch = data.find(
        (inst) =>
          `${inst.firstName} ${inst.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inst.subordinatesIns?.some((g: any) =>
            `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );

      if (firstMatch) setSelectedInstructor(firstMatch.id);
    }
  }, [searchTerm, data]);

  // --- פונקציה להדגשת טקסט בחיפוש ---
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 p-0 rounded">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // --- סינון נתונים לפי חיפוש ---
  const filteredData = data.filter((instructor) => {
    const instructorName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    const hasMatchingGanenet = instructor.subordinatesIns?.some((g: any) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return instructorName.includes(searchTerm.toLowerCase()) || hasMatchingGanenet;
  });

  if (loading) return <div className="p-10 text-center">טוען נתונים...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      {/* כותרת + חיפוש */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-blue-900">ניהול שיבוצים והדרכה</h1>
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="חיפוש מדריכה או גננת..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* אם אין תוצאות */}
      {filteredData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">
            לא נמצאו תוצאות לחיפוש "{searchTerm}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((instructor) => (
            <div
              key={instructor.id}
              className={`cursor-pointer transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden border ${
                selectedInstructor === instructor.id
                  ? "ring-2 ring-blue-500 scale-[1.02]"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() =>
                setSelectedInstructor(
                  selectedInstructor === instructor.id ? null : instructor.id
                )
              }
            >
              {/* כותרת המדריכה */}
              <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-inner">
                <div>
                  <h2 className="text-xl font-semibold">
                    {highlightText(`${instructor.firstName} ${instructor.lastName}`, searchTerm)}
                  </h2>
                  <p className="text-sm opacity-90">
                    מדריכה ({instructor.subordinatesIns?.length || 0} גנים)
                  </p>
                </div>
                <span className={`transition-transform duration-300 ${selectedInstructor === instructor.id ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>

              {/* רשימת גננות */}
              {selectedInstructor === instructor.id && (
                <div className="p-4 bg-blue-50/30 animate-in fade-in zoom-in-95 duration-200">
                  <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase">
                    גננות וגנים בניהולה:
                  </h3>
                  <ul className="space-y-3">
                    {instructor.subordinatesIns?.map((ganenet: any) => {
                      const todaysPlacement = ganenet.placementsAsMain?.[0]; // בדיקה לשיבוץ היום

                      return (
                        <li
                          key={ganenet.id}
                          className="flex flex-col p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800">
                                {highlightText(`${ganenet.firstName} ${ganenet.lastName}`, searchTerm)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {ganenet.mainManagedInstitutions?.[0]?.name || "ללא מוסד"}
                              </span>
                            </div>

                            {/* אינדיקטור סטטוס נוכחות */}
                            {!todaysPlacement ? (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                                בגן
                              </span>
                            ) : todaysPlacement.status === "OPEN" ? (
                              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200 font-bold animate-pulse">
                                חסרה - ללא מחליפה
                              </span>
                            ) : (
                              <span className="text-[10px] bg-green-100 text-green-600 px-2 py-1 rounded-full border border-green-200 font-bold">
                                חסרה - יש מחליפה
                              </span>
                            )}
                          </div>

                          {/* אם יש מחליפה */}
                          {todaysPlacement?.status === "OPEN" && (
                            <button className="mt-2 text-xs text-blue-600 hover:underline font-medium text-right">
                              + חפשי מחליפה עכשיו
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
