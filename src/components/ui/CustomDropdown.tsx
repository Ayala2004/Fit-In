"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, CheckCircle2, X, AlertCircle, Clock } from "lucide-react";
import { Option } from "@/types";

interface Props {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  icon?: any;
  inline?: boolean;
  searchable?: boolean;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  inline,
  searchable = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. מציאת האופציה הנבחרת מתוך הרשימה
  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  // 2. עדכון הטקסט להצגה בכל פעם שהאופציה הנבחרת משתנה
  useEffect(() => {
    if (selectedOption) {
      setDisplayValue(selectedOption.label);
    } else if (!value) {
      setDisplayValue("");
    }
    // אם יש value אבל לא נמצאה אופציה (כי הרשימה עוד בטעינה), displayValue נשאר כפי שהיה
  }, [selectedOption, value]);

  // 3. טיפול ביציאה מהשדה
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // מחזירים את הטקסט המקורי אם המשתמש הקליד משהו ולא בחר
        if (selectedOption) setDisplayValue(selectedOption.label);
        else if (!value) setDisplayValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption, value]);
  // סינון אופציות: רק אם searchable הוא true מבצעים פילטר
  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(displayValue.toLowerCase())
    );
  }, [options, displayValue, searchable]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setDisplayValue("");
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={inline ? "relative" : "space-y-2 relative"}
    >
      {!inline && label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
          {label}
        </label>
      )}

      <div className="relative group">
        <input
          type="text"
          value={displayValue}
          readOnly={!searchable}
          placeholder={placeholder || "בחרי אפשרות..."}
          // פוקוס יפתח את הרשימה אוטומטית רק אם המשתמש הולך להקליד (searchable)
          onFocus={() => {
            if (searchable) setIsOpen(true);
          }}
          // הקליק ינהל את הטוגל רק אם אנחנו במצב בחירה בלבד
          onClick={() => {
            if (!searchable) {
              setIsOpen(!isOpen);
            } else {
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            if (searchable) {
              setDisplayValue(e.target.value);
              setIsOpen(true);
            }
          }}
          className={`w-full p-3.5 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all pr-10 pl-10 
    ${searchable ? "cursor-text" : "cursor-pointer"} 
    ${
      isOpen
        ? "border-indigo-500 bg-white ring-4 ring-indigo-50"
        : "border-slate-100"
    }`}
        />

        {Icon && (
          <Icon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none"
          />
        )}

        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* מציגים X רק אם יש ערך ורק אם השדה ניתן לחיפוש (או אם רוצים לאפשר איפוס מהיר) */}
          {displayValue && searchable && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform cursor-pointer ${
              isOpen ? "rotate-180" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] mt-2 right-0 w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-2 max-h-60 overflow-y-auto custom-calendar-scroll">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-4 rounded-xl text-right flex items-center justify-between text-sm font-bold transition-all mb-1 ${
                    value === opt.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "hover:bg-indigo-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {opt.label}
                    {opt.warning && (
                      <span className="relative group text-amber-500 cursor-pointer">
                        <AlertCircle size={16} />
                        <span className="tooltip-dropdown">{opt.warning}</span>
                      </span>
                    )}

                    {opt.info && (
                      <span className="relative group text-blue-500 cursor-pointer">
                        <Clock size={16} />
                        <span className="tooltip-dropdown">{opt.info}</span>
                      </span>
                    )}
                  </div>
                  {value === opt.id && (
                    <CheckCircle2 size={16} className="text-white" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-slate-400 text-sm text-center font-bold  ">
                {searchable
                  ? `לא נמצאו תוצאות ל-"${displayValue}"`
                  : "אין אופציות זמינות"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
