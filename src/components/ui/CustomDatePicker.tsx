"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  parse,
  startOfDay,
} from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, ChevronRight, ChevronLeft, X } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
  onChange: (val: string) => void;
  allowFutureDates?: boolean;
}

export default function CustomDatePicker({
  label,
  value,
  onChange,
  allowFutureDates = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    value ? new Date(value) : new Date()
  );
  const [inputValue, setInputValue] = useState(
    value ? format(new Date(value), "dd/MM/yyyy") : ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate),
  });
  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date) => {
    if (allowFutureDates) {
      // אסור עבר
      return isAfter(today, date);
    } else {
      // אסור עתיד
      return isAfter(date, today);
    }
  };

  // פונקציה לבדיקה אם שנה מעוברת
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  // פונקציה לקבלת מספר הימים המקסימלי בחודש
  const getDaysInMonth = (month: number, year: number): number => {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && isLeapYear(year)) {
      return 29;
    }
    return daysInMonth[month - 1];
  };

  // פונקציה לתיקון ווליידציה של תאריך
  const validateAndCorrectDate = (
    dayStr: string,
    monthStr: string,
    yearStr: string
  ) => {
    // המרה למספרים
    let day = parseInt(dayStr, 10);
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);

    // בדיקות בסיסיות
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    let errorMessage = "";

    // תיקון חודש (1-12)
    if (month < 1) {
      month = 1;
      errorMessage = "החודש תוקן ל-1 (ינואר)";
    }
    if (month > 12) {
      month = 12;
      errorMessage = "החודש תוקן ל-12 (דצמבר)";
    }

    // תיקון שנה (אם הוקלדו 2 ספרות)
    if (year < 100) {
      year = 2000 + year;
    }

    // בדיקת תקינות שנה (1900-2099)
    if (year < 1900) {
      year = 1900;
      errorMessage = "השנה תוקנה ל-1900";
    }
    if (year > 2099) {
      year = 2099;
      errorMessage = "השנה תוקנה ל-2099";
    }

    // תיקון יום לפי מספר הימים המקסימלי בחודש
    const maxDay = getDaysInMonth(month, year);
    if (day < 1) {
      day = 1;
      errorMessage = "היום תוקן ל-1";
    }
    if (day > maxDay) {
      day = maxDay;
      const monthNames = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ];
      if (month === 2 && !isLeapYear(year)) {
        errorMessage = `${
          monthNames[month - 1]
        } ${year} אינו שנה מעוברת - היום תוקן ל-${maxDay}`;
      } else {
        errorMessage = `ל${
          monthNames[month - 1]
        } יש רק ${maxDay} ימים - היום תוקן ל-${maxDay}`;
      }
    }

    // יצירת אובייקט תאריך
    const date = new Date(year, month - 1, day);

    // בדיקה שהתאריך לא אחרי היום או לפני היום בהתאם ל allowFutureDates

    const today = startOfDay(new Date());

    if (allowFutureDates && isAfter(today, date)) {
      errorMessage = "לא ניתן לבחור תאריך עבר - התאריך תוקן להיום";
      return { date: today, error: errorMessage };
    }

    if (!allowFutureDates && isAfter(date, today)) {
      errorMessage = "לא ניתן לבחור תאריך עתידי - התאריך תוקן להיום";
      return { date: today, error: errorMessage };
    }

    return { date, error: errorMessage };
  };

  // טיפול בשינוי קלט
  const handleInputChange = (raw: string) => {
    // הסרת כל התווים מלבד ספרות
    let digitsOnly = raw.replace(/\D/g, "");

    // הגבלה ל-8 ספרות (ddmmyyyy)
    if (digitsOnly.length > 8) {
      digitsOnly = digitsOnly.slice(0, 8);
    }

    // בניית הפורמט עם סלאשים
    let formatted = "";
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.slice(0, 2); // יום
      if (digitsOnly.length > 2) {
        formatted += "/" + digitsOnly.slice(2, 4); // חודש
        if (digitsOnly.length > 4) {
          formatted += "/" + digitsOnly.slice(4, 8); // שנה
        }
      }
    }

    setInputValue(formatted);

    // ניסיון לפרסר את התאריך רק אם יש תאריך מלא
    if (digitsOnly.length === 8) {
      const dayStr = digitsOnly.slice(0, 2);
      const monthStr = digitsOnly.slice(2, 4);
      const yearStr = digitsOnly.slice(4, 8);

      const result = validateAndCorrectDate(dayStr, monthStr, yearStr);

      if (result) {
        const correctedFormatted = format(result.date, "dd/MM/yyyy");
        setInputValue(correctedFormatted);
        onChange(format(result.date, "yyyy-MM-dd"));
        setViewDate(result.date);
        setError(result.error);
      } else {
        setError("תאריך לא תקין");
      }
    } else {
      setError("");
    }
  };

  // טיפול בבחירה מהלוח שנה
  const handleSelect = (date: Date) => {
    const today = startOfDay(new Date());

    // אם התאריך בעתיד, השתמש בתאריך של היום
    const selectedDate = isAfter(date, today) ? today : date;

    if (isDateDisabled(date)) return;

    setInputValue(format(date, "dd/MM/yyyy"));
    onChange(format(date, "yyyy-MM-dd"));
    setViewDate(date);
    setIsOpen(false);
    setError("");
  };

  // הוספת אוטומטית של סלאשים תוך כדי הקלדה
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    // מניעת הוספת תווים לא חוקיים
    if (
      !/[\d/]/.test(key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(key)
    ) {
      e.preventDefault();
      return;
    }
  };

  // Rendering
  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
        {label}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="dd/mm/yyyy"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => setIsOpen(true)}
          maxLength={10}
          className={`w-full p-3.5 bg-slate-50 border-2 rounded-2xl font-bold text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer ${
            error ? "border-amber-400 focus:ring-amber-500" : "border-slate-100"
          }`}
        />

        {/* Calendar button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          <Calendar size={18} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-amber-600 text-[10px] font-bold mt-1 animate-in slide-in-from-top-1 duration-200 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          ⚠️ {error}
        </p>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          {/* Modal Content */}
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 left-4 z-10 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-600" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 text-center">
                {label}
              </h3>
            </div>

            {/* Input inside modal */}
            <div className="p-6 border-b border-slate-100">
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={10}
                autoFocus
                className={`w-full p-3.5 bg-slate-50 border-2 rounded-2xl font-bold text-sm text-slate-700 text-center focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  error
                    ? "border-amber-400 focus:ring-amber-500"
                    : "border-slate-100"
                }`}
              />

              {/* Error message in modal */}
              {error && (
                <p className="text-amber-600 text-[10px] font-bold mt-3 animate-in slide-in-from-top-1 duration-200 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 text-center">
                  ⚠️ {error}
                </p>
              )}
            </div>

            {/* Calendar */}
            <div className="p-6">
              {/* Header עם ניווט חודשים */}
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>

                <span className="font-black text-slate-800 text-base">
                  {format(viewDate, "MMMM yyyy", { locale: he })}
                </span>

                <button
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center mb-3">
                {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-black text-slate-400"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1 min-h-[240px]">
                {Array.from({ length: startOfMonth(viewDate).getDay() }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} />
                  )
                )}

                {days.map((day) => {
                  const today = startOfDay(new Date());
                  const isToday = isSameDay(day, today);
                  const isDisabled = isDateDisabled(day);
                  const isSelected =
                    inputValue &&
                    isSameDay(day, parse(inputValue, "dd/MM/yyyy", new Date()));

                  return (
                    <button
                      key={day.toString()}
                      type="button"
                      onClick={() => !isDisabled && handleSelect(day)}
                      disabled={isDisabled}
                      className={`h-10 w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : isDisabled
                          ? "text-slate-300 cursor-not-allowed"
                          : isToday
                          ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                          : "hover:bg-indigo-50 text-slate-600"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Select button */}
              <button
                type="button"
                onClick={() => {
                  if (inputValue) {
                    const parsed = parse(inputValue, "dd/MM/yyyy", new Date());
                    if (parsed && !isNaN(parsed.getTime())) {
                      handleSelect(parsed);
                    }
                  }
                }}
                disabled={!inputValue || error !== ""}
                className="w-full mt-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                בחר
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
