"use client";

import { useEffect, useState } from "react";

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetch("/api/supervisor/placements")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">טוען נתונים...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">
        ניהול שיבוצים והדרכה
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((instructor) => (
          <div
            key={instructor.id}
            className={`cursor-pointer transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden border ${
              selectedInstructor === instructor.id
                ? "ring-2 ring-blue-500 scale-105"
                : "border-gray-200"
            }`}
            onClick={() =>
              setSelectedInstructor(
                selectedInstructor === instructor.id ? null : instructor.id
              )
            }
          >
            {/* כותרת המדריכה */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  {instructor.firstName} {instructor.lastName}
                </h2>
                <p className="text-sm opacity-90">
                  מדריכה ({instructor.subordinatesIns?.length || 0} גנים)
                </p>
              </div>
              <span>{selectedInstructor === instructor.id ? "▲" : "▼"}</span>
            </div>

            {/* רשימת גננות - מוצגת רק אם הכרטיס נבחר */}
            {selectedInstructor === instructor.id && (
              <div className="p-4 bg-gray-50 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase">
                  גננות וגנים בניהולה:
                </h3>
                <ul className="space-y-3">
                  {instructor.subordinatesIns?.map((ganenet: any) => (
                    <li
                      key={ganenet.id}
                      className="flex flex-col p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                    >
                      <span className="font-medium text-gray-800">
                        {ganenet.firstName} {ganenet.lastName}
                      </span>
                      <span className="text-sm text-blue-600 font-bold">
                        גן:{" "}
                        {ganenet.mainManagedInstitutions &&
                        ganenet.mainManagedInstitutions.length > 0
                          ? ganenet.mainManagedInstitutions[0].name
                          : "לא שובץ גן"}
                      </span>
                    </li>
                  ))}
                  {(!instructor.subordinatesIns ||
                    instructor.subordinatesIns.length === 0) && (
                    <li className="text-gray-400 italic text-sm text-center">
                      אין גננות משויכות
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
