import { NextResponse } from 'next/server';
import { db_createInstitution } from '@/services/institutionService';
import { getSession } from '@/lib/auth';

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