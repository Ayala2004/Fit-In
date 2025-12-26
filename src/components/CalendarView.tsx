"use client";
import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { he } from "date-fns/locale";

export default function CalendarView({
  supervisorId,
}: {
  supervisorId: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [placements, setPlacements] = useState([]);

  // פונקציה להבאת נתונים
  const fetchMonthData = async () => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const res = await fetch(
      `/api/calendar?month=${month}&year=${year}&supervisorId=${supervisorId}`
    );
    const data = await res.json();
    setPlacements(data);
  };

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const handleDelete = async (id: string) => {
    if (!confirm("האם את בטוחה שברצונך למחוק את הדיווח הזה לצמיתות?")) return;

    try {
      const res = await fetch(`/api/calendar`, {
        method: "DELETE",
        headers: { "Content-...": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        // עדכון ה-State המקומי כדי שהדיווח ייעלם מהמסך מיד
        setPlacements((prev) => prev.filter((p: any) => p.id !== id));
        alert("הדיווח נמחק בהצלחה");
      } else {
        alert("שגיאה במחיקת הדיווח");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("תקלה בתקשורת עם השרת");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl">
      {/* כותרת וניווט */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 border rounded hover:bg-gray-50"
        >
          חודש הקודם
        </button>
        <h2 className="text-2xl font-bold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: he })}
        </h2>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 border rounded hover:bg-gray-50"
        >
          חודש הבא
        </button>
      </div>

      {/* גריד הלוח */}
      <div className="grid grid-cols-7 gap-2 border-t border-r">
        {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map(
          (day) => (
            <div
              key={day}
              className="p-2 text-center font-bold bg-gray-100 border-l border-b"
            >
              {day}
            </div>
          )
        )}

        {days.map((day) => {
          const isSaturday = day.getDay() === 6;
          const dayPlacements = placements.filter((p: any) =>
            isSameDay(new Date(p.date), day)
          );

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] p-2 border-l border-b transition-colors ${
                isSaturday ? "bg-gray-100 text-gray-400" : "hover:bg-blue-50/30"
              }`}
            >
              <span className="text-sm font-medium">{format(day, "d")}</span>

              {isSaturday ? (
                <div className="mt-4 text-center font-bold text-gray-500">
                  יום מנוחה
                </div>
              ) : (
                <div className="mt-2 space-y-1">
                  {dayPlacements.map((p: any) => (
                    <div
                      key={p.id}
                      className="text-[10px] p-1.5 bg-white border rounded shadow-sm group relative"
                    >
                      <p>
                        <strong>גננת אם:</strong> {p.mainTeacher.firstName}
                      </p>
                      <p
                        className={
                          p.status === "OPEN"
                            ? "text-red-500 font-bold"
                            : "text-green-600"
                        }
                      >
                        <strong>מחליפה:</strong>{" "}
                        {p.substitute
                          ? p.substitute.firstName
                          : p.status === "CANCELLED"
                          ? "גן סגור"
                          : "ממתין לעדכון"}
                      </p>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="hidden group-hover:block absolute top-0 left-0 bg-red-100 text-red-600 px-1 rounded"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
