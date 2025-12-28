import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db_getMonthlyHistory } from '@/services/placementService';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  try {
    const history = await db_getMonthlyHistory(session.id, month, year);
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בטעינת היסטוריה" }, { status: 500 });
  }
}