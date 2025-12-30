import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/utils/crypto";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || !session.roles.includes("SUPERVISOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = params;

    // 2. ניקוי הנתונים (Whitelisting)
    // אנחנו מוציאים החוצה את כל מה שלא אמור להיכנס ישירות לעדכון של Prisma
    const {
      id: _id,
      idNumber,
      instructorId,
      rotationTeacherId, // השם המדויק מהסכימה (schema.prisma)
      instructor,
      supervisor,
      rotationTeacher,
      mainManagedInstitutions,
      managedInstitutions,
      instructedInstitutions,
      placementsAsMain,
      placementsAsSub,
      notifications,
      _count,
      ...otherFields
    } = body;

    // 3. הכנת אובייקט העדכון
    const updateData: any = { ...otherFields };
    
    if (rotationTeacherId === "" || !rotationTeacherId) {
      updateData.rotationTeacherId = null;
    } else {
      updateData.rotationTeacherId = rotationTeacherId;
    }

    // 4. טיפול בתעודת זהות (חייבת להיות מוצפנת לפני השמירה)
    if (idNumber) {
      updateData.idNumber = encrypt(idNumber);
    }

    // 5. טיפול ב-instructorId (MongoDB חייב ObjectId תקין או null)
    if (instructorId === "" || !instructorId) {
      updateData.instructorId = null;
    } else {
      updateData.instructorId = instructorId;
    }

    // 6. ביצוע העדכון
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Prisma Update Error:", error);

    // טיפול בשגיאת ייחודיות (למשל אימייל או ת"ז שכבר קיימים)
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "אימייל או תעודת זהות כבר קיימים במערכת" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "שגיאה פנימית בעדכון המשתמש" },
      { status: 500 }
    );
  }
}
