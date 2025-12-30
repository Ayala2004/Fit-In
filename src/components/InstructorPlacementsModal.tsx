"use client";

import { X, User, Building2, Pencil, GraduationCap, Search, Sparkles } from "lucide-react";
import { highlightText } from "@/lib/utils/formatters";
import { useEffect, useRef, useState } from "react";
import UserDetailsModal from "./UserDetailsModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructor: any;
  searchTerm: string;
  onAssignClick: (placement: any) => void;
}

export default function InstructorPlacementsModal({
  isOpen,
  onClose,
  instructor,
  searchTerm,
  onAssignClick,
}: Props) {
  const scrollTargetRef = useRef<HTMLDivElement>(null);
  const [selectedGanenet, setSelectedGanenet] = useState<any>(null);

  useEffect(() => {
    if (isOpen && scrollTargetRef.current) {
      setTimeout(() => {
        scrollTargetRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !instructor) return null;

  const managers =
    instructor.subordinatesIns?.filter((g: any) =>
      g.roles.includes("MANAGER")
    ) || [];

  const isGanenetMatch = (ganenet: any) => {
    if (!searchTerm.trim()) return false;
    const fullName = `${ganenet.firstName} ${ganenet.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  };

  const firstMatchIndex = managers.findIndex((g: any) => isGanenetMatch(g));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100">
        
        {/* Header - סגנון כהה תואם לשאר המודאלים */}
        <div className="p-8 bg-slate-800 text-white relative shrink-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400">
                <GraduationCap size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  {instructor.firstName} {instructor.lastName}
                </h2>
                <p className="text-indigo-200 text-sm font-medium flex items-center gap-2">
                   <Sparkles size={14} /> {managers.length} גננות אם תחת חסותה
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 custom-calendar-scroll bg-slate-50/50">
          {managers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold">לא נמצאו גננות אם משויכות</p>
            </div>
          ) : (
            managers.map((ganenet: any, index: number) => {
              const todaysPlacement = ganenet.placementsAsMain?.[0];
              const isMatch = isGanenetMatch(ganenet);
              const isFirstMatch = index === firstMatchIndex;

              return (
                <div
                  key={ganenet.id}
                  ref={isFirstMatch ? scrollTargetRef : null}
                  className={`group bg-white p-5 rounded-[2rem] border-2 transition-all duration-300 ${
                    isMatch
                      ? "border-indigo-500 shadow-xl shadow-indigo-100/50 ring-4 ring-indigo-50"
                      : "border-slate-100 hover:border-indigo-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* צד ימין: אוואטר ומידע */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner transition-colors ${
                        isMatch ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      }`}>
                        {ganenet.firstName[0]}
                      </div>

                      <div className="flex-1">
                        <div className="font-black text-slate-800 text-lg leading-tight">
                          {highlightText(`${ganenet.firstName} ${ganenet.lastName}`, searchTerm)}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-400 font-bold mt-1">
                          <Building2 size={14} className="text-indigo-500" />
                          <span>{ganenet.mainManagedInstitutions?.[0]?.name || "טרם שויך גן"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}