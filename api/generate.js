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
You are a professional LinkedIn content writer.

Write in FIRST PERSON.
Use phrasing like:
- "I came across..."
- "Here's what stood out to me..."
- "Here's where I think the opportunity lies..."

Generate:

1. Three LinkedIn post drafts:
   - story-led
   - insight-led
   - concise authority-style

2. Three hook options

3. One short 30-45 second talking-video script

4. Suggestions:
   - stronger angles to explore
   - ways to improve the post
   - other useful content directions

Requirements:
- human and natural
- not templated
- practical
- grounded in the source
- do not sound like marketing fluff
- do not speak like a company brand account
- avoid making things up beyond the source

Additional instructions:
${instructions || "None"}

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
