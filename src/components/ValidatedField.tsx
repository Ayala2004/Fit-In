"use client";
import React, { useState } from "react";
import { CreditCard, Phone, Mail } from "lucide-react";
import { validations } from "@/utils/validations";

interface ValidatedFieldProps {
  name: "idNumber" | "phoneNumber" | "email";
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  dir?: "rtl" | "ltr";
}

export default function ValidatedField({
  name,
  value,
  onChange,
  required = true,
  placeholder,
  disabled = false,
  dir,
}: ValidatedFieldProps) {
  const [error, setError] = useState("");

  // ביצוע וולידציה כשהמשתמש יוצא מהשדה (Blur)
  const handleBlur = () => {
    if (!value && required) {
      setError("שדה חובה");
      return;
    }
    const errorMessage = validations[name](value);
    setError(errorMessage);
  };

  // כשהמשתמש מקליד - אנחנו מנקים את השגיאה
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError("");
    onChange(e);
  };

  // בחירת אייקון לפי סוג השדה
  const icons = {
    idNumber: <CreditCard size={18} />,
    phoneNumber: <Phone size={18} />,
    email: <Mail size={18} />,
  };

  // קביעת כיוון הטקסט (טלפון ואימייל תמיד משמאל לימין)
  const inputDir = dir || (name === "idNumber" ? "rtl" : "ltr");

  return (
    <div className="space-y-1.5 w-full text-right">
      <div className="relative group">
        <input
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          dir={inputDir}
          className={`w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-xl transition-all outline-none font-medium
            ${
              error
                ? "ring-2 ring-red-500 bg-red-50 text-red-900"
                : "focus:ring-2 focus:ring-indigo-500 text-slate-700 hover:bg-slate-100"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />

        {/* אייקון ימני */}
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors
          ${
            error
              ? "text-red-500"
              : "text-slate-400 group-focus-within:text-indigo-500"
          }`}
        >
          {icons[name]}
        </div>

        {error && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 animate-pulse"></div>
        )}
      </div>

      {/* הצגת הודעת השגיאה */}
      <div className="min-h-[16px] mr-2">
        {error && (
          <p className="text-red-500 text-[10px] font-black animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
