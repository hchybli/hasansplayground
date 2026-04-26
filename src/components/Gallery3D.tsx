"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Panel {
  id: number;
  title: string;
  category: string;
  src: string;
  color: string;
}

const PANELS: Panel[] = [
  {
    id: 1,
    title: "Neural Dreams",
    category: "AI / Tech",
    src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    color: "#CC0000",
  },
  {
    id: 2,
    title: "Code & Create",
    category: "Dev Projects",
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    color: "#CC0000",
  },
  {
    id: 3,
    title: "Design Lab",
    category: "Visual Art",
    src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    color: "#CC0000",
  },
  {
    id: 4,
    title: "Music & Sound",
    category: "Audio",
    src: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
    color: "#CC0000",
  },
  {
    id: 5,
    title: "Future Vision",
    category: "Concepts",
    src: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80",
    color: "#CC0000",
  },
];

// tx/ty = translate from viewport center, tz = depth px, ry = rotateY, w/h = fixed px size
// x values kept ≤ ±30vw so panels stay fully on-screen down to ~900px wide viewports
const PANEL_LAYOUT = [
  { tx: "-30vw", ty: "60px", tz: -150, ry:  18, w: 300, h: 200 }, // far left
  { tx: "-14vw", ty: "20px", tz: -300, ry:   8, w: 270, h: 178 }, // center-left
  { tx:      "0", ty: "80px", tz: -450, ry:   0, w: 240, h: 158 }, // dead center, furthest back
  { tx:  "14vw", ty: "10px", tz: -300, ry:  -8, w: 270, h: 178 }, // center-right
  { tx:  "30vw", ty: "50px", tz: -150, ry: -18, w: 300, h: 200 }, // far right
];

const NAV_LINKS = ["FILMS", "MUSIC", "DESIGN", "GAMING", "PLAYGROUND", "ABOUT", "CONTACT"];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Gallery3D() {
  const bgRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const currentShiftRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [activePanel, setActivePanel] = useState<Panel | null>(null);
  const [zoomingId, setZoomingId] = useState<number | null>(null);
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [activeNav, setActiveNav] = useState("PLAYGROUND");
  const [shuffleActive, setShuffleActive] = useState(false);
  const [panelOrder, setPanelOrder] = useState(PANELS.map((_, i) => i));

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    mouseRef.current = { x: nx, y: ny };
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  const animate = useCallback(() => {
    const bg = bgRef.current;
    if (!bg) return;

    // Full head-turn effect: mouse at the far edge shifts the room 100px horizontally
    // and 70px vertically. The bgRef div uses inset:-15% (~200px buffer) so edges
    // never appear. Lerp at 0.08 makes it feel alive without being jerky.
    const targetX = mouseRef.current.x * -100;
    const targetY = mouseRef.current.y * -70;

    currentShiftRef.current.x = lerp(currentShiftRef.current.x, targetX, 0.08);
    currentShiftRef.current.y = lerp(currentShiftRef.current.y, targetY, 0.08);

    bg.style.transform = `translate(${currentShiftRef.current.x}px, ${currentShiftRef.current.y}px)`;

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, animate]);

  const handlePanelClick = (panel: Panel) => {
    if (activePanel) return;
    setZoomingId(panel.id);
    setTimeout(() => {
      setActivePanel(panel);
      setZoomingId(null);
    }, 600);
  };

  const handleClose = () => setActivePanel(null);

  const handleShuffle = () => {
    setShuffleActive(true);
    const shuffled = [...panelOrder].sort(() => Math.random() - 0.5);
    setPanelOrder(shuffled);
    setTimeout(() => setShuffleActive(false), 600);
  };

  const orderedPanels = panelOrder.map((i) => PANELS[i]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#f0eeeb",
        position: "relative",
      }}
    >
      {/* Custom cursor */}
      <div
        className={`custom-cursor ${hoveredPanel !== null ? "hovering" : ""}`}
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          background: "#1a1a1a",
          mixBlendMode: "normal",
        }}
      />
      <div
        className="cursor-trail"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          borderColor: "rgba(0,0,0,0.25)",
        }}
      />

      {/* ── BACKGROUND LAYER — oversized so 100px pan never reveals an edge ── */}
      <div
        ref={bgRef}
        style={{
          position: "absolute",
          inset: "-15%",
          zIndex: 0,
          pointerEvents: "none",
          willChange: "transform",
          backgroundImage: "url('/room.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Header: Name */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          textAlign: "center",
          paddingTop: "20px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: "clamp(3rem, 9vw, 9rem)",
            lineHeight: 0.9,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          HASAN&apos;S PLAYGROUND
        </div>
      </header>

      {/* Nav */}
      <nav
        style={{
          position: "absolute",
          top: "clamp(80px, 12vw, 130px)",
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px, 2.5vw, 40px)",
          pointerEvents: "all",
        }}
      >
        {NAV_LINKS.map((link) => (
          <button
            key={link}
            onClick={() => setActiveNav(link)}
            style={{
              background: "none",
              border: "none",
              fontFamily: "'Barlow Condensed', 'Oswald', sans-serif",
              fontSize: "clamp(9px, 1.1vw, 13px)",
              letterSpacing: "0.18em",
              fontWeight: 600,
              color: activeNav === link ? "#1a1a1a" : "rgba(0,0,0,0.4)",
              textTransform: "uppercase",
              cursor: "none",
              padding: "4px 2px",
              paddingBottom: "6px",
              transition: "color 0.3s ease",
              borderBottom: activeNav === link ? "1px solid #CC0000" : "1px solid transparent",
            }}
          >
            {link}
          </button>
        ))}
      </nav>

      {/* ── PANEL LAYER — static 3D, never moves with mouse ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: "1000px",
          perspectiveOrigin: "50% 44%",
          zIndex: 3,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
          }}
        >
          {orderedPanels.map((panel, idx) => {
            const layout = PANEL_LAYOUT[idx];
            const isZooming = zoomingId === panel.id;
            const isHovered = hoveredPanel === panel.id;
            const hoverScale = isZooming ? 3 : isHovered ? 1.04 : 1;

            return (
              // Outer wrapper: owns the 3D transform, click, hover state
              <div
                key={panel.id}
                onClick={() => handlePanelClick(panel)}
                onMouseEnter={() => setHoveredPanel(panel.id)}
                onMouseLeave={() => setHoveredPanel(null)}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `${layout.w}px`,
                  height: `${layout.h}px`,
                  transform: `
                    translate(-50%, -50%)
                    translateX(${layout.tx})
                    translateY(${layout.ty})
                    translateZ(${layout.tz}px)
                    rotateY(${layout.ry}deg)
                    scale(${hoverScale})
                  `,
                  transformStyle: "preserve-3d",
                  transition: isZooming
                    ? "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease"
                    : shuffleActive
                    ? "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : "transform 0.3s ease",
                  opacity: isZooming ? 0 : 1,
                  cursor: "none",
                  zIndex: isHovered ? 5 : 1,
                }}
              >
                {/* Hanging wire — outside the overflow:hidden image container */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "2px",
                    height: "80px",
                    background: "#1a1a1a",
                    opacity: 0.3,
                  }}
                />

                {/* Inner image container — overflow:hidden only clips photo/labels */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "3px",
                    overflow: "hidden",
                    boxShadow: isHovered
                      ? "0 20px 50px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.12)"
                      : "0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.09)",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                {/* Photo */}
                <img
                  src={panel.src}
                  alt={panel.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: isHovered ? "brightness(1.06)" : "brightness(0.9)",
                    transition: "filter 0.3s ease",
                  }}
                  draggable={false}
                />

                {/* Bottom label gradient */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.72) 100%)",
                    opacity: isHovered ? 1 : 0.85,
                    transition: "opacity 0.3s ease",
                  }}
                />

                {/* Red top accent — thin line that stays */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "#CC0000",
                    opacity: isHovered ? 1 : 0.7,
                    transition: "opacity 0.3s ease",
                  }}
                />

                {/* Label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.22em",
                      color: "#CC0000",
                      textTransform: "uppercase",
                      marginBottom: "3px",
                    }}
                  >
                    {panel.category}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: "16px",
                      color: "#ffffff",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {panel.title}
                  </div>
                </div>

                {/* Hover view indicator */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        border: "1.5px solid rgba(255,255,255,0.8)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(6px)",
                        background: "rgba(255,255,255,0.12)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polygon points="2,1 11,6 2,11" fill="rgba(255,255,255,0.9)" />
                      </svg>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          position: "absolute",
          bottom: "28px",
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "rgba(0,0,0,0.4)",
            textTransform: "uppercase",
          }}
        >
          EXPLORE ALL PROJECTS
        </div>
        <button
          onClick={handleShuffle}
          style={{
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.35)",
            color: "#1a1a1a",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            padding: "10px 36px",
            cursor: "none",
            transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease",
            borderRadius: "1px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(204,0,0,0.06)";
            e.currentTarget.style.borderColor = "#CC0000";
            e.currentTarget.style.color = "#CC0000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(0,0,0,0.35)";
            e.currentTarget.style.color = "#1a1a1a";
          }}
        >
          SHUFFLE
        </button>
      </footer>

      {/* Fullscreen overlay */}
      {activePanel && (
        <FullscreenOverlay panel={activePanel} onClose={handleClose} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FullscreenOverlay({ panel, onClose }: { panel: Panel; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(240,238,235,0.96)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.35s ease",
        cursor: "default",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "88vw",
          maxHeight: "82vh",
          animation: "slideUp 0.35s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={panel.src}
          alt={panel.title}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "72vh",
            objectFit: "contain",
            display: "block",
            borderRadius: "2px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          }}
        />
        {/* Red top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CC0000" }} />

        {/* Info */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 24px",
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            borderRadius: "0 0 2px 2px",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.25em",
              color: "#CC0000",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {panel.category}
          </div>
          <div
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "clamp(20px, 3vw, 36px)",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {panel.title}
          </div>
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "28px",
          right: "32px",
          background: "none",
          border: "1px solid rgba(0,0,0,0.25)",
          color: "#1a1a1a",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "11px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          padding: "8px 20px",
          cursor: "pointer",
          transition: "border-color 0.2s ease, color 0.2s ease",
          borderRadius: "1px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#CC0000";
          e.currentTarget.style.color = "#CC0000";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)";
          e.currentTarget.style.color = "#1a1a1a";
        }}
      >
        ← BACK
      </button>

      <div
        style={{
          position: "absolute",
          bottom: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "rgba(0,0,0,0.3)",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        CLICK OUTSIDE OR PRESS ESC TO CLOSE
      </div>
    </div>
  );
}
