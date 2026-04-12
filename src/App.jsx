import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";

function formatBoldText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderParagraphs(text) {
  return text.split("\n\n").map((para, idx) => (
    <p key={idx}>{formatBoldText(para)}</p>
  ));
}

export default function App() {
  const [file, setFile] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const slideRefs = useRef([]);

  const generateContent = async () => {
    if (!file) {
      alert("Upload a file first");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("instructions", instructions);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Request failed");
      }

      setData(result);
    } catch (error) {
      setData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const downloadSlide = async (index) => {
    const node = slideRefs.current[index];
    if (!node) return;

    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `carousel-slide-${index + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadAllSlides = async () => {
    if (!data?.carousel_slides?.length) return;
    for (let i = 0; i < data.carousel_slides.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await downloadSlide(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  const getSlideClass = (style, idx) => {
    const styles = [
      "slide theme-dark",
      "slide theme-light",
      "slide theme-accent",
      "slide theme-soft",
      "slide theme-contrast",
    ];
    return styles[idx % styles.length];
  };

  return (
    <div className="page">
      <div className="shell">
        <header className="hero">
          <div>
            <div className="eyebrow">Iteration 2</div>
            <h1>AI LinkedIn Content Engine</h1>
            <p className="hero-subtitle">
              Upload a source file, guide the angle, and generate posts plus
              downloadable carousel slides.
            </p>
          </div>
        </header>

        <section className="panel form-panel">
          <div className="panel-header">
            <h2>Generate</h2>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Source file</label>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.xlsx"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
              {file && <div className="helper">Selected: {file.name}</div>}
            </div>

            <div className="field">
              <label>Optional guidance</label>
              <textarea
                rows={5}
                placeholder="Example: Write in first person. Make it sharper, more practical, and focused on the opportunity."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="actions">
            <button className="primary-btn" onClick={generateContent}>
              {loading ? "Generating..." : "Generate Content"}
            </button>
          </div>
        </section>

        {data?.error && (
          <section className="panel">
            <h2>Error</h2>
            <pre className="plain-pre">{data.error}</pre>
          </section>
        )}

        {data?.posts && (
          <>
            <section className="panel">
              <div className="panel-header">
                <h2>Post Drafts</h2>
              </div>

              <div className="cards-grid">
                {data.posts.map((post, idx) => (
                  <article key={idx} className="post-card">
                    <div className="tag">{post.type}</div>
                    <div className="post-body">{renderParagraphs(post.text)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="two-col">
              <div className="panel">
                <div className="panel-header">
                  <h2>Hook Suggestions</h2>
                </div>
                <ul className="clean-list">
                  {data.hooks?.map((hook, idx) => (
                    <li key={idx}>{formatBoldText(hook)}</li>
                  ))}
                </ul>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h2>Suggestions</h2>
                </div>
                <ul className="clean-list">
                  {data.suggestions?.map((item, idx) => (
                    <li key={idx}>{formatBoldText(item)}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Talking Video Script</h2>
              </div>
              <div className="script-box">{renderParagraphs(data.video_script || "")}</div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Carousel Slides</h2>
                <button className="secondary-btn" onClick={downloadAllSlides}>
                  Download All Slides
                </button>
              </div>

              <div className="slides-grid">
                {data.carousel_slides?.map((slide, idx) => (
                  <div key={idx} className="slide-wrap">
                    <div
                      ref={(el) => {
                        slideRefs.current[idx] = el;
                      }}
                      className={getSlideClass(slide.style, idx)}
                    >
                      <div className="slide-inner">
                        <div className="slide-number">0{idx + 1}</div>
                        <div className="slide-content">
                          <h3>{slide.title}</h3>
                          <p>{slide.body}</p>
                        </div>
                      </div>
                    </div>
                    <button className="secondary-btn" onClick={() => downloadSlide(idx)}>
                      Download Slide {idx + 1}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
