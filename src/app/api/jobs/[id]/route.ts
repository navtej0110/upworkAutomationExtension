import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["new", "applied", "skipped", "saved"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const job = await prisma.job.update({
    where: { id },
    data: { status },
  });

  return Response.json({ job });
}
