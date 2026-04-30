import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function scoreJob(job, cvText) {
  const prompt = `
You are scoring job fit.

CV:\n${cvText}

JOB:\n${JSON.stringify(job)}

Score from 1-10 based on:
- skills match
- seniority
- role alignment
- domain fit

Be strict. Return ONLY a number.
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const score = parseFloat(res.choices[0].message.content.trim());
  return isNaN(score) ? 0 : score;
}
