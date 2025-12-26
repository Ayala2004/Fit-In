import { NextResponse } from "next/server";
import { db_getCalendarData, db_quickUpdatePlacement } from "@/services/placementService";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");
  const supervisorId = searchParams.get("supervisorId") || "";

  const data = await db_getCalendarData(month, year, supervisorId);
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.placement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}