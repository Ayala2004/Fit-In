"use client";

import { X } from "lucide-react";
import { highlightText } from "@/lib/utils/formatters"; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructor: any;
  searchTerm: string;
  onAssignClick: (placement: any) => void;
}

export default function InstructorPlacementsModal({ isOpen, onClose, instructor, searchTerm, onAssignClick }: Props) {
  if (!isOpen || !instructor) return null;

  const managers = instructor.subordinatesIns?.filter((g: any) => g.roles.includes("MANAGER")) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">{instructor.firstName} {instructor.lastName}</h2>
            <p className="text-blue-100 opacity-90 text-sm">ניהול גננות אם ושיבוצים</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {managers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">לא נמצאו גננות אם משויכות למדריכה זו.</div>
          ) : (
            managers.map((ganenet: any) => {
              const todaysPlacement = ganenet.placementsAsMain?.[0];
              return (
                <div key={ganenet.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center hover:border-blue-300 transition-all">
                  <div>
                    <div className="font-bold text-lg text-slate-800">{ganenet.firstName} {ganenet.lastName}</div>
                    <div className="text-sm text-slate-500">{ganenet.mainManagedInstitutions?.[0]?.name || "ללא מוסד"}</div>
                    
                    {todaysPlacement?.status === "OPEN" && (
                      <button
                        onClick={() => onAssignClick(todaysPlacement)}
                        className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold hover:bg-blue-200 transition-colors"
                      >
                        + חפשי מחליפה
                      </button>
                    )}
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