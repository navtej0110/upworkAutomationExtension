import { prisma } from "@/lib/db";
// import Anthropic from "@anthropic-ai/sdk";
import { groqChat } from "@/lib/ai";
import { NextRequest } from "next/server";

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

export async function POST(request: NextRequest) {
  const { jobId } = await request.json();

  if (!jobId) {
    return Response.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const profile = await prisma.profile.findFirst();
  if (!profile) {
    return Response.json(
      { error: "Please set up your profile first" },
      { status: 400 }
    );
  }

  const prompt = `You are an expert Upwork freelancer proposal writer. Write a winning proposal for this job.

## Freelancer Profile
- Name: ${profile.name}
- Title: ${profile.title}
- Skills: ${profile.skills}
- Hourly Rate: ${profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Flexible"}
- Bio: ${profile.bio || "Not provided"}
- Experience: ${profile.experience || "Not provided"}

## Job Posting
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${job.skills || "Not specified"}
- Budget: ${job.budget || "Not specified"}

## Instructions
Generate a JSON response with:

1. "proposal": A personalized, professional Upwork proposal (3-4 short paragraphs) with these rules:
   - Use "\\n\\n" between paragraphs for clear line breaks
   - If the client's name is mentioned in the job posting, greet them by name at the start (e.g. "Hi John,")
   - Open with a hook that shows you understand their specific problem
   - Highlight 2-3 relevant skills/experiences that directly apply
   - Mention a specific approach or first step you'd take
   - Include a line about the estimated timeline (e.g. "I can deliver this within X days / approximately X hours of work")
   - End with a clear call to action
   - Sound human and conversational, NOT generic or template-like
   - Do NOT start with "Dear Hiring Manager" or "I am writing to express interest"

2. "estimatedHours": Estimated hours a skilled human developer would need to complete this project (number)

3. "estimatedDays": Estimated working days to complete (number)

4. "estimatedBudget": Suggested bid amount as a string (e.g. "$500" or "$30/hr")

5. "complexity": One of "Simple", "Moderate", "Complex"

6. "keyPoints": Array of 3-4 bullet points highlighting why you're a good fit

Return ONLY valid JSON.`;

  try {
    // const response = await anthropic.messages.create({
    //   model: "claude-sonnet-4-6",
    //   max_tokens: 1500,
    //   messages: [{ role: "user", content: prompt }],
    // });
    //
    // const text =
    //   response.content[0].type === "text" ? response.content[0].text : "";

    const text = await groqChat([{ role: "user", content: prompt }], 1500);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // AI sometimes puts literal newlines inside JSON string values — fix them
      const fixed = text.replace(/"([^"]*?)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      });
      parsed = JSON.parse(fixed);
    }

    return Response.json({
      proposal: parsed.proposal,
      estimatedHours: parsed.estimatedHours,
      estimatedDays: parsed.estimatedDays,
      estimatedBudget: parsed.estimatedBudget,
      complexity: parsed.complexity,
      keyPoints: parsed.keyPoints || [],
      job,
    });
  } catch (error) {
    console.error("Proposal generation error:", error);
    return Response.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
