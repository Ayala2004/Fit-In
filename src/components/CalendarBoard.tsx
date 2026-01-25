import useSWR from 'swr';
import { fetcher } from '@/utils/fetcher';

// הגדרת טיפוס הנתונים לפי ה-Schema שלך (Placement)
interface Placement {
  id: string;
  date: string;
  status: 'OPEN' | 'ASSIGNED' | 'CANCELLED';
  substituteId?: string;
  manager: { name: string; kindergartenName: string };
}

export default function CalendarBoard() {
  // 1. קריאה ל-API שיצרת (נניח שזה הנתיב)
  const { data, error, isLoading } = useSWR<Placement[]>('/api/placements', fetcher, {
    refreshInterval: 5000, // כאן קורה הקסם של ה-5 שניות
  });

  if (error) return <div className="p-4 text-red-500">שגיאה בטעינת לוח השיבוצים</div>;
  if (isLoading) return <div className="p-4">טוען נתונים בזמן אמת...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">לוח שיבוצים חי</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.map((placement) => (
          <div 
            key={placement.id} 
            className={`p-4 rounded-2xl border transition-all duration-500 ${
              placement.status === 'ASSIGNED' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className="font-bold">{placement.manager.kindergartenName}</h3>
            <p className="text-sm text-slate-600">תאריך: {new Date(placement.date).toLocaleDateString('he-IL')}</p>
            
            <div className="mt-2">
              {placement.status === 'OPEN' ? (
                <span className="text-orange-500 font-medium animate-pulse">🔎 מחפשים מחליפה...</span>
              ) : (
                <span className="text-green-600 font-medium">✅ שובצה מחליפה</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}