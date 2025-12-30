import { decrypt } from "@/utils/crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { encrypted } = await req.json();
  const decrypted = decrypt(encrypted);
  return NextResponse.json({ decrypted });
}
