"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckCircle2, Search } from "lucide-react";
import { Option } from "@/types";

interface Props {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  icon?: any;
}

export default function CustomDropdown({ label, options, value, onChange, placeholder, icon: Icon }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  // סינון לפי חיפוש
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-xs font-bold text-slate-500 mr-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={selectedOption ? selectedOption.label : searchTerm}
          placeholder={placeholder || "בחרי אפשרות..."}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pr-8 p-3.5 rounded-2xl border-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        {Icon && <Icon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />}
        <ChevronDown
          size={18}
          className={`absolute left-3  top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-60 animate-in fade-in slide-in-from-top-2">
          <div className="p-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-right flex items-center justify-between text-sm font-bold transition-colors ${
                    value === opt.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {opt.label}
                  {value === opt.id && <CheckCircle2 size={16} className="text-indigo-600" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-slate-400 text-sm italic">לא נמצאו תוצאות</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
