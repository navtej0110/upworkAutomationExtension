import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

// Receives jobs from the Chrome extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobs = body.jobs;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return Response.json({ error: "No jobs provided" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const job of jobs) {
      if (!job.upworkId || !job.title) {
        continue;
      }

      // Skip navigation links that got scraped as jobs
      const lowerTitle = job.title.toLowerCase().trim();
      if (lowerTitle === "saved jobs" || lowerTitle === "my proposals" || lowerTitle === "my jobs" || lowerTitle === "find work") {
        continue;
      }

      const existing = await prisma.job.findUnique({
        where: { upworkId: job.upworkId },
      });

      if (existing) {
        const newSkills = Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "";
        const descChanged = job.description && job.description !== existing.description;
        const budgetChanged = job.budget && job.budget !== existing.budget;
        const skillsChanged = newSkills && newSkills !== existing.skills;

        if (descChanged || budgetChanged || skillsChanged) {
          await prisma.job.update({
            where: { upworkId: job.upworkId },
            data: {
              ...(descChanged ? { description: job.description } : {}),
              ...(budgetChanged ? { budget: job.budget } : {}),
              ...(skillsChanged ? { skills: newSkills } : {}),
            },
          });
          updated++;
        } else {
          unchanged++;
        }
        continue;
      }

      await prisma.job.create({
        data: {
          upworkId: job.upworkId,
          title: job.title,
          description: job.description || "",
          link: job.link || "",
          publishedAt: null,
          budget: job.budget || null,
          skills: Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || null,
          category: job.category || null,
          proposals: job.proposals || null,
          jobType: job.jobType || null,
          experienceLevel: job.experienceLevel || null,
          duration: job.duration || null,
          weeklyHours: job.weeklyHours || null,
          clientCountry: job.clientCountry || null,
          clientSpent: job.clientSpent || null,
          clientVerified: job.clientVerified || false,
        },
      });
      created++;
    }

    const parts = [];
    if (created > 0) parts.push(`${created} new`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (unchanged > 0) parts.push(`${unchanged} unchanged`);

    return Response.json({
      message: `Scraped ${jobs.length} jobs — ${parts.join(", ")}`,
      created,
      updated,
      unchanged,
      total: jobs.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return Response.json({ error: "Failed to import jobs" }, { status: 500 });
  }
}

// Allow CORS from Upwork and extension
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
