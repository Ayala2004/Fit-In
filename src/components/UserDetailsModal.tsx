"use client";

import { useState, useEffect } from "react";
import { X, Calendar, MapPin, Phone, Mail, Award, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function UserDetailsModal({ user, isOpen, onClose }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      // API שקיים אצלך ב-userService (נצטרך לחבר אותו לנתיב API)
      fetch(`/api/test?action=allUsers`) // לצורך הדוגמה, בהמשך ניצור API ייעודי להיסטוריית משתמש
        .then(res => res.json())
        .then(() => {
          setLoading(false);
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4" dir="rtl">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 bg-slate-800 text-white relative">
          <button onClick={onClose} className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg">
              {user.firstName[0]}
            </div>
            <div>
              <h2 className="text-3xl font-black">{user.firstName} {user.lastName}</h2>
              <div className="flex flex-wrap gap-3 mt-2">
                {user.roles.map((r: string) => (
                  <span key={r} className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 bg-white/10 rounded-md">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg"><Phone size={18} /></div>
              <span className="font-bold">{user.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg"><Mail size={18} /></div>
              <span className="font-bold">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg"><MapPin size={18} /></div>
              <span className="font-bold">{user.address || "לא הוזנה כתובת"}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <div className="p-2 bg-slate-50 rounded-lg"><Award size={18} /></div>
              <span className="font-bold">ת"ז: {user.idNumber}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Activity Section */}
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" /> סיכום פעילות במערכת
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-800 font-black text-2xl">{user._count.placementsAsMain}</p>
                <p className="text-red-600 text-xs font-bold">ימי היעדרות (גננת אם)</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-emerald-800 font-black text-2xl">{user._count.placementsAsSub}</p>
                <p className="text-emerald-600 text-xs font-bold">ימי החלפה שבוצעו</p>
              </div>
            </div>
          </div>

          {/* Timeline Placeholder */}
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-indigo-500" /> היסטוריה אחרונה
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-400 italic text-center py-10">טוען היסטוריית שיבוצים...</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}