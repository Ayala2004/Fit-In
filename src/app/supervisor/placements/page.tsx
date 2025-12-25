'use client';

import { useEffect, useState } from 'react';

export default function SupervisorPlacements() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supervisor/placements')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">טוען נתונים...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">ניהול שיבוצים והדרכה</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((instructor) => (
          <div key={instructor.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-xl font-semibold">{instructor.firstName} {instructor.lastName}</h2>
              <p className="text-sm opacity-90">מדריכה</p>
            </div>
            
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">גננות וגנים בניהולה:</h3>
              <ul className="space-y-3">
                {/* כאן שיניתי מ-instructingUsers ל-subordinatesIns */}
                {instructor.subordinatesIns?.map((ganenet: any) => (
                  <li key={ganenet.id} className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-800">{ganenet.firstName} {ganenet.lastName}</span>
                    <span className="text-sm text-blue-600">
                      גן: {ganenet.institution?.name || 'לא שובץ גן'}
                    </span>
                  </li>
                ))}
                {/* וגם כאן */}
                {(!instructor.subordinatesIns || instructor.subordinatesIns.length === 0) && (
                  <li className="text-gray-400 italic text-sm">אין גננות משויכות</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}