"use client";
import { useEffect, useState } from "react";
import { Bell, Clock, Info, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Notification } from "@/types";

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);

        // 1. שלחי את העדכון לשרת
        await fetch("/api/notifications", { method: "PATCH" });

        // 2. עדכני את התצוגה אצל המשתמשת מיד (ללא ריענון)
        setNotifications((prev) =>
          prev.map((n: any) => ({ ...n, isRead: true }))
        );

        // 3. הודיעי לפעמון ב-Navbar לאפס את המספר
        window.dispatchEvent(new Event("notificationsRead"));
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <LoadingScreen message="טוען הודעות..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-8">
        מרכז הודעות <Bell className="text-indigo-600" />
      </h1>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
            <Info className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">אין לך הודעות חדשות כרגע</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={`p-6 rounded-[2rem] border transition-all ${
                n.isRead
                  ? "bg-white border-slate-100 opacity-80"
                  : "bg-white border-indigo-200 shadow-md ring-1 ring-indigo-50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    n.type === "URGENT_CALL"
                      ? "bg-red-50 text-red-500"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {n.type === "URGENT_CALL" ? (
                    <Bell size={24} />
                  ) : (
                    <CheckCircle size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black text-slate-800">{n.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {format(new Date(n.createdAt), "HH:mm, dd/MM", {
                        locale: he,
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
