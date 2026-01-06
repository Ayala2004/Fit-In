"use client";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, X } from "lucide-react";

export default function CustomDatePicker({ label, value, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate)
  });

  const handleSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center gap-3 font-bold text-sm text-slate-700 hover:border-indigo-300 transition-all"
      >
        <CalendarIcon size={18} className="text-indigo-500" />
        {value ? format(new Date(value), "dd/MM/yyyy") : "בחרי תאריך..."}
      </button>

      {isOpen && (
        <div className="absolute z-[110] mt-2 right-0 bg-white border border-slate-100 rounded-[2rem] shadow-2xl p-6 w-80 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-full"><ChevronRight size={18} /></button>
            <span className="font-black text-slate-800">{format(viewDate, "MMMM yyyy", { locale: he })}</span>
            <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-2 hover:bg-slate-50 rounded-full"><ChevronLeft size={18} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map(d => (
              <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOfMonth(viewDate).getDay() }).map((_, i) => <div key={i} />)}
            {days.map(day => (
              <button
                key={day.toString()}
                type="button"
                onClick={() => handleSelect(day)}
                className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isSameDay(day, new Date(value)) 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                    : "hover:bg-indigo-50 text-slate-600"
                }`}
              >
                {format(day, "d")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}