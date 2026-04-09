import React, { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    if (!file) {
      alert("Upload a .txt file first");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      let text = "";

      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else {
        text = "Unsupported file type for now. Please upload a .txt file.";
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ source: text })
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
          accept=".txt"
          onChange={(e) => setFile(e.target.files[0] || null)}
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
