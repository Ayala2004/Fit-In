"use client"; // חובה ב-Next.js עבור דפי אינטראקציה

import { useState, useEffect } from 'react';
import { callApi } from '@/lib/api';
import { Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './placement-management.module.css';
export default function PlacementsManagement() {
  const [placements, setPlacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // מזהה המפקחת (בהמשך יגיע ממערכת ההתחברות שלך)
  const managerId = "694c4dcf64912e523aeee974"; 

  // טעינת הנתונים (נשתמש בנתוני דצמבר 2024 כדוגמה)
  const loadData = async () => {
    try {
      setLoading(true);
      // כאן אנחנו קוראים לפונקציה של לוח השנה שקיימת ב-Service שלך
      const data = await callApi("getCalendarData", { month: 12, year: 2024 });
      setPlacements(data);
    } catch (err) {
      alert("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // פונקציה לביטול גן
  const handleCancel = async (placementId: string) => {
    if (!confirm("האם לסגור את הגן ולבטל את השיבוץ?")) return;

    try {
      await callApi("updateStatus", {
        placementId,
        newStatus: "CANCELLED",
        managerId
      });
      alert("הגן בוטל בהצלחה");
      loadData(); // רענון הנתונים
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">טוען נתונים...</div>;

return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ניהול שיבוצים - מפקחת</h1>
        <button onClick={loadData} className={styles.refreshButton}>
          <RefreshCw size={20} />
        </button>
      </header>

      <div className={styles.listGrid}>
        {placements.map((p) => (
          <div key={p.id} className={styles.card}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div className={styles.dateBox}>
                <div className={styles.dayName}>
                  {new Date(p.date).toLocaleDateString('he-IL', { weekday: 'short' })}
                </div>
                <div className={styles.dayNumber}>
                  {new Date(p.date).getDate()}
                </div>
              </div>

              <div>
                <h3 style={{ fontWeight: 700 }}>{p.institution.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  גננת אם: {p.mainTeacher.firstName} {p.mainTeacher.lastName}
                </p>
              </div>

              <div>
                <span className={`${styles.statusBadge} ${styles[`status-${p.status}`]}`}>
                  {p.status === 'OPEN' ? 'ממתין' : p.status === 'ASSIGNED' ? 'משובץ' : 'בוטל'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {p.status !== 'CANCELLED' && (
                <button onClick={() => handleCancel(p.id)} className={styles.btnDanger}>
                  <Trash2 size={18} />
                </button>
              )}
              {p.status === 'OPEN' && (
                <button className={styles.btnPrimary}>שבצי מחליפה</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}