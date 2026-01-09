import { getSession } from "@/lib/auth";
import {
  db_getMonthlyHistory,
  db_getSupervisorIdByInstructor,
} from "@/services/placementService";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session || !session.roles.includes("INSTRUCTOR")) {
    return NextResponse.json({ message: "לא מורשה" }, { status: 401 });
  }

  const supervisorId = await db_getSupervisorIdByInstructor(session.id);

  if (!supervisorId) {
    return NextResponse.json({ message: "לא נמצא Supervisor משויך" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const history = await db_getMonthlyHistory(supervisorId, month, year);
  return NextResponse.json(history);
}
