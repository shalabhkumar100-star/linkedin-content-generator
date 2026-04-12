import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";

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
      // slight delay helps browser handle sequential downloads
      // eslint-disable-next-line no-await-in-loop
      await downloadSlide(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  };

  const getSlideClass = (style) => {
    switch (style) {
      case "quote":
        return "slide quote";
      case "cta":
        return "slide cta";
      case "list":
        return "slide list";
      case "title":
        return "slide title";
      default:
        return "slide insight";
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

      {data?.error && (
        <div className="output">
          <h2>Error</h2>
          <pre>{data.error}</pre>
        </div>
      )}

      {data?.posts && (
        <>
          <div className="output">
            <h2>Posts</h2>
            {data.posts.map((post, idx) => (
              <div key={idx} className="block">
                <h3>{post.type}</h3>
                <pre>{post.text}</pre>
              </div>
            ))}
          </div>

          <div className="output">
            <h2>Hook Suggestions</h2>
            <ul>
              {data.hooks?.map((hook, idx) => (
                <li key={idx}>{hook}</li>
              ))}
            </ul>
          </div>

          <div className="output">
            <h2>Talking Video Script</h2>
            <pre>{data.video_script}</pre>
          </div>

          <div className="output">
            <h2>Suggestions</h2>
            <ul>
              {data.suggestions?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="output">
            <div className="carousel-header">
              <h2>Carousel Slides</h2>
              <button onClick={downloadAllSlides}>Download All Slides</button>
            </div>

            <div className="slides-wrap">
              {data.carousel_slides?.map((slide, idx) => (
                <div key={idx} className="slide-card-wrap">
                  <div
                    ref={(el) => {
                      slideRefs.current[idx] = el;
                    }}
                    className={getSlideClass(slide.style)}
                  >
                    <div className="slide-inner">
                      <div className="slide-kicker">LinkedIn Carousel</div>
                      <h3>{slide.title}</h3>
                      <p>{slide.body}</p>
                    </div>
                  </div>

                  <button onClick={() => downloadSlide(idx)}>
                    Download Slide {idx + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
