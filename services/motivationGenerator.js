// services/motivationGenerator.js (CommonJS)
// Returns ONLY a single text string >= 500 chars (no fluff, one paragraph)

const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const SYSTEM_PROMPT_PATH = path.join(__dirname, "motivation.system.txt");

const readSystemPrompt = () => fs.readFileSync(SYSTEM_PROMPT_PATH, "utf8");

const clean = (s = "") =>
  String(s || "")
    .replace(/\s+/g, " ")
    .trim();

const clampRange = (s, { min = 500, max = 650 } = {}) => {
  const text = clean(s);

  if (text.length > max) {
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return clean(lastSpace > 200 ? cut.slice(0, lastSpace) : cut);
  }

  return text;
};

const motivationGenerator = async ({
  tone = "tough-love",
  context = "general",
  audience = "general",
  optional = {},
  model = "llama-3.1-8b-instant",
  minChars = 500,
  maxChars = 650,
} = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY in .env");

  const groq = new Groq({ apiKey });

  const systemPrompt = readSystemPrompt();

  const payload = {
    tone: String(tone),
    context: String(context),
    audience: String(audience),
    optional: {
      goal: optional?.goal ? String(optional.goal) : "",
      blocker: optional?.blocker ? String(optional.blocker) : "",
      timebox_minutes:
        optional?.timebox_minutes === undefined ||
        optional?.timebox_minutes === null
          ? 25
          : Number(optional.timebox_minutes),
      deadline: optional?.deadline ? String(optional.deadline) : "",
      today_focus: optional?.today_focus ? String(optional.today_focus) : "",
    },
  };

  const userPrompt =
    "Write ONE motivational message only.\n" +
    `Hard rules:\n` +
    `- Between ${minChars} and ${maxChars} characters (inclusive)\n` +
    `- One paragraph, no line breaks\n` +
    `- No JSON, no quotes, no headings, no emojis\n` +
    `- Intense accountability voice\n` +
    `- Every sentence must push action\n\n` +
    JSON.stringify(payload);

  const tryOnce = async () => {
    const res = await groq.chat.completions.create({
      model,
      temperature: 0.85,
      top_p: 0.9,
      max_tokens: 450, // enough to exceed 500 chars
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return clean(res?.choices?.[0]?.message?.content || "");
  };

  // Try up to 3 times to satisfy minChars without adding fluff client-side
  for (let i = 0; i < 3; i++) {
    const text = await tryOnce();
    if (text.length >= minChars)
      return clampRange(text, { min: minChars, max: maxChars });
  }

  // Last resort: return whatever we got (still clean), but this should rarely happen
  const fallback = await tryOnce();
  return clampRange(fallback, { min: minChars, max: maxChars });
};

module.exports = motivationGenerator;
