import { prisma } from "@/lib/db";
import { batchMatchJobs } from "@/lib/ai";

export async function POST() {
  try {
    const profile = await prisma.profile.findFirst();
    if (!profile) {
      return Response.json(
        { error: "Please set up your profile first" },
        { status: 400 }
      );
    }

    // Get unmatched jobs (no score yet)
    const jobs = await prisma.job.findMany({
      where: { matchScore: null },
    });

    if (jobs.length === 0) {
      return Response.json({ message: "No new jobs to match", matched: 0 });
    }

    const results = await batchMatchJobs(
      jobs.map((j) => ({
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

    // Update jobs with scores
    for (const [jobId, result] of results) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          matchScore: result.score,
          matchReason: result.reason,
        },
      });
    }

    return Response.json({
      message: `Matched ${results.size} jobs with AI`,
      matched: results.size,
    });
  } catch (error) {
    console.error("Match error:", error);
    return Response.json(
      { error: "Failed to match jobs" },
      { status: 500 }
    );
  }
}
