"use client";
import { ChevronDown } from "lucide-react";

interface Option {
  id: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  icon?: any;
}

export default function FormSelect({ label, value, onChange, options, placeholder, icon: Icon }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <ChevronDown size={18} />
        </div>
        {Icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}