import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  const instructors = await prisma.user.findMany({
    where: { roles: { has: 'INSTRUCTOR' } },
    select: { id: true, firstName: true, lastName: true }
  });
  return NextResponse.json(instructors);
}