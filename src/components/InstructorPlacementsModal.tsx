"use client";

import { X, User, Building2 } from "lucide-react";
import { highlightText } from "@/lib/utils/formatters"; 
import { useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instructor: any;
  searchTerm: string;
  onAssignClick: (placement: any) => void;
}

export default function InstructorPlacementsModal({ isOpen, onClose, instructor, searchTerm, onAssignClick }: Props) {
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // גלילה אוטומטית לגננת המתאימה
    if (isOpen && scrollTargetRef.current) {
      setTimeout(() => {
        scrollTargetRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        });
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !instructor) return null;

  const managers = instructor.subordinatesIns?.filter((g: any) => g.roles.includes("MANAGER")) || [];

  // בדיקה אם גננת מתאימה לחיפוש
  const isGanenetMatch = (ganenet: any) => {
    if (!searchTerm.trim()) return false;
    const fullName = `${ganenet.firstName} ${ganenet.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  };

  // מציאת הגננת הראשונה שמתאימה לחיפוש
  const firstMatchIndex = managers.findIndex((g: any) => isGanenetMatch(g));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {instructor.firstName} {instructor.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {managers.length} גננות אם
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          {managers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">לא נמצאו גננות אם משויכות למדריכה זו</p>
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
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isMatch 
                      ? "bg-yellow-50 border-yellow-400 shadow-md" 
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isMatch ? "bg-yellow-200" : "bg-gray-200"
                      }`}>
                        <User size={20} className={isMatch ? "text-yellow-700" : "text-gray-600"} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-900">
                          {highlightText(
                            `${ganenet.firstName} ${ganenet.lastName}`,
                            searchTerm
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                          <Building2 size={14} />
                          <span>{ganenet.mainManagedInstitutions?.[0]?.name || "ללא מוסד"}</span>
                        </div>
                        
                        {todaysPlacement?.status === "OPEN" && (
                          <button
                            onClick={() => onAssignClick(todaysPlacement)}
                            className="mt-3 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                          >
                            חיפוש מחליפה
                          </button>
                        )}
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