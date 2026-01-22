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
  const userId = searchParams.get('userId'); // ה-ID של המשתמשת שנבחרה
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
      const gardenRotationIds = (p.institution.mainManager?.fixedRotationsAsManager || [])
        .map((r: any) => String(r.rotationTeacherId));

      if (absentTeacherId === gardenManagerId && gardenRotationIds.includes(subId)) return true;
      if (gardenRotationIds.includes(absentTeacherId) && subId === gardenManagerId) return true;
      return false;
    };

    // 1. סינון ראשוני: הכללה/החרגה של החלפות פנימיות
    let filteredPlacements = includeInternal 
      ? allPlacements 
      : allPlacements.filter(p => !isInternalSwap(p));

    // --- התיקון הקריטי כאן ---
    // 2. סינון לפי משתמשת ספציפית (אם נבחרה)
    if (userId && userId !== "") {
      filteredPlacements = filteredPlacements.filter(p => 
        p.mainTeacherId === userId || p.substituteId === userId
      );
    }

    // 3. חישוב הסטטיסטיקה על הרשימה המסוננת סופית
    const stats = {
      total: filteredPlacements.length,
      assigned: filteredPlacements.filter(p => p.status === 'ASSIGNED').length,
      cancelled: filteredPlacements.filter(p => p.status === 'CANCELLED').length,
      open: filteredPlacements.filter(p => p.status === 'OPEN').length,
      
      // נתונים ספציפיים לתצוגה מורחבת (אם רוצים להפריד בין "הייתה חסרה" ל"החליפה")
      userSpecific: userId ? {
        asMain: filteredPlacements.filter(p => p.mainTeacherId === userId).length,
        asSub: filteredPlacements.filter(p => p.substituteId === userId).length,
      } : null
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ message: "שגיאה בחישוב הנתונים" }, { status: 500 });
  }
}