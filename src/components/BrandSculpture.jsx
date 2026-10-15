import { useEffect, useRef, useState } from "react";
import "./BrandSculpture.css";

export default function BrandSculpture() {
  const stage = useRef(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.25 });
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const resetTilt = () => {
    stage.current?.style.setProperty("--tilt-x", "0deg");
    stage.current?.style.setProperty("--tilt-y", "0deg");
  };
  return (
    <section ref={stage} className={`brand-stage ${visible ? "is-visible" : ""} ${paused ? "is-paused" : ""}`} aria-label="Animated three-dimensional Limitless-Deal Hub wordmark"
      onPointerMove={(event) => {
        if (paused || event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        stage.current.style.setProperty("--tilt-y", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}deg`);
        stage.current.style.setProperty("--tilt-x", `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 10}deg`);
      }} onPointerLeave={resetTilt}>
      <div className="brand-stage-top"><span>THE LIMITLESS SIGNATURE</span><span>IDENTITY / IN MOTION</span></div>
      <div className="brand-grid" aria-hidden="true" />
      <div className="brand-aura" aria-hidden="true" />
      <div className="brand-perspective" aria-hidden="true">
        <div className="brand-tilt"><div className="brand-float" key={replay}>
          {["Limitless-", "Deal Hub", "."].map((word, index) => (
            <span className={`brand-word brand-word-${index}`} style={{ "--word": index }} key={word}>
              {Array.from({ length: 14 }, (_, depth) => <span className="brand-depth" style={{ "--depth": depth }} key={depth}>{word}</span>)}
              <span className="brand-face">{word}</span>
            </span>
          ))}
        </div></div>
        <div className="brand-shadow" />
        <div className="brand-orbit" />
      </div>
      <div className="brand-stage-bottom">
        <div><p>BUILT TO STAND OUT.</p><span>Perspective changes everything.</span></div>
        <div className="brand-controls">
          <button type="button" onClick={() => { setReplay((n) => n + 1); setPaused(false); resetTilt(); }}>Replay reveal ↻</button>
          <button type="button" aria-pressed={paused} onClick={() => { setPaused(!paused); resetTilt(); }}>{paused ? "Resume motion" : "Pause motion"}</button>
        </div>
      </div>
    </section>
  );
}
