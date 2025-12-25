import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db_getSupervisorDashboard } from '@/services/placementService';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const dashboardData = await db_getSupervisorDashboard(session.id);
    return NextResponse.json(dashboardData);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}