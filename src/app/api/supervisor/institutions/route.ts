// src/app/api/supervisor/institutions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { db_createInstitution } from "@/services/institutionService";

export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const institutions = await prisma.institution.findMany({
      where: { supervisorId: session.id },
      include: {
        mainManager: {
          include: {
            fixedRotationsAsManager: {
              include: {
                rotationTeacher: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        instructor: {
          select: { firstName: true, lastName: true, id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(institutions);
  } catch (error) {
    console.error("GET Institutions Error:", error);
    return NextResponse.json([], { status: 500 }); // החזרת מערך ריק במקרה שגיאה למניעת קריסת ה-UI
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.roles.includes("SUPERVISOR")) {
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
    }

    const body = await req.json();

    // בדיקה נוספת: האם המדריכה קיימת?
    if (!body.instructorId) {
      return NextResponse.json(
        { message: "לא ניתן להקים גן: לגננת האם הנבחרת אין מדריכה משויכת. יש לעדכן את פרטי הגננת תחילה." },
        { status: 400 }
      );
    }

    const institutionData = {
      ...body,
      supervisorId: session.id,
    };

    const newInstitution = await db_createInstitution(institutionData);

    return NextResponse.json({
      message: "הגן נוצר בהצלחה",
      institution: newInstitution,
    });
  } catch (error: any) {
    console.error("Institution Creation Error:", error);
    return NextResponse.json({ message: error.message || "שגיאה ביצירת הגן" }, { status: 500 });
  }
}
