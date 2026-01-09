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
  const includeInternal = searchParams.get('includeInternal') === 'true';

  try {
    const allPlacements = await prisma.placement.findMany({
      where: {
        institution: { supervisorId: session.id },
        date: {
          gte: start ? startOfDay(new Date(start)) : undefined,
          lte: end ? endOfDay(new Date(end)) : undefined,
        }
      },
      include: {
        mainTeacher: { select: { id: true, roles: true } },
        institution: {
          include: {
            mainManager: {
              include: { fixedRotationsAsManager: true }
            }
          }
        }
      }
    });

    const isInternalSwap = (p: any) => {
      if (!p.substituteId) return false;

      const subId = String(p.substituteId);
      const absentTeacherId = String(p.mainTeacherId);
      const gardenManagerId = String(p.institution.mainManagerId);
      
      // רשימת כל ה-IDs של גננות הרוטציה הקבועות של הגן הזה (מכל הימים)
      const gardenRotationIds = (p.institution.mainManager?.fixedRotationsAsManager || [])
        .map((r: any) => String(r.rotationTeacherId));

      // מקרה א': גננת אם חסרה והוחלפה ע"י אחת מגננות הרוטציה שלה
      if (absentTeacherId === gardenManagerId) {
        if (gardenRotationIds.includes(subId)) return true;
      }

      // מקרה ב': אחת מגננות הרוטציה הקבועות חסרה והוחלפה ע"י גננת האם
      if (gardenRotationIds.includes(absentTeacherId)) {
        if (subId === gardenManagerId) return true;
      }

      return false;
    };

    // סינון לפי בחירת המשתמש
    const displayPlacements = includeInternal 
      ? allPlacements 
      : allPlacements.filter(p => !isInternalSwap(p));

    const stats = {
      total: displayPlacements.length,
      assigned: displayPlacements.filter(p => p.status === 'ASSIGNED').length,
      cancelled: displayPlacements.filter(p => p.status === 'CANCELLED').length,
      open: displayPlacements.filter(p => p.status === 'OPEN').length,
      userSpecific: userId ? {
        asMain: displayPlacements.filter(p => p.mainTeacherId === userId).length,
        asSub: displayPlacements.filter(p => p.substituteId === userId).length,
      } : null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ message: "שגיאה" }, { status: 500 });
  }
}