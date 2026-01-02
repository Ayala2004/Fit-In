import { NextResponse } from "next/server";
import { db_registerUser } from "@/services/authService";
import { getSession } from "@/lib/auth";
import { promises as dns } from "dns";

async function isEmailDomainValid(email: string) {
  try {
    const domain = email.split("@")[1];
    const mxRecords = await dns.resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

    const body = await req.json();
    const isRealEmail = await isEmailDomainValid(body.email);
    if (!isRealEmail) {
      return NextResponse.json(
        { message: "נראה ששרת האימייל הזה לא קיים. בדקי שוב את הכתובת." },
        { status: 400 }
      );
    }

    // 2. בדיקת ת"ז וטלפון בשרת (ליתר ביטחון)
    if (body.idNumber.length !== 9 || !/^0\d{9}$/.test(body.phoneNumber)) {
      return NextResponse.json(
        { message: "נתוני זהות או טלפון לא תקינים" },
        { status: 400 }
      );
    }
    const userData = {
      ...body,
      supervisorId: session.id, // הצמדת המפקחת המחוברת למשתמש החדש
    };

    const newUser = await db_registerUser(userData);
    return NextResponse.json({ message: "המשתמש נוצר בהצלחה", user: newUser });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
