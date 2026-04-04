// src/app/api/supervisor/institutions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { startOfDay } from "date-fns";

// שימי לב לשינוי בטיפוס של params: הוא עכשיו Promise
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
      { status: 500 },
    );
  }
}

// src/app/api/supervisor/institutions/[id]/route.ts

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const { id } = await params;
    const today = startOfDay(new Date());

    // 1. מחיקת דיווחי עתיד בלבד (כדי שהגן לא יופיע בלוח השנה העתידי)
    await prisma.placement.deleteMany({
      where: { institutionId: id, date: { gte: today } }
    });

    // 2. עדכון המוסד ל"לא פעיל" במקום מחיקה
    await prisma.institution.update({
      where: { id },
      data: { isActive: false }
    });

    // 3. מחיקת רוטציות קבועות לעתיד (כדי שהגננת רוטציה תשתחרר)
    const inst = await prisma.institution.findUnique({ where: { id } });
    if (inst) {
      await prisma.fixedRotation.deleteMany({ where: { managerId: inst.mainManagerId } });
    }

    return NextResponse.json({ success: true, message: "המוסד הושבת והיסטוריית העבר נשמרה" });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בהשבתת המוסד" }, { status: 500 });
  }
}
