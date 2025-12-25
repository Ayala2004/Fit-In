'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function reportAbsenceAction(prevState: any, formData: FormData) {
  const session = await getSession();
  
  if (!session) {
    return { error: 'צריך להתחבר כדי לדווח' };
  }

  const date = formData.get('date') as string;
  const reason = formData.get('reason') as string;

  try {
    // כאן תכניסי את הלוגיקה של שמירה ב-DB עם פריזמה
    // למשל:
    // await prisma.absence.create({ data: { userId: session.id, date, reason } });

    revalidatePath('/report-absence');
    return { success: true, message: 'הדיווח נשלח בהצלחה' };
  } catch (e) {
    return { error: 'שגיאה בשמירת הנתונים' };
  }
}