import { prisma } from "@/lib/db";
import { batchMatchJobs } from "@/lib/ai";
import { startCron, stopCron, getCronStatus } from "@/lib/cron";
import { NextRequest } from "next/server";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Auto-match: scraping is now done via Chrome extension, cron only handles AI matching
async function autoMatch() {
  const profile = await prisma.profile.findFirst();
  if (!profile) {
    console.log("Auto-match: no profile set, skipping AI matching");
    return;
  }

  const unmatchedJobs = await prisma.job.findMany({
    where: { matchScore: null },
  });

  if (unmatchedJobs.length === 0) {
    console.log("Auto-match: no unmatched jobs");
    return;
  }

  console.log(`Auto-match: scoring ${unmatchedJobs.length} jobs...`);
  const results = await batchMatchJobs(
    unmatchedJobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      skills: j.skills,
      budget: j.budget,
    })),
    {
      name: profile.name,
      title: profile.title,
      skills: profile.skills,
      bio: profile.bio,
      experience: profile.experience,
      hourlyRate: profile.hourlyRate,
    }
  );

  for (const [jobId, result] of results) {
    await prisma.job.update({
      where: { id: jobId },
      data: { matchScore: result.score, matchReason: result.reason },
    });
  }
  console.log(`Auto-match: scored ${results.size} jobs`);
}

// POST /api/cron — start or stop the cron
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "start") {
    startCron(INTERVAL_MS, autoMatch);
    return Response.json({ message: "Auto-scrape started (every 30 minutes)", ...getCronStatus() });
  }

  if (action === "stop") {
    stopCron();
    return Response.json({ message: "Auto-scrape stopped", ...getCronStatus() });
  }

  return Response.json({ error: "Invalid action. Use 'start' or 'stop'" }, { status: 400 });
}

// GET /api/cron — get cron status
export async function GET() {
  return Response.json(getCronStatus());
}
