"use client"; // חייב להיות כאן כי אנחנו משתמשים ב-Hook

import { useActionState } from 'react';
import { reportAbsenceAction } from './actions';
export default function ReportAbsencePage() {
  // state יכיל את מה שהפונקציה בשרת מחזירה (success, message)
  // formAction הוא מה שנשים בתוך ה-form
  const [state, formAction, isPending] = useActionState(reportAbsenceAction, null);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-center">דיווח על היעדרות</h1>
      
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">תאריך היעדרות:</label>
          <input type="date" name="date" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">קוד מוסד (ID):</label>
          <input type="text" name="institutionId" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">תעודת זהות גננת (ID):</label>
          <input type="text" name="mainTeacherId" required className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">הערות:</label>
          <textarea name="notes" className="w-full p-2 border rounded" rows={3}></textarea>
        </div>

        {/* הצגת הודעת שגיאה או הצלחה */}
        {state?.message && (
          <p className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>
            {state.message}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isPending ? "שולח..." : "שליחת דיווח"}
        </button>
      </form>
    </div>
  );
}