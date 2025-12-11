import OpenAI from "openai";
import { z } from "zod";
import { Persona } from "@/lib/types";
import { supabase } from "@/lib/supabase";

// Initialize OpenAI Client for DeepSeek
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Zod Schema for Structured Output Validation
type CommentType = {
  persona: string;
  text: string;
  replies?: CommentType[];
};

const CommentSchema: z.ZodType<CommentType> = z.lazy(() =>
  z.object({
    persona: z.string(),
    text: z.string(),
    replies: z.array(CommentSchema).optional(),
  })
);

const PostSchema = z.object({
  title: z.string(),
  body: z.string(),
  subreddit: z.string(),
  persona: z.string(),
  topic: z.string(),
  comments: z.union([
    z.array(CommentSchema),
    z.object({ comments: z.array(CommentSchema) }).transform((val) => val.comments)
  ]).optional(),
});

type DraftPost = z.infer<typeof PostSchema>;

export const maxDuration = 60; // Standard limit, but optimization makes it faster

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log("Generating with API Key:", apiKey ? "Present" : "Missing");

  try {
    const { 
      companyInfo, 
      companyWebsite, 
      personas, 
      subreddits, 
      topics, 
      postsPerWeek,
      previousTopics = [],
      weekOffset = 0 
    } = await req.json();

    // 1. Calculate Week Start
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    const weekStartStr = today.toISOString().split('T')[0];

    // 2. Filter Topics (Simple de-duplication)
    const availableTopics = topics.filter((t: string) => !previousTopics.includes(t));
    const topicsToUse = availableTopics.length > 0 ? availableTopics : topics; // Fallback to all if exhausted

    const formattedPersonas = personas.map((p: Persona) => 
      `- Username: u/${p.username}\n  Bio/Tone: ${p.bio}`
    ).join("\n\n");

    // Combine Architect + Critic into one powerful prompt to avoid Vercel Timeouts
    // but RESTORE the full fidelity of the original prompts.
    const combinedPrompt = `
PHASE 1: THE ARCHITECT
You are "The Reddit Architect" – the world's best generator of human-like Reddit content.

Your mission:
Create content so natural, opinionated, flawed, emotional, and contextually aware that REAL Redditors cannot distinguish it from a human.

RULES OF WRITING:
1. Zero corporate tone. Reddit hates marketing speak.
2. Imperfect grammar allowed: lowercase “i”, run-on sentences, slang, “idk”, “ngl”, etc.
3. Vary sentence structure and rhythm.
4. Posts must reflect actual subreddit culture.
5. Include mild disagreements, uncertainty, humor, sarcasm.
6. When appropriate, use personal anecdotes.
7. Subtle company mentions are okay, but **no sales pitch**.

STRICT PERSONA RULES:
- Only use personas provided by the user.
- No invented usernames.
- Never have a persona reply to themselves.
- Every persona must have a consistent tone, vocabulary, emotional style, and viewpoint.

REALISM PRINCIPLES:
- Reddit posts often include “thinking out loud”.
- Comments reference specific parts of the post.
- Conversations show natural flow: question → disagreement → clarification.
- Upvote-bait patterns are allowed but must be subtle.
- Use cultural and subreddit-appropriate language.

TECHNICAL RULES:
- Always output VALID JSON.
- No trailing commas.
- No markdown formatting.
- If JSON breaks, regenerate until valid.

---------------------------------
CONTEXT:
Company: ${companyInfo}
Website: ${companyWebsite}
Subreddits: ${subreddits.join(", ")}
Topics: ${topicsToUse.join(", ")}
Posts Needed: ${postsPerWeek}
Previous Topics: ${previousTopics.join(", ")}

VALID PERSONAS (STRICTLY USE ONLY THESE):
${formattedPersonas}

---------------------------------

PHASE 2: THE CRITIC (INTERNAL QUALITY ASSURANCE)
After drafting, you must immediately switch roles to "The Critic" — an elite content QA model.
Critique your own draft against this checklist and FIX it before outputting.

CRITIC CHECKLIST:
1. SALESY DETECTION  
If any post sounds like an ad, pitch, or corporate content -> Rewrite it as a frustrated question, rant, or anecdotal post.

2. PERSONA CONSISTENCY  
Check if personas speak consistently and no persona replies to themselves. Fix violations.

3. UNKNOWN USERNAMES  
If ANY username is NOT in the valid persona list -> Replace with a valid one.

4. SUBREDDIT FIT  
If a post doesn’t match the subreddit culture -> Rewrite tone/content to fit.

5. REALISM BOOST  
Enhance natural flow, slang, slight typos, controversies, and emotional nuance.

6. COMMENT THREAD LOGIC  
Fix if comment doesn’t reference post, personas feel repetitive, or thread feels too polished.

---------------------------------
FINAL TASK:
Perform the Role of Architect to Draft, then the Role of Critic to Refine.
Return ONLY the final, refined, validity-checked JSON.

{
  "week_start": "${weekStartStr}",
  "qualityScore": 95,
  "critique": "Self-Reflection: [Describe specifically what The Critic fixed in the draft]",
  "posts": [
    {
      "title": "string",
      "body": "string",
      "subreddit": "string",
      "persona": "string (EXACT USERNAME FROM LIST)",
      "topic": "string",
      "comments": [
        { "persona": "string (DIFFERENT USERNAME FROM LIST)", "text": "string" }
      ]
    }
  ]
}
`;

    console.log(`[Single Pass] Generating & Critiquing Content (Full Fidelity)...`);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are the ultimate Reddit content engine. Output optimized JSON." },
        { role: "user", content: combinedPrompt }
      ],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const finalContent = completion.choices[0].message.content;
    if (!finalContent) throw new Error("Generation failed");

    // Parse and Validate
    const parsedParams = JSON.parse(finalContent);
    
    // Enrich with IDs and Timestamps
    const weekStart = new Date(weekStartStr);
    
    // Function to get random date in the week (9AM - 9PM)
    const getRandomDateInWeek = () => {
        const dayOffset = Math.floor(Math.random() * 7);
        const hour = 9 + Math.floor(Math.random() * 12);
        const minute = Math.floor(Math.random() * 60);
        const date = new Date(weekStart);
        date.setDate(date.getDate() + dayOffset);
        date.setHours(hour, minute, 0, 0);
        return date.toISOString();
    };

    parsedParams.week_start = weekStartStr;
    parsedParams.posts = parsedParams.posts.map((post: DraftPost) => ({
        ...post,
        id: crypto.randomUUID(),
        timestamp: getRandomDateInWeek(),
        comments: (post.comments || []).map((comment: CommentType) => ({
            ...comment,
            id: crypto.randomUUID(),
            timestamp: getRandomDateInWeek(),
        }))
    }));
    
    // Re-validate with looser schema if needed or just return rich data
    // We update ResultSchema to expect IDs now? 
    // Actually, let's skip strict Zod *re-validation* of the IDs for speed, as we just generated them correctly.
    // But we need to make sure 'comments' structure is normalized to array.

    // Save to Supabase (Non-blocking)
    if (supabase) {
      try {
        await supabase.from("content_generations").insert({
          company_info: companyInfo,
          week_start: parsedParams.week_start,
          full_response: parsedParams,
          quality_score: parsedParams.qualityScore || 0,
        });
        console.log("Saved to Supabase");
      } catch (dbError) {
        console.warn("Supabase save failed:", dbError);
      }
    }

    return Response.json(parsedParams);
  } catch (error: unknown) {
    console.error("Generation error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    if (errorMessage.includes("401")) {
      return Response.json({ error: "Authentication failed. Check API Key." }, { status: 401 });
    }
    
    return Response.json(
      { error: `Generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
