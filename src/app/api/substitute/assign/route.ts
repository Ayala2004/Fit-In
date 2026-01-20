import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_assignSubstitute } from '@/services/placementService';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const { placementId } = await req.json();

    // בדיקה שהשיבוץ עדיין פתוח
    const placement = await prisma.placement.findUnique({
      where: { id: placementId }
    });

    if (!placement || placement.status !== "OPEN") {
      return NextResponse.json({ message: "אופס, מישהי כבר הקדימה אותך והשתבצה לגן זה." }, { status: 400 });
    }

    // שימוש ב-Service הקיים שלך לעדכון השיבוץ ושליחת התראות
    const updated = await db_assignSubstitute(placementId, session.id, session.roles);

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}