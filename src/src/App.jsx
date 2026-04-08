import { useState, useMemo } from "react";

const pillars = {
  "AI Governance": ["#AIGovernance", "#ResponsibleAI", "#AIRisk"],
  "Technology Risk": ["#TechnologyRisk", "#RiskManagement", "#Controls"],
  "Strategy & Transformation": ["#Transformation", "#Strategy", "#Execution"],
};

export default function App() {
  const [pillar, setPillar] = useState("AI Governance");
  const [topic, setTopic] = useState("Making governance practical");
  const [achievement, setAchievement] = useState("");
  const [lesson, setLesson] = useState("Governance works when embedded in delivery");
  const [cta, setCta] = useState("How are you approaching this?");
  const [version, setVersion] = useState(0);

  const generatePost = () => {
    return `One thing I’ve been thinking about in ${pillar}:

${topic}

From my experience: ${achievement || "working across teams and functions"}

The key takeaway:
${lesson}

${cta}

${pillars[pillar].join(" ")}`;
  };

  const post = useMemo(generatePost, [pillar, topic, achievement, lesson, cta, version]);

  return (
    <div className="container">
      <h1>LinkedIn Content Generator</h1>

      <div className="form">
        <label>Pillar</label>
        <select value={pillar} onChange={(e) => setPillar(e.target.value)}>
          {Object.keys(pillars).map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <label>Topic</label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} />

        <label>Achievement (optional)</label>
        <textarea value={achievement} onChange={(e) => setAchievement(e.target.value)} />

        <label>Lesson</label>
        <textarea value={lesson} onChange={(e) => setLesson(e.target.value)} />

        <label>CTA</label>
        <input value={cta} onChange={(e) => setCta(e.target.value)} />

        <button onClick={() => setVersion((v) => v + 1)}>Regenerate</button>
      </div>

      <div className="output">
        <h2>Generated Post</h2>
        <pre>{post}</pre>
        <button onClick={() => navigator.clipboard.writeText(post)}>Copy</button>
      </div>
    </div>
  );
}
