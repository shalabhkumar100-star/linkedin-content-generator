import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { source } = req.body;

    if (!source || !source.trim()) {
      return res.status(400).json({ error: "No source text provided" });
    }

    const prompt = `
You are a professional LinkedIn content writer.

Turn the source material into:
1. Three LinkedIn post drafts:
   - story-led
   - insight-led
   - concise authority-style
2. Three hook options
3. One 5-slide carousel outline
4. One short 30-45 second talking-video idea

Requirements:
- natural and human
- not templated
- grounded in the source
- practical and engaging

Source material:
${source}
`;

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    return res.status(200).json({
      result: response.output_text || "No output generated."
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Generation failed"
    });
  }
}
