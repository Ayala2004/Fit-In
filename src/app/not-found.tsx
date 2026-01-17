"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [target, setTarget] = useState("/login");

  useEffect(() => {
    // נבדוק מי המשתמש כדי לדעת לאן להחזיר אותו
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(user => {
        if (user.roles.includes("SUPERVISOR")) setTarget("/supervisor");
        else if (user.roles.includes("INSTRUCTOR")) setTarget("/instructor");
        else if (user.roles.includes("MANAGER")) setTarget("/manager");
      })
      .catch(() => setTarget("/login"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
        <Home size={48} />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">אופס! הדף לא נמצא</h1>
      <p className="text-slate-500 font-medium mb-8">נראה שהגעת לכתובת שאינה קיימת במערכת.</p>
      
      <button 
        onClick={() => router.push(target)}
        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
      >
        קח אותי הביתה
      </button>
    </div>
  );
}