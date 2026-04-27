"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminPanel from "./AdminPanel";
import { loadContent, DEFAULT_CONTENT, HpContent, FixArticle, TileType, MenuItem } from "@/lib/content";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 → 0
  size: number;
  rotation: number;
  rotSpeed: number;
}

function useSparkleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const isTouch = useRef(false);

  const spawnParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < 3; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 1,
        size: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }, []);

  // Draw a 4-point star
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.4;
      if (i === 0) ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      else ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    isTouch.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => spawnParticles(e.clientX, e.clientY);
    window.addEventListener("mousemove", onMouseMove);

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current = particles.current.filter(p => p.life > 0);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gentle gravity
        p.life -= 0.035;
        p.rotation += p.rotSpeed;

        const alpha = Math.max(0, p.life);
        const hue = 270 + (1 - alpha) * 30; // deep purple → violet
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${hue}, 90%, 70%)`;
        drawStar(ctx, p.x, p.y, p.size * alpha, p.rotation);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spawnParticles]);

  return canvasRef;
}

const TILE_GRID: Record<TileType, { col: string; row: string; titleSize: string }> = {
  wide:  { col:"span 6",  row:"span 3", titleSize:"clamp(1.6rem,3vw,2.8rem)" },
  tall:  { col:"span 4",  row:"span 5", titleSize:"clamp(1.2rem,2.5vw,2rem)" },
  mini2: { col:"span 2",  row:"span 3", titleSize:"clamp(0.8rem,1.5vw,1.1rem)" },
  thin:  { col:"span 8",  row:"span 2", titleSize:"clamp(1rem,2vw,1.6rem)" },
  sq:    { col:"span 4",  row:"span 3", titleSize:"clamp(1.1rem,2vw,1.7rem)" },
  mini:  { col:"span 3",  row:"span 2", titleSize:"clamp(0.75rem,1.3vw,1rem)" },
  med:   { col:"span 6",  row:"span 4", titleSize:"clamp(1.4rem,2.8vw,2.4rem)" },
  strip: { col:"span 12", row:"span 2", titleSize:"clamp(1rem,2vw,1.5rem)" },
};

function FixationsPage({ onBack, tiles }: { onBack: () => void; tiles: FixArticle[] }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, background:"#0a0a0a", overflowY:"auto", animation:"fadeIn 1s ease", WebkitOverflowScrolling:"touch" }}>

      <style>{`
        .fix-tile { position:relative; padding:clamp(18px,3vw,36px); display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; transition:background 0.25s ease; border:1px solid rgba(255,255,255,0.05); box-sizing:border-box; }
        .fix-tile::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:#c0392b; transform:scaleY(0); transform-origin:bottom; transition:transform 0.3s ease; }
        .fix-tile:hover { background:rgba(255,255,255,0.03) !important; }
        .fix-tile:hover::before { transform:scaleY(1); }
        .fix-tile:hover .fix-num { color:rgba(192,57,43,0.12) !important; }
        .fix-tile:hover .fix-arrow { opacity:1 !important; }
        .fix-arrow { opacity:0; transition:opacity 0.25s ease; position:absolute; bottom:16px; right:20px; width:32px; height:32px; border:1px solid rgba(255,255,255,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.6); font-size:13px; }
        .fix-num { position:absolute; bottom:8px; right:16px; font-family:'Anton',sans-serif; font-size:clamp(60px,10vw,120px); color:rgba(255,255,255,0.04); line-height:1; user-select:none; pointer-events:none; transition:color 0.3s ease; }
        @media(max-width:600px){ .fix-grid { grid-template-columns:repeat(4,1fr) !important; } .t-wide,.t-tall,.t-mini2,.t-sq,.t-med { grid-column:span 4 !important; grid-row:span 2 !important; } .t-thin { grid-column:span 4 !important; } .t-mini { grid-column:span 2 !important; } .t-strip { grid-column:span 4 !important; } }
      `}</style>

      {/* Back */}
      <button onClick={onBack} style={{ position:"fixed", top:"20px", left:"20px", zIndex:60, background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontFamily:"'Barlow Condensed',sans-serif", fontSize:"11px", letterSpacing:"0.3em", textTransform:"uppercase", cursor:"pointer", transition:"color 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.35)"}>← BACK</button>

      {/* Hero */}
      <div style={{ padding:"clamp(72px,12vw,130px) clamp(20px,5vw,64px) clamp(36px,5vw,64px)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"10px", letterSpacing:"0.35em", color:"#c0392b", textTransform:"uppercase", marginBottom:"18px" }}>02 — FIXATIONS</div>
        <h1 style={{ margin:0, lineHeight:0.88 }}>
          <span style={{ fontFamily:"'Anton','Impact',sans-serif", fontSize:"clamp(3.5rem,13vw,12rem)", color:"#fff" }}>FIX</span>
          <span style={{ fontFamily:"'Anton','Impact',sans-serif", fontSize:"clamp(3.5rem,13vw,12rem)", color:"transparent", WebkitTextStroke:"1.5px rgba(255,255,255,0.2)" }}>ATIONS</span>
        </h1>
        <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"clamp(12px,1.4vw,15px)", color:"rgba(255,255,255,0.35)", letterSpacing:"0.04em", marginTop:"24px", maxWidth:"320px", lineHeight:1.65 }}>
          The things I can&apos;t stop thinking about. Collected, categorized, still unresolved.
        </p>
      </div>

      {/* Mosaic grid */}
      <div style={{ padding:"0 clamp(48px,6vw,96px)", maxWidth:"1400px", margin:"0 auto", boxSizing:"border-box" }}>
      <div className="fix-grid" style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gridAutoRows:"80px", gap:"2px", background:"#111", padding:"2px" }}>
        {tiles.map((tile) => {
          const g = TILE_GRID[tile.type];
          return (
            <div
              key={tile.id}
              className={`fix-tile t-${tile.type}`}
              style={{
                gridColumn: g.col,
                gridRow: g.row,
                background: tile.accent ? "rgba(192,57,43,0.12)" : "#0a0a0a",
              }}
            >
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"0.6rem", letterSpacing:"0.3em", color:"#c0392b", textTransform:"uppercase", marginBottom:"10px" }}>{tile.category}</div>
                <h2 style={{ margin:0, fontFamily:"'Anton','Impact',sans-serif", fontSize:g.titleSize, color:"#fff", textTransform:"uppercase", letterSpacing:"0.02em", lineHeight:1.05 }}>{tile.title}</h2>
                {tile.body && (
                  <p style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:"0.78rem", color:"rgba(255,255,255,0.4)", marginTop:"10px", lineHeight:1.6, maxWidth:"380px" }}>{tile.body}</p>
                )}
              </div>
              <div className="fix-num">{String(tile.id).padStart(2,"0")}</div>
              <div className="fix-arrow">→</div>
            </div>
          );
        })}
      </div>
      </div>

      <div style={{ height:"60px" }} />
    </div>
  );
}

// ─── FluencyPage ───────────────────────────────────────────────────────────────
function FluencyPage({ fluency, onBack }: { fluency: HpContent["fluency"]; onBack: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#0a0a0a", overflowY: "auto", animation: "fadeIn 1s ease", WebkitOverflowScrolling: "touch" }}>
      <button onClick={onBack} style={{ position: "fixed", top: "20px", left: "20px", zIndex: 60, background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>← BACK</button>

      {/* Hero */}
      <div style={{ padding: "clamp(72px,12vw,130px) clamp(20px,5vw,64px) clamp(36px,5vw,64px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.35em", color: "#c0392b", textTransform: "uppercase", marginBottom: "18px" }}>{fluency.eyebrow}</div>
        <h1 style={{ margin: 0, lineHeight: 0.88 }}>
          <span style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "clamp(3.5rem,13vw,12rem)", color: "#fff" }}>FLU</span>
          <span style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "clamp(3.5rem,13vw,12rem)", color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.2)" }}>ENCY</span>
        </h1>
        <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(12px,1.4vw,15px)", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", marginTop: "24px", maxWidth: "420px", lineHeight: 1.65 }}>{fluency.subtitle}</p>
      </div>

      {/* Language cards */}
      <div style={{ padding: "clamp(40px,6vw,80px) clamp(20px,5vw,64px)" }}>
        <h2 style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "clamp(0.9rem,1.8vw,1.2rem)", color: "rgba(255,255,255,0.25)", letterSpacing: "0.35em", textTransform: "uppercase", margin: "0 0 36px" }}>{fluency.sectionHeading}</h2>
        {fluency.languages.map((lang, i) => (
          <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "28px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "clamp(1.4rem,4vw,2.4rem)", color: "#fff", lineHeight: 1 }}>{lang.name}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>{lang.native}</div>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.25em", color: "#c0392b", textTransform: "uppercase", paddingTop: "6px" }}>{lang.levelLabel}</div>
            </div>
            <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${lang.percent}%`, background: "#c0392b" }} />
            </div>
            {lang.levelText && <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(12px,1.3vw,14px)", color: "rgba(255,255,255,0.28)", marginTop: "12px", lineHeight: 1.65, maxWidth: "520px" }}>{lang.levelText}</p>}
          </div>
        ))}
      </div>

      {/* Pull quote */}
      {(fluency.quote || fluency.attribution) && (
        <div style={{ padding: "clamp(40px,6vw,80px) clamp(20px,5vw,64px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <blockquote style={{ margin: 0, borderLeft: "2px solid #c0392b", paddingLeft: "24px" }}>
            <p style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "clamp(1.1rem,2.8vw,1.9rem)", color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>{fluency.quote}</p>
            <cite style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.25)", fontStyle: "normal" }}>{fluency.attribution}</cite>
          </blockquote>
        </div>
      )}
      <div style={{ height: "80px" }} />
    </div>
  );
}

export default function Gallery3D() {
  const [content, setContent] = useState<HpContent>(DEFAULT_CONTENT);
  const [activeNav, setActiveNav] = useState("");
  const [showContact, setShowContact] = useState(false);
  const [showFixations, setShowFixations] = useState(false);
  const [showFluency, setShowFluency] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwValue, setPwValue] = useState("");
  const [pwShake, setPwShake] = useState(false);
  const canvasRef = useSparkleCanvas();

  useEffect(() => { setContent(loadContent()); }, []);

  const handleNavItem = (item: MenuItem) => {
    setActiveNav(item.label);
    setShowContact(item.target === "contact");
    setShowFixations(item.target === "fixations");
    setShowFluency(item.target === "fluency");
  };

  const handleSecretClick = () => setShowPasswordModal(true);

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwValue === "hasan") {
      setShowPasswordModal(false);
      setPwValue("");
      setShowAdmin(true);
    } else {
      setPwShake(true);
      setPwValue("");
      setTimeout(() => setPwShake(false), 500);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        backgroundImage: "url('/room.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header + Nav */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "60px",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: "clamp(1.5rem, 7vw, 9rem)",
            lineHeight: 0.9,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            userSelect: "none",
            textAlign: "center",
            padding: "0 12px",
          }}
        >
          {(() => {
            const t = content.home.title;
            const gi = t.toUpperCase().indexOf("G");
            if (gi < 0) return <span style={{ pointerEvents: "none" }}>{t}</span>;
            return (
              <>
                <span style={{ pointerEvents: "none" }}>{t.slice(0, gi)}</span>
                <span onClick={handleSecretClick} style={{ cursor: "default", pointerEvents: "all" }}>{t[gi]}</span>
                <span style={{ pointerEvents: "none" }}>{t.slice(gi + 1)}</span>
              </>
            );
          })()}
        </div>

      </div>

      {/* Vertical nav — centered in the page */}
      <nav
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(8px, 2vh, 20px)",
          pointerEvents: "none",
        }}
      >
        {content.home.menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavItem(item)}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
              fontSize: "clamp(28px, 5vw, 56px)",
              letterSpacing: "0.25em",
              fontWeight: 600,
              color: activeNav === item.label ? "#ffffff" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "6px 0",
              transition: "color 0.3s ease, letter-spacing 0.3s ease",
              borderBottom: activeNav === item.label ? "1px solid #CC0000" : "1px solid transparent",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              pointerEvents: "all",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.letterSpacing = "0.35em";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = activeNav === item.label ? "#ffffff" : "rgba(255,255,255,0.4)";
              e.currentTarget.style.letterSpacing = "0.25em";
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>


      {/* Sparkle canvas — desktop only, sits above everything */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          pointerEvents: "none",
        }}
      />

      {/* Fluency page */}
      {showFluency && (
        <FluencyPage fluency={content.fluency} onBack={() => { setShowFluency(false); setActiveNav(""); }} />
      )}

      {/* Fixations page */}
      {showFixations && (
        <FixationsPage tiles={content.fixations} onBack={() => { setShowFixations(false); setActiveNav(""); }} />
      )}

      {/* Contact overlay */}
      {showContact && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "32px", animation: "fadeIn 1.4s ease" }}>
          <a
            href={`mailto:${content.contact.email}`}
            style={{ fontFamily: "'Anton', 'Impact', sans-serif", fontSize: "clamp(1.2rem, 4vw, 3rem)", color: "#ffffff", textDecoration: "none", letterSpacing: "0.05em", transition: "color 0.2s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#9b59b6")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
          >
            {content.contact.email}
          </a>
          <button
            onClick={() => { setShowContact(false); setActiveNav(""); }}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.5)", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", padding: "10px 28px", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease", borderRadius: "1px" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#9b59b6"; e.currentTarget.style.color = "#9b59b6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            ← BACK
          </button>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPasswordModal(false); setPwValue(""); } }}
          style={{ position: "fixed", inset: 0, zIndex: 8999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <form onSubmit={handlePwSubmit}>
            <input
              type="password"
              value={pwValue}
              onChange={e => setPwValue(e.target.value)}
              placeholder="—"
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.18)",
                color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "28px",
                letterSpacing: "0.6em",
                textAlign: "center",
                width: "220px",
                outline: "none",
                padding: "14px 0",
                animation: pwShake ? "shake 0.45s ease" : "none",
              }}
            />
          </form>
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && (
        <AdminPanel
          content={content}
          onSave={(c) => setContent(c)}
          onClose={() => setShowAdmin(false)}
        />
      )}

      <style>{`
        @media (hover: hover) { *, *::before, *::after { cursor: none !important; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          40%     { transform: translateX(10px); }
          60%     { transform: translateX(-6px); }
          80%     { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
