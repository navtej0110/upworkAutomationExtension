import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const minScore = searchParams.get("minScore");
  const sort = searchParams.get("sort") || "score"; // score | date

  const where: Record<string, unknown> = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (minScore) {
    where.matchScore = { gte: Number(minScore) };
  }

  const orderBy =
    sort === "date"
      ? { publishedAt: "desc" as const }
      : { matchScore: "desc" as const };

  const jobs = await prisma.job.findMany({
    where,
    orderBy,
  });

  return Response.json({ jobs });
}

export async function DELETE() {
  const { count } = await prisma.job.deleteMany();
  return Response.json({ message: `Deleted all ${count} jobs`, count });
}
