import { NextResponse } from "next/server";
import { db_registerUser, db_login } from "@/services/authService";
import { db_getAllUsers } from "@/services/userService";
import { db_createInstitution } from "@/services/institutionService";
import {
  db_createPlacement,
  db_assignSubstitute,
} from "@/services/placementService";
import { prisma } from "@/lib/prisma"; // ודאי שיש לך ייצוא של פריזמה מתיקיית lib
import { Role } from "@prisma/client";
// בדיקת קבלת משתמשים לפי תפקיד
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const action = searchParams.get("action");

  try {
    let result;
    if (action === "allUsers") {
      result = await db_getAllUsers();
    } else if (role) {
      result = await prisma.user.findMany({
        where: { roles: { has: role as Role } }
      });
    } else {
      result = { message: "Please specify an action or role" };
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// יצירת משתמש / מוסד / שיבוץ (לפי שדה type ב-body)
export async function POST(request: Request) {
  const body = await request.json();
  const { type, data } = body;

  try {
    let result;
    switch (type) {
      case "register":
        result = await db_registerUser(data);
        break;
      case "login":
        result = await db_login(data.username, data.password);
        break;
      case "institution":
        result = await db_createInstitution(data);
        break;
      case "placement":
        result = await db_createPlacement({
          ...data,
          date: new Date(data.date),
        });
        break;
      case "assign":
        result = await db_assignSubstitute(data.placementId, data.substituteId);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
