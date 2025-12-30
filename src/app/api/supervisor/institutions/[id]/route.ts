// src/app/api/supervisor/institutions/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  
  // בדיקת אבטחה
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = params;

    const updatedInstitution = await prisma.institution.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json(updatedInstitution);
  } catch (error) {
    console.error("Update Institution Error:", error);
    return NextResponse.json({ message: "שגיאה בעדכון פרטי המוסד" }, { status: 500 });
  }
}