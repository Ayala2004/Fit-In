import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db_getSupervisorDashboard } from '@/services/placementService';

export async function GET() {
  // 1. בדיקת אבטחה - האם המשתמש מחובר והוא אכן מפקחת
  const session = await getSession();
  
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "גישה נדחתה: דרושה הרשאת מפקחת" }, { status: 401 });
  }

  try {
    // 2. קריאה לשירות שבונה את נתוני ה-Dashboard (הפונקציה שבנינו ב-placementService)
    const dashboardData = await db_getSupervisorDashboard(session.id);
    
    // 3. החזרת הנתונים ל-Frontend
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: "שגיאת שרת פנימית בטעינת הנתונים" }, { status: 500 });
  }
}