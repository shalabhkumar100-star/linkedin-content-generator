import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function extractTextFromFile(file) {
  const filePath = file.filepath;
  const ext = path.extname(file.originalFilename || "").toLowerCase();

  if (ext === ".txt") {
    return await fs.readFile(filePath, "utf8");
  }

  if (ext === ".pdf") {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  if (ext === ".xlsx") {
    const workbook = XLSX.readFile(filePath);
    let combined = "";

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      combined += `Sheet: ${sheetName}\n`;
      combined += rows.map((row) => row.join(" | ")).join("\n");
      combined += "\n\n";
    });

    return combined;
  }

  throw new Error("Unsupported file type. Use .txt, .pdf, .docx, or .xlsx");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const uploaded = files.file;

    if (!uploaded) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const instructions = Array.isArray(fields.instructions)
      ? fields.instructions[0]
      : fields.instructions || "";

    const source = await extractTextFromFile(file);

    if (!source || !source.trim()) {
      return res.status(400).json({ error: "Could not extract usable text from file" });
    }

    const prompt = `
You are a professional LinkedIn content strategist and carousel writer.

Read the source material and return VALID JSON only.

Write in FIRST PERSON.
Use natural phrasing like:
- "I came across..."
- "What stood out to me was..."
- "Here's where I think the opportunity lies..."

Return a JSON object with this exact shape:
{
  "posts": [
    { "type": "story-led", "text": "..." },
    { "type": "insight-led", "text": "..." },
    { "type": "authority-style", "text": "..." }
  ],
  "hooks": ["...", "...", "..."],
  "video_script": "...",
  "suggestions": ["...", "...", "..."],
  "carousel_slides": [
    {
      "title": "...",
      "body": "...",
      "style": "title|quote|insight|list|cta"
    }
  ]
}

Rules:
- Give exactly 3 hooks
- Give 3 to 5 carousel slides
- Carousel slides should be concise and visually ready
- Make the carousel feel lift-and-shift ready for posting
- Use the source material directly and avoid generic filler
- Do not use markdown anywhere
- Suggestions should be practical improvements or alternate angles
- Vary the carousel styles sensibly across the slides
- Output valid JSON only

Additional instructions:
${instructions || "None"}

Source material:
${source}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
    });

    const raw = response.choices?.[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(raw);
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({
        error: "Model returned invalid JSON",
        raw,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Generation failed",
    });
  }
}
