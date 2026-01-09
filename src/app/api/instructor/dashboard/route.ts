import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db_getInstructorDashboard } from '@/services/placementService';

export async function GET() {
  const session = await getSession();
  
  // בדיקה שיש לו תפקיד מדריכה (או מפקחת שיכולה לראות הכל)
  if (!session || (!session.roles.includes("INSTRUCTOR") && !session.roles.includes("SUPERVISOR"))) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const data = await db_getInstructorDashboard(session.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}