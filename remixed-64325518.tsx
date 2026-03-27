import { useState } from "react";

// ── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

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

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const CLI_STEPS = [
  { cmd: "sf project generate --name my-demo-project", desc: "Scaffold a new SFDX project folder" },
  { cmd: "cd my-demo-project", desc: "Navigate into the project directory" },
  { cmd: "sf org list", desc: "Confirm your target org is available" },
  { cmd: "sf config set target-org <your-org-alias>", desc: "Set your default deploy target" },
];

const QUICK_IDEAS = [
  { label: "🌕 Moon Colony",    value: "A company managing lunar habitat construction and life support for moon colonists" },
  { label: "🚀 Rocket Startup", value: "A private rocket company launching micro-satellites and space tourism flights" },
  { label: "🔊 Speaker Co.",    value: "A premium audiophile electronics company making AI-tuned speaker systems" },
  { label: "🥩 Lab-Grown Meat", value: "A bioreactor food lab cultivating and selling lab-grown premium steaks to restaurants" },
  { label: "🚁 Air Taxi",       value: "An autonomous electric air taxi network between city rooftop pads" },
  { label: "🧬 Gene Editing",   value: "An agricultural gene-editing startup designing drought-resistant crops" },
  { label: "🕶 AR Glasses",     value: "A consumer AR glasses company shipping hardware subscriptions with spatial apps" },
  { label: "⚡ Hypercar",       value: "An electric hypercar manufacturer with AI-assisted track driving modes" },
  { label: "🐾 Pet Tech",       value: "A luxury smart pet tech company making AI health collars and telehealth vet subscriptions" },
  { label: "🏟 Esports Arena",  value: "An esports arena chain hosting tournaments, managing teams, and streaming globally" },
  { label: "🌊 Ocean Farm",     value: "A vertical ocean farming company growing seaweed and shellfish on offshore rigs" },
  { label: "🔋 Fusion Energy",  value: "A fusion energy startup building compact tokamak reactors for commercial power grids" },
];

const STEPS = [
  { key: "objects", step: "01", label: "Custom Objects",          icon: "◫" },
  { key: "data",    step: "02", label: "Sample Data",             icon: "⊞" },
  { key: "perms",   step: "03", label: "Permission Sets",         icon: "◈" },
  { key: "flows",   step: "04", label: "Flows & Automations",     icon: "⟳" },
  { key: "deploy",  step: "05", label: "Deploy to Org",           icon: "⬆" },
  { key: "lwc",     step: "06", label: "Lightning Web Component", icon: "★" },
  { key: "github",  step: "07", label: "Push to GitHub",          icon: "⊙" },
];

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
    {[0,1,2].map(i => <span key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#00A1E0", display:"inline-block", animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
  </span>
);

function PromptCard({ stepMeta, prompt, delay, copied, onCopy }) {
  return (
    <div className="reveal-item prompt-card" style={{ animationDelay:`${delay}s`, border:"1px solid rgba(255,255,255,0.07)", borderRadius:2, overflow:"hidden", transition:"border-color 0.2s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, color:"#00A1E0", letterSpacing:2, fontFamily:"monospace" }}>{stepMeta.step}</span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", letterSpacing:2, textTransform:"uppercase" }}>{stepMeta.icon} {stepMeta.label}</span>
        </div>
        <button onClick={() => onCopy(stepMeta.key, prompt)} style={{ background: copied===stepMeta.key?"rgba(0,200,100,0.15)":"rgba(0,161,224,0.1)", border:`1px solid ${copied===stepMeta.key?"rgba(0,200,100,0.4)":"rgba(0,161,224,0.3)"}`, color: copied===stepMeta.key?"#00c864":"#00A1E0", fontSize:9, letterSpacing:2, padding:"4px 10px", cursor:"pointer", borderRadius:2, fontFamily:"monospace", textTransform:"uppercase", transition:"all 0.2s", whiteSpace:"nowrap" }}>
          {copied===stepMeta.key ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <div style={{ padding:"14px 16px", fontSize:12, lineHeight:1.65, color:"rgba(255,255,255,0.65)", fontFamily:"monospace", background:"rgba(0,0,0,0.2)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
        {prompt}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function DemoGenerator() {
  const [mode, setMode]           = useState("fictional"); // "fictional" | "real"
  const [scenario, setScenario]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [revealed, setRevealed]   = useState(false);
  const [history, setHistory]     = useState([]);
  const [copied, setCopied]       = useState(null);
  const [activeTab, setActiveTab] = useState("brief");
  const [exported, setExported]   = useState(false);
  // fictional inputs
  const [ideaInput, setIdeaInput] = useState("");
  // real company inputs
  const [realName, setRealName]     = useState("");
  const [realWebsite, setRealWebsite] = useState("");
  const [realStory, setRealStory]   = useState("");

  const handleCopy = (key, text) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const handleExport = () => {
    if (!scenario) return;
    const lines = [
      `DEMO BRIEFING — ${scenario.company}`, `${"=".repeat(60)}`, ``,
      `INDUSTRY: ${scenario.industry}`, `TAGLINE: ${scenario.tagline}`, ``,
      `THE CHALLENGE`, `${"-".repeat(40)}`, scenario.challenge, ``,
      `WHAT WE'RE BUILDING`, `${"-".repeat(40)}`, scenario.salesforceGoal, ``,
      `CUSTOM OBJECTS`, `${"-".repeat(40)}`, ...(scenario.objects||[]).map(o=>`  • ${o}`), ``,
      `LWC WOW MOMENT`, `${"-".repeat(40)}`, scenario.wow, ``,
      `${"=".repeat(60)}`, `CURSOR PROMPTS`, `${"=".repeat(60)}`, ``,
      ...STEPS.flatMap(s=>[`STEP ${s.step} — ${s.label.toUpperCase()}`,`${"-".repeat(40)}`,scenario.prompts?.[s.key]||"",``]),
      `${"=".repeat(60)}`, `STEP 00 — PROJECT MANIFEST`, `${"-".repeat(40)}`,
      ...CLI_STEPS.map(c=>`  ${c.cmd}   # ${c.desc}`),
    ];
    try {
      const ta = document.createElement("textarea");
      ta.value = lines.join("\n");
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    } catch {}
    window.open("https://docs.google.com/document/create","_blank");
    setExported(true); setTimeout(() => setExported(false), 3500);
  };

  const generateScenario = async () => {
    setLoading(true); setError(null); setRevealed(false); setScenario(null); setActiveTab("brief");
    try {
      let systemPrompt, userMsg;
      if (mode === "fictional") {
        systemPrompt = FICTIONAL_SYSTEM;
        userMsg = ideaInput.trim()
          ? `Generate a demo scenario based on this idea: "${ideaInput.trim()}". Make it specific, memorable, cinematic. Avoid recent ones: ${history.slice(-3).join(", ")||"none yet"}.`
          : `Generate a surprising, creative demo scenario. Go bold — futuristic, niche, unexpected. Avoid: ${history.slice(-3).join(", ")||"none yet"}.`;
      } else {
        if (!realName.trim()) throw new Error("Please enter a company name.");
        systemPrompt = REAL_SYSTEM;
        userMsg = `Company: ${realName.trim()}
Website: ${realWebsite.trim() || "not provided"}
Demo Story / Context:
${realStory.trim() || "No additional context provided — use your knowledge of this company and industry to infer realistic use cases."}

Generate a true-to-life Salesforce Service Cloud demo scenario for this company.`;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
          ...(mode === "real" && realWebsite.trim() ? {
            tools: [{ type: "web_search_20250305", name: "web_search" }]
          } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `API error ${response.status}`);

      // extract text — web search responses may include tool_use/tool_result blocks
      // and the final text block may have a preamble before the JSON
      const textBlock = (data.content || []).filter(b => b.type === "text").pop();
      const text = textBlock?.text || "";
      // strip markdown fences then find the first { ... } JSON object in the string
      const stripped = text.replace(/```json|```/g, "");
      const match = stripped.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found in response. Try generating again.");
      const parsed = JSON.parse(match[0]);
      setScenario(parsed);
      setHistory(prev => [...prev.slice(-5), parsed.company]);
      setTimeout(() => setRevealed(true), 100);
    } catch (err) {
      setError(err.message || "Failed to generate scenario.");
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = mode === "fictional" || realName.trim().length > 0;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#0a0e1a", backgroundImage:`radial-gradient(ellipse at 20% 50%, rgba(0,161,224,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,161,224,0.05) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.015) 39px, rgba(255,255,255,0.015) 40px)`, fontFamily:"monospace", display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 20px", color:"#e8eaf6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes borderPulse { 0%,100%{border-color:rgba(0,161,224,0.4);box-shadow:0 0 20px rgba(0,161,224,0.1)}50%{border-color:rgba(0,161,224,0.8);box-shadow:0 0 40px rgba(0,161,224,0.2)} }
        @keyframes btnGlow { 0%,100%{box-shadow:0 0 20px rgba(0,161,224,0.4),inset 0 0 20px rgba(0,161,224,0.05)}50%{box-shadow:0 0 40px rgba(0,161,224,0.7),inset 0 0 30px rgba(0,161,224,0.1)} }
        .reveal-item { opacity:0; animation:fadeSlideUp 0.5s ease forwards; }
        .btn-generate:hover:not(:disabled) { background:rgba(0,161,224,0.2)!important; transform:scale(1.02); }
        .btn-generate:active:not(:disabled) { transform:scale(0.98); }
        .object-tag:hover { background:rgba(0,161,224,0.3)!important; border-color:rgba(0,161,224,0.6)!important; }
        .prompt-card:hover { border-color:rgba(0,161,224,0.25)!important; }
        .cli-row:hover { background:rgba(0,161,224,0.06)!important; }
        .quick-chip:hover { background:rgba(0,161,224,0.18)!important; border-color:rgba(0,161,224,0.5)!important; color:#fff!important; transform:translateY(-1px); }
        .idea-input:focus, .real-input:focus { border-color:rgba(0,161,224,0.6)!important; box-shadow:0 0 0 2px rgba(0,161,224,0.1)!important; outline:none!important; }
        .mode-btn { transition: all 0.2s; cursor: pointer; }
        .mode-btn:hover { opacity: 0.9; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:11, letterSpacing:4, color:"#00A1E0", marginBottom:8, textTransform:"uppercase" }}>◈ Vibe Coding Workshop ◈</div>
        <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"clamp(48px,8vw,80px)", letterSpacing:4, margin:0, lineHeight:1, color:"#ffffff", textShadow:"0 0 40px rgba(0,161,224,0.5)" }}>DEMO BRIEFING</h1>
        <div style={{ fontSize:11, letterSpacing:3, color:"rgba(255,255,255,0.3)", marginTop:8, textTransform:"uppercase" }}>Salesforce · Live Build · Scenario Generator</div>
      </div>

      {/* ── MODE TOGGLE ── */}
      <div style={{ width:"100%", maxWidth:780, marginBottom:28 }}>
        <div style={{ display:"flex", gap:0, border:"1px solid rgba(0,161,224,0.3)", borderRadius:2, overflow:"hidden", width:"fit-content" }}>
          {[
            { id:"fictional", icon:"✦", label:"Fictional Scenario",    sub:"Bold, creative, invented companies" },
            { id:"real",      icon:"◎", label:"Real Company Use Case",  sub:"True-to-customer demo from actual data" },
          ].map((m, i) => (
            <button key={m.id} className="mode-btn" onClick={() => { setMode(m.id); setScenario(null); setError(null); setRevealed(false); }} style={{ background: mode===m.id ? "rgba(0,161,224,0.15)" : "rgba(0,0,0,0.3)", border:"none", borderLeft: i > 0 ? "1px solid rgba(0,161,224,0.3)" : "none", color: mode===m.id ? "#fff" : "rgba(255,255,255,0.4)", padding:"14px 28px", fontFamily:"monospace", textAlign:"left", display:"flex", flexDirection:"column", gap:3, minWidth:220 }}>
              <span style={{ fontSize:12, letterSpacing:2, textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color: mode===m.id ? "#00A1E0" : "rgba(255,255,255,0.3)" }}>{m.icon}</span>
                {m.label}
              </span>
              <span style={{ fontSize:10, color: mode===m.id ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)", letterSpacing:1 }}>{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUTS ── */}
      <div style={{ width:"100%", maxWidth:780, marginBottom:20 }}>
        {mode === "fictional" ? (
          <>
            <div style={{ fontSize:9, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:10 }}>// Scenario Idea — Optional</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
              {QUICK_IDEAS.map(q => (
                <button key={q.label} className="quick-chip" onClick={() => setIdeaInput(ideaInput===q.value?"":q.value)} style={{ background: ideaInput===q.value?"rgba(0,161,224,0.2)":"rgba(255,255,255,0.04)", border:`1px solid ${ideaInput===q.value?"rgba(0,161,224,0.6)":"rgba(255,255,255,0.1)"}`, color: ideaInput===q.value?"#fff":"rgba(255,255,255,0.5)", fontSize:11, padding:"5px 12px", borderRadius:20, cursor:"pointer", fontFamily:"monospace", transition:"all 0.15s", letterSpacing:"0.5px" }}>
                  {q.label}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input className="idea-input" type="text" value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&canGenerate&&generateScenario()} placeholder="Or type your own — e.g. 'underwater hotel chain' or 'AI-powered race team'" style={{ flex:1, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:2, color:"#fff", fontFamily:"monospace", fontSize:12, padding:"10px 16px", letterSpacing:"0.5px", transition:"border-color 0.2s, box-shadow 0.2s" }} />
              {ideaInput && <button onClick={()=>setIdeaInput("")} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.4)", fontSize:12, padding:"0 14px", borderRadius:2, cursor:"pointer", fontFamily:"monospace" }}>✕</button>}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:9, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:14 }}>// Real Company Details</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {/* Company Name + Website row */}
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Company Name <span style={{ color:"#ff6b6b" }}>*</span></label>
                  <input className="real-input" type="text" value={realName} onChange={e=>setRealName(e.target.value)} placeholder="e.g. Comcast, T-Mobile, Sony" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:2, color:"#fff", fontFamily:"monospace", fontSize:12, padding:"10px 14px", transition:"border-color 0.2s, box-shadow 0.2s" }} />
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
                  <label style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Company Website</label>
                  <input className="real-input" type="text" value={realWebsite} onChange={e=>setRealWebsite(e.target.value)} placeholder="e.g. https://www.comcast.com" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:2, color:"#fff", fontFamily:"monospace", fontSize:12, padding:"10px 14px", transition:"border-color 0.2s, box-shadow 0.2s" }} />
                </div>
              </div>
              {/* Demo Story */}
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <label style={{ fontSize:9, letterSpacing:2, color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Demo Story / Discovery Notes</label>
                <textarea className="real-input" value={realStory} onChange={e=>setRealStory(e.target.value)} rows={5} placeholder={`Paste in discovery notes, a demo story, pain points, or any context about what this customer needs.\n\nExample:\n"The contact center handles 2M calls/month. Agents lack context when customers call about billing issues. The champion wants a single-pane view of account, recent cases, and next best action. Key stakeholder is the VP of CX Operations."`} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:2, color:"#fff", fontFamily:"monospace", fontSize:12, padding:"12px 14px", lineHeight:1.6, resize:"vertical", transition:"border-color 0.2s, box-shadow 0.2s" }} />
              </div>
              {realWebsite.trim() && (
                <div style={{ fontSize:10, color:"rgba(0,161,224,0.5)", letterSpacing:1, display:"flex", alignItems:"center", gap:6 }}>
                  <span>⌕</span> Will search the web for additional context about this company
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── CLI MANIFEST ── */}
      <div style={{ width:"100%", maxWidth:780, marginBottom:28, border:"1px solid rgba(0,161,224,0.2)", borderRadius:2, overflow:"hidden", background:"rgba(0,0,0,0.25)" }}>
        <div style={{ padding:"10px 20px", background:"rgba(0,161,224,0.08)", borderBottom:"1px solid rgba(0,161,224,0.15)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:10, color:"#00A1E0", letterSpacing:3, textTransform:"uppercase" }}>// Step 00 — Project Manifest</span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:1 }}>Run before opening Cursor</span>
        </div>
        {CLI_STEPS.map((row, i) => (
          <div key={i} className="cli-row" onClick={() => handleCopy(`cli-${i}`, row.cmd)} style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 20px", cursor:"pointer", transition:"background 0.15s", borderBottom: i < CLI_STEPS.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize:10, color:"#00A1E0", minWidth:14, opacity:0.5 }}>{i+1}</span>
            <code style={{ fontSize:12, color:"#7ee8a2", flex:1, fontFamily:"monospace" }}>{row.cmd}</code>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.5px", minWidth:200, textAlign:"right" }}>{row.desc}</span>
            <span style={{ fontSize:9, color: copied===`cli-${i}`?"#00c864":"rgba(0,161,224,0.4)", letterSpacing:2, minWidth:48, textAlign:"right", textTransform:"uppercase" }}>{copied===`cli-${i}`?"✓":"copy"}</span>
          </div>
        ))}
        <div style={{ padding:"8px 20px 10px", borderTop:"1px solid rgba(255,255,255,0.04)", fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:1 }}>
          ↳ Adjust <span style={{ color:"rgba(0,161,224,0.6)" }}>--name</span> to match your scenario. Click any row to copy.
        </div>
      </div>

      {/* ── RESULT CARD ── */}
      <div style={{ width:"100%", maxWidth:780, minHeight:380, border:"1px solid rgba(0,161,224,0.3)", borderRadius:2, background:"rgba(255,255,255,0.02)", position:"relative", overflow:"hidden", animation:"borderPulse 3s ease infinite" }}>
        {["top-left","top-right","bottom-left","bottom-right"].map(pos => (
          <div key={pos} style={{ position:"absolute", width:16, height:16, borderColor:"#00A1E0", borderStyle:"solid", borderWidth: pos==="top-left"?"2px 0 0 2px":pos==="top-right"?"2px 2px 0 0":pos==="bottom-left"?"0 0 2px 2px":"0 2px 2px 0", top:pos.includes("top")?0:"auto", bottom:pos.includes("bottom")?0:"auto", left:pos.includes("left")?0:"auto", right:pos.includes("right")?0:"auto" }} />
        ))}

        <div style={{ padding:"12px 24px", borderBottom:"1px solid rgba(0,161,224,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(0,161,224,0.05)" }}>
          <span style={{ fontSize:10, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase" }}>
            {scenario ? (mode==="real" ? "// CUSTOMER BRIEF LOADED" : "// MISSION BRIEF LOADED") : "// AWAITING BRIEF"}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {mode==="real" && scenario && <span style={{ fontSize:9, letterSpacing:2, color:"rgba(255,165,0,0.7)", textTransform:"uppercase", border:"1px solid rgba(255,165,0,0.3)", padding:"2px 8px", borderRadius:2 }}>◎ REAL CO.</span>}
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:1 }}>{history.length>0?`SCENARIO #${history.length}`:"—"}</span>
          </div>
        </div>

        {scenario && revealed && (
          <div style={{ display:"flex", borderBottom:"1px solid rgba(0,161,224,0.15)", background:"rgba(0,0,0,0.2)", justifyContent:"space-between", alignItems:"center", paddingRight:16 }}>
            <div style={{ display:"flex" }}>
              {[{id:"brief",label:"Mission Brief"},{id:"prompts",label:"Cursor Prompts"}].map(tab => (
                <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ background:"none", border:"none", borderBottom: activeTab===tab.id?"2px solid #00A1E0":"2px solid transparent", color: activeTab===tab.id?"#ffffff":"rgba(255,255,255,0.35)", fontSize:10, letterSpacing:3, textTransform:"uppercase", padding:"12px 24px", cursor:"pointer", transition:"all 0.2s", fontFamily:"monospace", marginBottom:-1 }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={handleExport} style={{ background: exported?"rgba(0,200,100,0.12)":"rgba(0,161,224,0.08)", border:`1px solid ${exported?"rgba(0,200,100,0.4)":"rgba(0,161,224,0.3)"}`, color: exported?"#00c864":"#00A1E0", fontSize:9, letterSpacing:2, padding:"5px 14px", cursor:"pointer", borderRadius:2, fontFamily:"monospace", textTransform:"uppercase", transition:"all 0.2s", whiteSpace:"nowrap" }}>
              {exported?"✓ COPIED — PASTE IN DOC":"⬆ EXPORT TO GOOGLE DOCS"}
            </button>
          </div>
        )}

        <div style={{ padding:"32px 32px 40px" }}>
          {!scenario && !loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260, gap:16, opacity:0.4 }}>
              <div style={{ fontSize:40 }}>{mode==="real"?"◎":"⌗"}</div>
              <div style={{ fontSize:12, letterSpacing:3, textTransform:"uppercase", color:"rgba(255,255,255,0.5)", textAlign:"center" }}>
                {mode==="real" ? "Enter a company above, then generate your customer brief" : "Pick a quick idea, type your own, or go fully random"}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:260, gap:20 }}>
              <div style={{ fontSize:11, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase" }}>Generating scenario</div>
              <LoadingDots />
              <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.2)", textTransform:"uppercase" }}>
                {mode==="real" ? `Researching ${realName}...` : ideaInput ? `Building: "${ideaInput.slice(0,40)}${ideaInput.length>40?"…":""}"` : "Scanning the universe for inspiration..."}
              </div>
            </div>
          )}

          {error && <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:260, color:"#ff4444", fontSize:12, letterSpacing:1, textAlign:"center" }}>⚠ {error}</div>}

          {scenario && revealed && activeTab==="brief" && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              <div className="reveal-item" style={{ animationDelay:"0s", display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ fontSize:40, lineHeight:1, marginTop:4 }}>{scenario.emoji}</div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:4 }}>{scenario.industry}</div>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:36, letterSpacing:2, color:"#ffffff", lineHeight:1 }}>{scenario.company}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:4 }}>{scenario.tagline}</div>
                </div>
              </div>
              <div className="reveal-item" style={{ animationDelay:"0.1s", height:1, background:"linear-gradient(90deg, rgba(0,161,224,0.4), transparent)" }} />
              <div className="reveal-item" style={{ animationDelay:"0.15s" }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:8 }}>The Challenge</div>
                <div style={{ fontSize:14, lineHeight:1.6, color:"rgba(255,255,255,0.8)", fontFamily:"monospace" }}>{scenario.challenge}</div>
              </div>
              <div className="reveal-item" style={{ animationDelay:"0.2s", background:"rgba(0,161,224,0.07)", border:"1px solid rgba(0,161,224,0.2)", borderLeft:"3px solid #00A1E0", padding:16, borderRadius:1 }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:8 }}>What We're Building</div>
                <div style={{ fontSize:13, lineHeight:1.6, color:"#ffffff", fontFamily:"monospace" }}>{scenario.salesforceGoal}</div>
              </div>
              <div className="reveal-item" style={{ animationDelay:"0.25s" }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#00A1E0", textTransform:"uppercase", marginBottom:10 }}>Custom Objects We'll Create</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {scenario.objects?.map((obj,i) => (
                    <span key={i} className="object-tag" style={{ padding:"5px 12px", border:"1px solid rgba(0,161,224,0.3)", borderRadius:2, fontSize:11, letterSpacing:"1.5px", color:"#00A1E0", background:"rgba(0,161,224,0.06)", cursor:"default", transition:"all 0.2s", textTransform:"uppercase" }}>{obj}</span>
                  ))}
                </div>
              </div>
              <div className="reveal-item" style={{ animationDelay:"0.3s", display:"flex", gap:12, alignItems:"flex-start", paddingTop:4 }}>
                <div style={{ color:"#FFD700", fontSize:16, marginTop:1 }}>★</div>
                <div>
                  <div style={{ fontSize:9, letterSpacing:3, color:"#FFD700", textTransform:"uppercase", marginBottom:6 }}>The LWC Wow Moment</div>
                  <div style={{ fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,0.75)", fontFamily:"monospace" }}>{scenario.wow}</div>
                </div>
              </div>
              <div className="reveal-item" style={{ animationDelay:"0.35s", textAlign:"center", paddingTop:8 }}>
                <button onClick={()=>setActiveTab("prompts")} style={{ background:"none", border:"1px solid rgba(0,161,224,0.25)", color:"rgba(0,161,224,0.7)", fontSize:10, letterSpacing:2, padding:"8px 20px", cursor:"pointer", borderRadius:2, textTransform:"uppercase", fontFamily:"monospace", transition:"all 0.2s" }}>
                  View Cursor Prompts →
                </button>
              </div>
            </div>
          )}

          {scenario && revealed && activeTab==="prompts" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="reveal-item" style={{ animationDelay:"0s", fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:4 }}>
                Copy each prompt into Cursor at the matching workshop step
              </div>
              {STEPS.map((step,i) => (
                <PromptCard key={step.key} stepMeta={step} prompt={scenario.prompts?.[step.key]||"Prompt not available"} delay={i*0.05} copied={copied} onCopy={handleCopy} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── GENERATE BUTTON ── */}
      <div style={{ marginTop:36, display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <button className="btn-generate" onClick={generateScenario} disabled={loading||!canGenerate} style={{ background: loading||!canGenerate?"rgba(0,161,224,0.05)":"rgba(0,161,224,0.1)", border:`1px solid ${canGenerate?"rgba(0,161,224,0.6)":"rgba(0,161,224,0.2)"}`, color: loading||!canGenerate?"rgba(255,255,255,0.3)":"#ffffff", fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:5, padding:"16px 48px", cursor: loading||!canGenerate?"not-allowed":"pointer", borderRadius:2, transition:"all 0.2s ease", animation: !loading&&!scenario&&canGenerate?"btnGlow 2s ease infinite":"none", textTransform:"uppercase" }}>
          {loading ? "GENERATING..." : scenario ? "↺  NEW SCENARIO" : mode==="real" ? "◎  BUILD CUSTOMER BRIEF" : ideaInput ? "⊕  BUILD THIS SCENARIO" : "⊕  GENERATE RANDOM"}
        </button>
        {mode==="real"&&!realName.trim()&&!loading&&(
          <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,100,100,0.5)", textTransform:"uppercase" }}>↑ Enter a company name to enable</div>
        )}
        {history.length>0&&(
          <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.2)", textTransform:"uppercase" }}>
            {history.length} scenario{history.length!==1?"s":""} generated this session
          </div>
        )}
      </div>
    </div>
  );
}
