import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const profile = await prisma.profile.findFirst();
  return Response.json({ profile });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, title, skills, hourlyRate, bio, experience } = body;

  if (!name || !title || !skills) {
    return Response.json(
      { error: "name, title, and skills are required" },
      { status: 400 }
    );
  }

  // Upsert: update existing or create new
  const existing = await prisma.profile.findFirst();

  const profile = existing
    ? await prisma.profile.update({
        where: { id: existing.id },
        data: { name, title, skills, hourlyRate: hourlyRate ?? null, bio: bio ?? null, experience: experience ?? null },
      })
    : await prisma.profile.create({
        data: { name, title, skills, hourlyRate: hourlyRate ?? null, bio: bio ?? null, experience: experience ?? null },
      });

  return Response.json({ profile });
}
