"use client";
import { useEffect, useState } from "react";
import {
  MapPin,
  Calendar as CalendarIcon,
  Info,
  CalendarCheck,
} from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function SubstituteDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch("/api/substitute/dashboard");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (placementId: string) => {
    if (!confirm("האם את בטוחה שברצונך להשתבץ לגן זה?")) return;
    try {
      const res = await fetch("/api/substitute/assign", {
        method: "POST",
        body: JSON.stringify({ placementId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("השיבוץ בוצע בהצלחה! הודעה נשלחה לגננת האם ולמפקחת.");
        loadData();
      } else {
        const err = await res.json();
        alert(err.message);
      }
    } catch (e) {
      alert("שגיאת תקשורת");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) return <LoadingScreen message="מחפש עבורך הזדמנויות החלפה..." />;

  return (
<div className="space-y-10 animate-in fade-in duration-500 pb-20 max-h-[80vh] overflow-y-hidden">
  {/* Header */}
  <div className="flex flex-col gap-2">
    <h1 className="text-3xl font-black text-slate-900">מרכז שיבוצים</h1>
    <p className="text-slate-500 font-medium">
      כאן תוכלי למצוא גנים שצריכים אותך ולהשתבץ בלחיצת כפתור
    </p>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
    {/* עמודה מרכזית: הזדמנויות החלפה */}
    <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm max-h-[63vh]">
      <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 p-6">
        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
        הזדמנויות החלפה פנויות
      </h2>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {data.availableJobs.length > 0 ? (
          data.availableJobs.map((job: any) => (
            <div
              key={job.id}
              className="group bg-white p-6 rounded-xl border border-indigo-200 shadow-sm relative overflow-hidden transition-all"
            >
              <div className="absolute top-0 right-0 bg-slate-100 px-3 py-1.5  rounded-lg text-slate-700 font-semibold text-sm flex items-center gap-2">
                <CalendarIcon size={16} />
                {new Date(job.date).toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "numeric",
                })}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-4 md:mt-0">
                <div className="flex items-center gap-4 mt-4">
                 
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {job.institution.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-1">
                      <MapPin size={14} className="text-indigo-500" />
                      <span>{job.institution.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleAssign(job.id)}
                    className="
                      inline-flex items-center justify-center gap-2
                      px-6 py-2.5
                      bg-indigo-600 text-white
                      text-sm font-semibold
                      rounded-xl
                      shadow-sm
                      hover:bg-indigo-700
                      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                      transition-all duration-200
                      active:scale-[0.98]
                    "
                  >
                    אני רוצה להחליף
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 p-16 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <Info className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">
              אין כרגע קריאות פתוחות במערכת.
            </p>
          </div>
        )}
      </div>
    </div>

    {/* עמודה צדדית: השיבוצים שלי */}
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm max-h-[63vh]">
      <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 p-6">
        <CalendarCheck size={22} className="text-slate-400" />
        השיבוצים שלך
      </h2>

      <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {data.mySchedule.length > 0 ? (
          data.mySchedule
            .filter((p: any) => {
              const d = new Date(p.date);
              d.setHours(0, 0, 0, 0);
              return d >= today;
            })
            .map((p: any) => (
              <div key={p.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {new Date(p.date).getDate()}
                  </div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                </div>
                <div className="flex-1 pb-8">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                    {new Date(p.date).toLocaleDateString("he-IL", { month: "long" })}
                  </p>
                  <h4 className="font-semibold text-slate-800 leading-tight">
                    {p.institution.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    החלפה עבור: {p.mainTeacher.firstName} {p.mainTeacher.lastName}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-600 font-medium">
                    <MapPin size={10} /> {p.institution.address}
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold italic text-sm">
              טרם נקבעו לך שיבוצים
            </p>
          </div>
        )}
      </div>

      <footer className="p-5 bg-slate-50 border-b rounded-2xl border-slate-100">
        <p className="text-[10px] text-red-400 font-extrabold leading-relaxed">
          * במידה ואינך יכולה להגיע לשיבוץ שנקבע, יש ליצור קשר עם המפקחת בהקדם.
        </p>
      </footer>
    </div>
  </div>
</div>

  );
}
