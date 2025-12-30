// src/app/api/supervisor/institutions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { db_createInstitution } from '@/services/institutionService';

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const institutions = await prisma.institution.findMany({
      where: { supervisorId: session.id },
      include: {
        // שימוש ב-select מוודא שאנחנו לא מושכים שדות לא קיימים
        mainManager: { 
          select: { firstName: true, lastName: true, id: true, email: true } 
        },
        instructor: { 
          select: { firstName: true, lastName: true, id: true } 
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(institutions);
  } catch (error) {
    console.error("GET Institutions Error:", error);
    return NextResponse.json([], { status: 500 }); // החזרת מערך ריק במקרה שגיאה למניעת קריסת ה-UI
  }
}

// ... ה-POST הקיים שלך נשאר מתחת ...
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const body = await req.json();
    
    // הוספת ה-supervisorId מהסשן באופן אוטומטי
    const institutionData = {
      ...body,
      supervisorId: session.id,
    };

    const newInstitution = await db_createInstitution(institutionData);

    return NextResponse.json({ 
      message: 'הגן נוצר בהצלחה', 
      institution: newInstitution 
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'מספר מוסד זה כבר קיים במערכת' }, { status: 400 });
    }
    return NextResponse.json({ message: 'שגיאה ביצירת הגן' }, { status: 500 });
  }
}