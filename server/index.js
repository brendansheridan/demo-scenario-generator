import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── System Prompts ──────────────────────────────────────────────────────────

const FICTIONAL_SYSTEM = `You are a Salesforce demo scenario generator for a "Vibe Coding" workshop where the presenter uses Cursor (AI coding IDE) to live-build a Salesforce org from scratch.

Be BOLD and CREATIVE. Go beyond typical B2B SaaS. Think: space exploration, moon colonization, futuristic rockets, premium audiophile electronics, lab-grown food, AR glasses, electric hypercars, ocean farming, fusion energy, esports arenas, zero-gravity hotels, gene-editing agriculture, AI fashion, brain-computer interfaces.

If the user provides a scenario idea, build around it. Otherwise, pick something surprising and cinematic.

The workshop steps are:
1. Creating custom Salesforce objects (with fields, relationships)
2. Creating sample data/records
3. Creating permission sets automatically
4. Creating flows, prompt templates, and actions
5. Auto-deploying to a Salesforce scratch org
6. Building a Lightning Web Component (LWC)
7. Pushing to GitHub

Return ONLY a valid JSON object — no markdown, no backticks, no comments:
{
  "company": "Invented company name",
  "industry": "Industry vertical",
  "tagline": "One punchy sentence",
  "challenge": "Specific business problem (2 sentences max)",
  "salesforceGoal": "What we'll build in Salesforce (1 sentence)",
  "objects": ["3-4 custom object API names like Rocket_Launch__c"],
  "wow": "The LWC wow moment — what it visually shows or does",
  "emoji": "One relevant emoji",
  "prompts": {
    "objects": "Cursor prompt for step 1",
    "data": "Cursor prompt for step 2",
    "perms": "Cursor prompt for step 3",
    "flows": "Cursor prompt for step 4",
    "deploy": "Cursor prompt for step 5",
    "lwc": "Cursor prompt for step 6",
    "github": "Cursor prompt for step 7"
  }
}`;

const REAL_SYSTEM = `You are a Salesforce Solutions Engineer building a realistic, compelling demo scenario for a real customer. Using the company name, website summary, and demo story context provided, generate a true-to-life Salesforce Service Cloud demo scenario that could be used in an actual sales cycle.

The goal: build something this company could genuinely deploy. Use realistic object names, field names, and automation logic that maps to their actual business.

The workshop steps are:
1. Creating custom Salesforce objects (with fields, relationships)
2. Creating sample data/records
3. Creating permission sets automatically
4. Creating flows, prompt templates, and actions
5. Auto-deploying to a Salesforce scratch org
6. Building a Lightning Web Component (LWC)
7. Pushing to GitHub

Return ONLY a valid JSON object — no markdown, no backticks, no comments:
{
  "company": "The real company name",
  "industry": "Their actual industry",
  "tagline": "What they actually do (1 sentence)",
  "challenge": "The real business problem described in the demo story (2 sentences max)",
  "salesforceGoal": "What we'll build in Salesforce to address it (1 sentence)",
  "objects": ["3-4 custom Salesforce object API names tailored to their use case"],
  "wow": "The LWC wow moment — a visually compelling dashboard or component specific to their business",
  "emoji": "One relevant emoji for their industry",
  "prompts": {
    "objects": "Cursor prompt for step 1 — specific to this company's data model",
    "data": "Cursor prompt for step 2 — realistic sample records matching their business",
    "perms": "Cursor prompt for step 3 — permission set named for this company",
    "flows": "Cursor prompt for step 4 — automates a real process from their demo story",
    "deploy": "Cursor prompt for step 5 — standard SFDX deploy sequence",
    "lwc": "Cursor prompt for step 6 — LWC that would impress THIS company's stakeholders",
    "github": "Cursor prompt for step 7 — repo named and described for this company's project"
  }
}`;

// ── Gemini API helper ───────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini(systemPrompt, userMessage, useSearch = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 1.0,
    },
  };

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || `Gemini API error ${res.status}`;
    console.error("Gemini API error:", JSON.stringify(data, null, 2));
    throw new Error(msg);
  }

  const parts = data.candidates?.[0]?.content?.parts || [];

  // Gemini 2.5 Flash returns "thought" parts (thought: true) then text parts.
  // Collect all non-thought text parts and concatenate them.
  const textParts = parts.filter((p) => p.text && !p.thought);
  const allText = textParts.map((p) => p.text).join("\n");

  if (!allText) {
    console.error("Gemini response parts:", JSON.stringify(parts.map(p => ({ thought: p.thought, hasText: !!p.text, textPreview: p.text?.slice(0, 100) })), null, 2));
    throw new Error("No text content in Gemini response. Try again.");
  }

  const stripped = allText.replace(/```json|```/g, "");
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("Could not find JSON in response text:", allText.slice(0, 500));
    throw new Error("No JSON found in Gemini response. Try again.");
  }

  return JSON.parse(match[0]);
}

// ── Route ───────────────────────────────────────────────────────────────────

app.post("/api/generate", async (req, res) => {
  try {
    const { mode, ideaInput, realName, realWebsite, realStory, history } = req.body;

    let systemPrompt, userMsg, useSearch;

    if (mode === "real") {
      if (!realName?.trim()) {
        return res.status(400).json({ error: "Please enter a company name." });
      }
      systemPrompt = REAL_SYSTEM;
      useSearch = Boolean(realWebsite?.trim());
      userMsg = `Company: ${realName.trim()}
Website: ${realWebsite?.trim() || "not provided"}
Demo Story / Context:
${realStory?.trim() || "No additional context provided — use your knowledge of this company and industry to infer realistic use cases."}

Generate a true-to-life Salesforce Service Cloud demo scenario for this company.`;
    } else {
      systemPrompt = FICTIONAL_SYSTEM;
      useSearch = false;
      const recentHistory = (history || []).slice(-3).join(", ") || "none yet";
      userMsg = ideaInput?.trim()
        ? `Generate a demo scenario based on this idea: "${ideaInput.trim()}". Make it specific, memorable, cinematic. Avoid recent ones: ${recentHistory}.`
        : `Generate a surprising, creative demo scenario. Go bold — futuristic, niche, unexpected. Avoid: ${recentHistory}.`;
    }

    const scenario = await callGemini(systemPrompt, userMsg, useSearch);
    res.json({ scenario });
  } catch (err) {
    console.error("Generate error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate scenario." });
  }
});

// ── Static files (production) ───────────────────────────────────────────────

const distPath = path.join(__dirname, "..", "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
