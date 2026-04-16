// import Anthropic from "@anthropic-ai/sdk";

// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// });

const apiKey = process.env.ANTHROPIC_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface MatchResult {
  score: number; // 0-100
  reason: string;
}

async function groqChat(messages: { role: string; content: string }[], maxTokens: number = 300): Promise<string> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  let text = data.choices[0]?.message?.content || "";
  // Strip markdown code fences that Llama often wraps around JSON
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return text.trim();
}

export async function matchJobToProfile(
  job: { title: string; description: string; skills: string | null; budget: string | null },
  profile: { name: string; title: string; skills: string; bio: string | null; experience: string | null; hourlyRate: number | null }
): Promise<MatchResult> {
  const prompt = `You are a freelancer job matching assistant. Score how well this Upwork job matches the freelancer's profile.

## Freelancer Profile
- Name: ${profile.name}
- Title: ${profile.title}
- Skills: ${profile.skills}
- Hourly Rate: ${profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Not specified"}
- Bio: ${profile.bio || "Not provided"}
- Experience: ${profile.experience || "Not provided"}

## Job Posting
- Title: ${job.title}
- Description: ${job.description.slice(0, 1500)}
- Skills Required: ${job.skills || "Not specified"}
- Budget: ${job.budget || "Not specified"}

## Instructions
Return a JSON object with:
- "score": a number from 0 to 100 (100 = perfect match)
- "reason": a brief 1-2 sentence explanation of why this score

Consider: skill overlap, experience relevance, budget fit, and job complexity vs freelancer level.

Return ONLY valid JSON, no other text.`;

  // const response = await anthropic.messages.create({
  //   model: "claude-haiku-4-5-20251001",
  //   max_tokens: 300,
  //   messages: [{ role: "user", content: prompt }],
  // });
  //
  // const text =
  //   response.content[0].type === "text" ? response.content[0].text : "";

  const text = await groqChat([{ role: "user", content: prompt }], 300);

  try {
    const parsed = JSON.parse(text);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      reason: String(parsed.reason || "No reason provided"),
    };
  } catch {
    return { score: 0, reason: "Failed to parse AI response" };
  }
}

export async function batchMatchJobs(
  jobs: { id: string; title: string; description: string; skills: string | null; budget: string | null }[],
  profile: { name: string; title: string; skills: string; bio: string | null; experience: string | null; hourlyRate: number | null }
): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();

  // Process in parallel batches of 5
  const batchSize = 5;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const promises = batch.map(async (job) => {
      const result = await matchJobToProfile(job, profile);
      results.set(job.id, result);
    });
    await Promise.all(promises);
  }

  return results;
}

export { groqChat };
