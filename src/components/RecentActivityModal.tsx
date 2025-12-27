"use client";

import { X, Clock, CheckCircle, XCircle, UserCheck, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: any[];
}

export default function RecentActivityModal({ isOpen, onClose, activities }: Props) {
  if (!isOpen) return null;

  // קיבוץ לפי תאריכים
  const groupedActivities = activities.reduce((acc: any, activity: any) => {
    const date = format(new Date(activity.updatedAt || activity.date), "yyyy-MM-dd");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getActivityIcon = (activity: any) => {
    if (activity.status === "CANCELLED") {
      return <XCircle size={18} className="text-red-500" />;
    } else if (activity.substitute) {
      return <CheckCircle size={18} className="text-green-500" />;
    } else {
      return <Clock size={18} className="text-orange-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    if (activity.status === "CANCELLED") {
      return `הגן ${activity.institution.name} נסגר להיום`;
    } else if (activity.substitute) {
      return `שובצה ${activity.substitute.firstName} ${activity.substitute.lastName} לגן ${activity.institution.name}`;
    } else {
      return `דווחה היעדרות בגן ${activity.institution.name}`;
    }
  };

  const getActivityColor = (activity: any) => {
    if (activity.status === "CANCELLED") {
      return "border-r-red-500 bg-red-50";
    } else if (activity.substitute) {
      return "border-r-green-500 bg-green-50";
    } else {
      return "border-r-orange-500 bg-orange-50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-gray-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">עדכונים אחרונים</h2>
              <p className="text-sm text-gray-500 mt-0.5">{activities.length} פעילויות במערכת</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">אין עדכונים להצגה</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                {/* תאריך */}
                <div className="flex items-center gap-2 mb-3  top-0 bg-white py-2">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {format(new Date(date), "EEEE, d MMMM yyyy", { locale: he })}
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* פעילויות של היום */}
                <div className="space-y-3 mr-6">
                  {groupedActivities[date].map((activity: any) => (
                    <div
                      key={activity.id}
                      className={`p-4 rounded-lg border-r-4 transition-all hover:shadow-md ${getActivityColor(activity)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getActivityIcon(activity)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">
                            {getActivityText(activity)}
                          </p>
                          {activity.mainTeacher && (
                            <p className="text-xs text-gray-500 mt-1">
                              גננת: {activity.mainTeacher.firstName} {activity.mainTeacher.lastName}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                          {format(new Date(activity.updatedAt || activity.date), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}