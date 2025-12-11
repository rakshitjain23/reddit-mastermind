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

export const maxDuration = 120; // Extended for 2-pass generation

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

    console.log(`[Pass 1] Generating Draft for week ${weekStartStr}...`);

    const draftPrompt = `
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

TASK: Generate a complete weekly Reddit content calendar.
The final result must follow ALL realism rules, persona rules, and JSON structure.

---------------------------------
COMPANY INFO:
${companyInfo}

WEBSITE:
${companyWebsite}

PERSONAS (ONLY use these personas):
${formattedPersonas}

TARGET SUBREDDITS:
${subreddits.join(", ")}

TOPIC QUERIES:
${topicsToUse.join(", ")}

POSTS REQUIRED THIS WEEK:
${postsPerWeek}

PREVIOUS TOPICS (avoid repeating):
${previousTopics.join(", ")}

---------------------------------
STEP 1 — Generate a Persona Reasoning Plan
Before writing anything, internalize:
- Which persona should write each post
- Why this persona fits the topic
- Which subreddit fits best
- Expected tone (casual, ranting, analytic, confused, etc.)
- How human imperfections will be added

---------------------------------
STEP 2 — Generate Post Ideas
For each topic, select the strongest idea that is:
- Most discussion potential
- Most relatable
- Most aligned with personas
- Least salesy

---------------------------------
STEP 3 — Generate Full Reddit Posts
For each selected idea generate:

- title: short, punchy, human
- body: 2–6 paragraphs, variable length
  - long if the topic is deep
  - short if it's a question or rant

Include:
- uncertainty ("idk if i'm dumb but...")
- mild imperfections
- personal experiences
- Reddit-like tone variation

Subtle product mentions okay, but:
**NEVER sound like a company wrote it.**

---------------------------------
STEP 4 — Generate Natural Comment Threads
For each post:
Create:
- 3–6 comments
- Each from different personas (MUST be from the provided list)
- Comments must:
  - Reference specific parts of the post
  - Build on each other
  - Include disagreements, clarifications, advice, emotions
  - Sound like real Reddit humans

A comment can include:
- Random frustrations
- Follow-up questions
- Humor
- Personal anecdotes
- Typos or casual abbreviations

---------------------------------
OUTPUT FORMAT (STRICT JSON ONLY)

{
  "week_start": "${weekStartStr}",
  "posts": [
    {
      "title": "string",
      "body": "string",
      "subreddit": "string",
      "persona": "string",
      "topic": "string",
      "comments": [
        { "persona": "string", "text": "string", "replies": [ ... ] }
      ]
    }
  ]
}

No markdown. No explanation. Return ONLY JSON.
`;

    // --- PASS 1: DRAFT GENERATION ---
    const draftCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You represent the raw, unfiltered internet. Output JSON." },
        { role: "user", content: draftPrompt }
      ],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.85,
    });

    const draftContent = draftCompletion.choices[0].message.content;
    if (!draftContent) throw new Error("Draft generation failed");
    
    console.log(`[Pass 2] The Critic is reviewing...`);

    const criticPrompt = `
You are "The Critic" — an elite content QA model.

Your job is to FIX and UPGRADE the draft Reddit calendar JSON.

---------------------------------
VALID PERSONAS:
${formattedPersonas}

INPUT JSON:
${draftContent}

---------------------------------
CRITIC CHECKLIST:

1. SALESY DETECTION  
If any post sounds like:
- an ad
- a pitch
- corporate content  
➡️ Rewrite it as a frustrated question, rant, or anecdotal post.

2. PERSONA CONSISTENCY  
Check if:
- personas speak consistently  
- vocabulary matches their bio  
- no persona replies to themselves  
Fix violations.

3. UNKNOWN USERNAMES  
If ANY username is NOT in the valid persona list:  
➡️ Replace with a valid one.

4. SUBREDDIT FIT  
If a post doesn’t match the subreddit culture:  
➡️ Rewrite tone/content to fit.

5. REALISM BOOST  
Enhance:
- natural flow  
- slang  
- typos (slight)  
- controversies  
- conversational engagement  
- emotional nuance

6. LENGTH BALANCING  
Posts should vary:
- Some long deep dives  
- Some short, raw questions  
- Some personal stories  

7. COMMENT THREAD LOGIC  
Fix if:
- comment doesn’t reference post  
- replies don’t make sense  
- personas feel repetitive  
- thread feels too polished  
- thread lacks tension or debate  

8. REDDIT AUTHENTICITY  
Enforce:
- No "perfect paragraphs"
- Add human-like pauses, “idk”, “lol”, “ngl”
- Use personal takes
- Avoid generic templated replies

---------------------------------
FINAL TASK:
Return:

{
  "week_start": "...",
  "qualityScore": number (0-100),
  "critique": "description of what you improved",
  "posts": [...]
}

Only JSON. Nothing else.
`;

    const finalCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert editor. Output optimized JSON." },
        { role: "user", content: criticPrompt }
      ],
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const finalContent = finalCompletion.choices[0].message.content;
    if (!finalContent) throw new Error("Critic generation failed");

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
