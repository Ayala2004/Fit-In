// src/app/api/supervisor/institutions/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// שימי לב לשינוי בטיפוס של params: הוא עכשיו Promise
export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } 
) {
  const session = await getSession();
  
  // בדיקת אבטחה
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // התיקון הקריטי: חייבים לעשות await ל-params ב-Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json({ message: "מזהה מוסד חסר" }, { status: 400 });
    }

    const updatedInstitution = await prisma.institution.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json(updatedInstitution);
  } catch (error: any) {
    console.error("Update Institution Error:", error);
    return NextResponse.json(
      { message: "שגיאה בעדכון פרטי המוסד", error: error.message }, 
      { status: 500 }
    );
  }
}