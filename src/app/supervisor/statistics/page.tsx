"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subMonths, subYears, startOfMonth, isSameDay } from "date-fns";
import { BarChart3, Calendar, User, Search, TrendingUp, XCircle, CheckCircle, Info } from "lucide-react";

export default function StatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  // פילטרים
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeShortcut, setActiveShortcut] = useState<'month' | 'year' | null>('month');

  // טעינת משתמשות
  useEffect(() => {
    fetch("/api/supervisor/users-stats")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));
  }, []);

  // שליפת הנתונים מהשרת
  const fetchStats = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      ...(selectedUserId && { userId: selectedUserId })
    });
    const res = await fetch(`/api/supervisor/stats?${params}`);
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };

  // קריאה ראשונית וכל שינוי בטווח/משתמשת
  useEffect(() => {
    fetchStats();
  }, [startDate, endDate, selectedUserId]);

  // זיהוי תפקיד המשתמשת הנבחרת
  const selectedUser = useMemo(() => 
    users.find(u => u.id === selectedUserId), 
    [selectedUserId, users]
  );

  const isManager = selectedUser?.roles.includes("MANAGER");
  const isSubstitute = selectedUser?.roles.some((r: string) => ["SUBSTITUTE", "ROTATION"].includes(r));

  // פונקציה להגדרת קיצור דרך
  const handleShortcut = (type: 'month' | 'year') => {
    const end = new Date();
    const start = type === 'month' ? subMonths(end, 1) : subYears(end, 1);
    
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    setActiveShortcut(type);
  };

  // פונקציה לשינוי ידני של תאריך (מבטל את הדגשת הקיצור)
  const handleDateChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') setStartDate(val);
    else setEndDate(val);
    setActiveShortcut(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 animate-in fade-in duration-700" dir="rtl">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <BarChart3 size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">מרכז נתונים וסטטיסטיקה</h1>
          <p className="text-slate-500 font-medium italic">ניתוח פעילות הגנים וצוותי ההוראה</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        
        {/* טווח תאריכים */}
        <div className="space-y-3">
          <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" /> טווח תאריכים
          </label>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => handleDateChange('start', e.target.value)} 
              className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 text-slate-600 cursor-pointer" 
            />
            <div className="w-px h-6 bg-slate-200 self-center"></div>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => handleDateChange('end', e.target.value)} 
              className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 text-slate-600 cursor-pointer" 
            />
          </div>
        </div>

        {/* בחירת משתמשת */}
        <div className="space-y-3">
          <label className="block text-sm font-black text-slate-700 flex items-center gap-2">
            <User size={16} className="text-indigo-500" /> בחירת גננת / מחליפה
          </label>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-3 bg-slate-50 rounded-2xl border-none text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
          >
            <option value="">-- כל המשתמשות --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.roles.includes("MANAGER") ? "גננת אם" : "צוות מחליף"})</option>
            ))}
          </select>
        </div>

        {/* קיצורי דרך */}
        <div className="flex gap-3 h-[52px]">
          <button 
            onClick={() => handleShortcut('month')} 
            className={`flex-1 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
              activeShortcut === 'month' 
              ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            בחודש האחרון
          </button>
          <button 
            onClick={() => handleShortcut('year')} 
            className={`flex-1 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
              activeShortcut === 'year' 
              ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            בשנה האחרונה
          </button>
        </div>
      </div>

      {/* Stats Results */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* כרטיסים כלליים - מוסתרים אם נבחר משתמש ספציפי כדי לפנות מקום (אופציונלי) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500"><TrendingUp size={120}/></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">סה"כ אירועים בטווח</p>
            <h2 className="text-5xl font-black text-slate-800 mt-3">{stats.total}</h2>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-10 text-emerald-600 group-hover:scale-110 transition-all duration-500"><CheckCircle size={120}/></div>
            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">גנים שאויישו</p>
            <h2 className="text-5xl font-black text-emerald-700 mt-3">{stats.assigned}</h2>
          </div>

          <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 opacity-10 text-red-600 group-hover:scale-110 transition-all duration-500"><XCircle size={120}/></div>
            <p className="text-red-600 font-bold text-xs uppercase tracking-widest">גנים שנסגרו</p>
            <h2 className="text-5xl font-black text-red-700 mt-3">{stats.cancelled}</h2>
          </div>

          {/* הצגת מידע ספציפי למשתמשת */}
          {stats.userSpecific && (
            <div className="md:col-span-3 border-sky-600 p-10 rounded-[3rem] text-gray-800 relative overflow-hidden shadow-xl shadow-indigo-100">
               {/* דקורציה לרקע */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-inigo/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner">
                    {selectedUser?.firstName[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">{selectedUser?.firstName} {selectedUser?.lastName}</h3>
                    <p className="text-slate-500 font-medium opacity-80">סיכום נתונים אישי לתקופה שנבחרה</p>
                  </div>
                </div>

                <div className="flex gap-12 text-center">
                  {/* אם זו גננת אם - הצג רק היעדרויות */}
                  {(isManager || (!isManager && !isSubstitute)) && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                      <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-1">ימי היעדרות</p>
                      <p className="text-6xl font-black tabular-nums">{stats.userSpecific.asMain}</p>
                    </div>
                  )}

                  {/* מחיצה ויזואלית אם המשתמשת מחזיקה בשני התפקידים */}
                  {isManager && isSubstitute && <div className="w-px h-16 bg-white/20 hidden md:block"></div>}

                  {/* אם זו מחליפה/רוטציה - הצג רק החלפות */}
                  {isSubstitute && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                      <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-1">החלפות שבוצעו</p>
                      <p className="text-6xl font-black tabular-nums text-sky-950">{stats.userSpecific.asSub}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && stats?.total === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
          <Info className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 font-bold text-lg">אין נתונים להצגה בטווח התאריכים הנבחר</p>
        </div>
      )}
    </div>
  );
}