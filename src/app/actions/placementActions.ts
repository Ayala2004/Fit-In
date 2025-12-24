"use server";

import { db_createPlacement } from "@/services/placementService";
import { revalidatePath } from "next/cache";

// הוספנו prevState כפרמטר ראשון
export async function reportAbsenceAction(prevState: any, formData: FormData) {
  const dateStr = formData.get("date") as string;
  const institutionId = formData.get("institutionId") as string;
  const mainTeacherId = formData.get("mainTeacherId") as string;
  const notes = formData.get("notes") as string;

  try {
    await db_createPlacement({
      date: new Date(dateStr),
      institutionId,
      mainTeacherId,
      notes,
    });

    revalidatePath("/calendar");
    return { success: true, message: "הדיווח נשלח בהצלחה!" };
  } catch (error) {
    return { success: false, message: "נכשלה יצירת הבקשה. ודאי שה-IDs תקינים." };
  }
}