import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// שליפת כל ההתראות של המשתמש המחובר
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}

// סימון כל ההודעות כנקראו (יקרה כשנכנסים לדף ההתראות)
export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "לא מורשה" }, { status: 401 });

  try {
    const result = await prisma.notification.updateMany({
      where: { 
        userId: session.id, 
        isRead: false 
      },
      data: { isRead: true }
    });
    console.log(`Updated ${result.count} notifications to read for user ${session.id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: "שגיאה בעדכון" }, { status: 500 });
  }
}