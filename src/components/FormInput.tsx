"use client";

import React, { InputHTMLAttributes } from "react";
import { User, Mail, Phone, CreditCard, Lock, Calendar } from "lucide-react";
import ValidatedField from "./ValidatedField";
import { FieldConfig, FieldKind } from "@/types";
import CustomDatePicker from "./ui/CustomDatePicker";

const CONFIG: Record<FieldKind, FieldConfig> = {
  firstName: {
    label: "שם פרטי",
    placeholder: "שם פרטי",
    icon: User,
    name: "firstName",
  },
  lastName: {
    label: "שם משפחה",
    placeholder: "שם משפחה",
    icon: User,
    name: "lastName",
  },
  email: {
    label: "אימייל",
    icon: Mail,
    name: "email",
    useValidation: true,
  },
  phone: {
    label: "מספר טלפון",
    icon: Phone,
    name: "phoneNumber",
    useValidation: true,
  },
  idNumber: {
    label: "תעודת זהות",
    icon: CreditCard,
    name: "idNumber",
    useValidation: true,
  },
  password: {
    label: "סיסמה",
    placeholder: "••••••••",
    icon: Lock,
    name: "password",
    type: "password",
  },
  dateOfBirth: {
    name: "dateOfBirth",
    label: "תאריך לידה",
    type: "date",
    icon: Calendar,
    placeholder: "בחרי תאריך",
  },
};

/* ===== Props ===== */

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  kind: FieldKind;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FormInput({
  kind,
  value,
  onChange,
  ...props
}: FormInputProps) {
  const config = CONFIG[kind];
  const Icon = config.icon;
  const isLTR = ["password", "email", "phoneNumber", "idNumber"].includes(
    config.name
  );

  if (kind === "dateOfBirth") {
    return (
      <CustomDatePicker
        label={config.label}
        value={value}
        onChange={(val: any) =>
          onChange({ target: { name: config.name, value: val } } as any)
        }
      />
    );
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 mr-2">
        {config.label}
      </label>

      <div className="relative">
        {config.useValidation ? (
          <ValidatedField
            name={config.name}
            label={config.label}
            value={value}
            onChange={onChange}
            dir={
              ["password", "email", "phoneNumber", "idNumber"].includes(
                config.name
              )
                ? "ltr"
                : "rtl"
            }
          />
        ) : (
          <>
            <input
              {...props}
              name={config.name}
              type={config.type || "text"}
              required
              value={value}
              onChange={onChange}
              placeholder={config.placeholder}
              dir={
                ["password", "email", "phoneNumber", "idNumber"].includes(
                  config.name
                )
                  ? "ltr"
                  : "rtl"
              }
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            />

            <Icon
              className={`absolute ${
                isLTR ? "right-3" : "left-3"
              } top-1/2 -translate-y-1/2 text-slate-400 ${
                config.name === "dateOfBirth" ? "hidden" : ""
              }`}
              size={16}
            />
          </>
        )}
      </div>
    </div>
  );
}
