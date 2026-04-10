import React, { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    if (!file) {
      alert("Upload a file first");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instructions", instructions);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setOutput(data.result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI LinkedIn Content Engine</h1>

      <div className="form">
        <label>Upload source file</label>
        <input
          type="file"
          accept=".txt,.pdf,.docx,.xlsx"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />

        <label>Optional guidance</label>
        <textarea
          rows={5}
          placeholder="Example: Write in first person. Make it sharper and more personal. Focus on the opportunity, not just the problem."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <button onClick={generateContent}>
          {loading ? "Generating..." : "Generate Content"}
        </button>
      </div>

      <div className="output">
        <h2>Output</h2>
        <pre>{output}</pre>
      </div>
    </div>
  );
}
