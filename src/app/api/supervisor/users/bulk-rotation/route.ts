import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { assignments } = await req.json();
    
    // שימוש ב-createMany ליצירת כל הקשרים החדשים בבת אחת
    await prisma.fixedRotation.createMany({
      data: assignments
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}