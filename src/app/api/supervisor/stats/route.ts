import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const userId = searchParams.get('userId');

  try {
    const whereClause: any = {
      institution: { supervisorId: session.id },
      date: {
        gte: start ? startOfDay(new Date(start)) : undefined,
        lte: end ? endOfDay(new Date(end)) : undefined,
      }
    };

    // אם חיפשנו משתמשת ספציפית
    if (userId) {
      whereClause.OR = [
        { mainTeacherId: userId },
        { substituteId: userId }
      ];
    }

    const placements = await prisma.placement.findMany({
      where: whereClause,
      select: { status: true, mainTeacherId: true, substituteId: true }
    });

    const stats = {
      total: placements.length,
      assigned: placements.filter(p => p.status === 'ASSIGNED').length,
      cancelled: placements.filter(p => p.status === 'CANCELLED').length,
      open: placements.filter(p => p.status === 'OPEN').length,
      userSpecific: userId ? {
        asMain: placements.filter(p => p.mainTeacherId === userId).length,
        asSub: placements.filter(p => p.substituteId === userId).length,
      } : null
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}