"use client";

import { useState, useRef, useEffect } from "react";
import type { HpContent, FixArticle, Language, MenuItem, TileType } from "@/lib/content";
import { saveContent } from "@/lib/content";
import type { GraphNode, GraphLink } from "@/lib/fluencyData";
import { loadNodes, loadLinks, saveGraph, DEFAULT_NODES, DEFAULT_LINKS } from "@/lib/fluencyData";

// ─── shared input styles ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background: "#111", border: "1px solid #2a2a2a", borderRadius: 0,
  color: "#fff", padding: "8px 10px", fontFamily: "'Barlow Condensed',sans-serif",
  fontSize: "14px", width: "100%", boxSizing: "border-box", outline: "none",
};
const txt: React.CSSProperties = { ...inp, resize: "vertical" as const, minHeight: "80px" };
const lbl: React.CSSProperties = {
  display: "block", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px",
  letterSpacing: "0.25em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const,
  marginBottom: "6px",
};
const fg: React.CSSProperties = { marginBottom: "20px" };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = "#c0392b");
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = "#2a2a2a");

// ─── tile type visual data ─────────────────────────────────────────────────────
const TTYPES: { type: TileType; label: string; c: number; r: number }[] = [
  { type: "wide",  label: "WIDE",  c: 6,  r: 3 },
  { type: "tall",  label: "TALL",  c: 4,  r: 5 },
  { type: "mini2", label: "MINI2", c: 2,  r: 3 },
  { type: "thin",  label: "THIN",  c: 8,  r: 2 },
  { type: "sq",    label: "SQ",    c: 4,  r: 3 },
  { type: "mini",  label: "MINI",  c: 3,  r: 2 },
  { type: "med",   label: "MED",   c: 6,  r: 4 },
  { type: "strip", label: "STRIP", c: 12, r: 2 },
];

// ─── HomeEditor ────────────────────────────────────────────────────────────────
function HomeEditor({ draft, setDraft }: { draft: HpContent; setDraft: React.Dispatch<React.SetStateAction<HpContent>> }) {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={fg}>
        <label style={lbl}>Site Title</label>
        <input
          style={inp}
          value={draft.home.title}
          onChange={e => setDraft(p => ({ ...p, home: { ...p.home, title: e.target.value } }))}
          onFocus={onF} onBlur={onB}
        />
      </div>
      <div style={fg}>
        <label style={lbl}>Menu Items</label>
        {draft.home.menuItems.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              style={{ ...inp, flex: 2 }}
              value={item.label}
              placeholder="Label"
              onChange={e => {
                const items = draft.home.menuItems.map((m, j) => j === i ? { ...m, label: e.target.value } : m);
                setDraft(p => ({ ...p, home: { ...p.home, menuItems: items } }));
              }}
              onFocus={onF} onBlur={onB}
            />
            <select
              style={{ ...inp, flex: 1 }}
              value={item.target}
              onChange={e => {
                const items = draft.home.menuItems.map((m, j) =>
                  j === i ? { ...m, target: e.target.value as MenuItem["target"] } : m
                );
                setDraft(p => ({ ...p, home: { ...p.home, menuItems: items } }));
              }}
              onFocus={onF} onBlur={onB}
            >
              <option value="fluency">fluency</option>
              <option value="fixations">fixations</option>
              <option value="contact">contact</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FluencyEditor ─────────────────────────────────────────────────────────────
function FluencyEditor({ draft, setDraft }: { draft: HpContent; setDraft: React.Dispatch<React.SetStateAction<HpContent>> }) {
  const fl = draft.fluency;
  const upd = (field: keyof typeof fl, val: string) =>
    setDraft(p => ({ ...p, fluency: { ...p.fluency, [field]: val } }));
  const updLang = (i: number, field: keyof Language, val: string | number) =>
    setDraft(p => ({
      ...p,
      fluency: {
        ...p.fluency,
        languages: p.fluency.languages.map((l, j) => j === i ? { ...l, [field]: val } : l),
      },
    }));
  const addLang = () =>
    setDraft(p => ({
      ...p,
      fluency: {
        ...p.fluency,
        languages: [...p.fluency.languages, { name: "Language", native: "", levelLabel: "Level", percent: 50, levelText: "" }],
      },
    }));
  const delLang = (i: number) =>
    setDraft(p => ({ ...p, fluency: { ...p.fluency, languages: p.fluency.languages.filter((_, j) => j !== i) } }));

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={fg}>
        <label style={lbl}>Eyebrow Text</label>
        <input style={inp} value={fl.eyebrow} onChange={e => upd("eyebrow", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
      <div style={fg}>
        <label style={lbl}>Hero Subtitle</label>
        <textarea style={txt} value={fl.subtitle} onChange={e => upd("subtitle", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
      <div style={fg}>
        <label style={lbl}>Section Heading</label>
        <input style={inp} value={fl.sectionHeading} onChange={e => upd("sectionHeading", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>

      <div style={fg}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={lbl}>Language Cards</span>
          <button
            onClick={addLang}
            style={{ background: "none", border: "1px solid #2a2a2a", color: "#c0392b", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.2em", padding: "5px 12px", cursor: "pointer" }}
          >+ ADD</button>
        </div>
        {fl.languages.map((lang, i) => (
          <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", padding: "16px", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, fontSize: "9px" }}>Name</label>
                <input style={inp} value={lang.name} onChange={e => updLang(i, "name", e.target.value)} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, fontSize: "9px" }}>Native Script</label>
                <input style={inp} value={lang.native} onChange={e => updLang(i, "native", e.target.value)} onFocus={onF} onBlur={onB} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, fontSize: "9px" }}>Level Label</label>
                <input style={inp} value={lang.levelLabel} onChange={e => updLang(i, "levelLabel", e.target.value)} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...lbl, fontSize: "9px" }}>Fluency %</label>
                <input
                  type="range" min={0} max={100} value={lang.percent}
                  onChange={e => updLang(i, "percent", Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#c0392b", marginBottom: "4px" }}
                />
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", color: "#c0392b", textAlign: "right" }}>{lang.percent}%</div>
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ ...lbl, fontSize: "9px" }}>Level Description</label>
              <textarea style={{ ...txt, minHeight: "56px" }} value={lang.levelText} onChange={e => updLang(i, "levelText", e.target.value)} onFocus={onF} onBlur={onB} />
            </div>
            <button
              onClick={() => delLang(i)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.2em", cursor: "pointer", padding: 0 }}
            >× DELETE</button>
          </div>
        ))}
      </div>

      <div style={fg}>
        <label style={lbl}>Pull Quote</label>
        <textarea style={txt} value={fl.quote} onChange={e => upd("quote", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
      <div style={fg}>
        <label style={lbl}>Attribution</label>
        <input style={inp} value={fl.attribution} onChange={e => upd("attribution", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
    </div>
  );
}

// ─── FixationsEditor ───────────────────────────────────────────────────────────
function FixationsEditor({ draft, setDraft }: { draft: HpContent; setDraft: React.Dispatch<React.SetStateAction<HpContent>> }) {
  const [selectedId, setSelectedId] = useState<number | null>(draft.fixations[0]?.id ?? null);
  const [tab, setTab] = useState<"settings" | "content" | "preview">("settings");
  const editorRef = useRef<HTMLDivElement>(null);

  const article = draft.fixations.find(a => a.id === selectedId);

  useEffect(() => {
    if (editorRef.current && article) {
      editorRef.current.innerHTML = article.contentHtml ?? "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const updArticle = (field: keyof FixArticle, val: unknown) =>
    setDraft(p => ({ ...p, fixations: p.fixations.map(a => a.id === selectedId ? { ...a, [field]: val } : a) }));

  const addArticle = () => {
    const newId = Math.max(...draft.fixations.map(a => a.id), 0) + 1;
    const blank: FixArticle = { id: newId, type: "sq", category: "CATEGORY", title: "NEW ARTICLE" };
    setDraft(p => ({ ...p, fixations: [...p.fixations, blank] }));
    setSelectedId(newId);
    setTab("settings");
  };

  const delArticle = (id: number) => {
    const remaining = draft.fixations.filter(a => a.id !== id);
    setDraft(p => ({ ...p, fixations: remaining }));
    setSelectedId(remaining[0]?.id ?? null);
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const toolbarBtn: React.CSSProperties = {
    padding: "5px 10px", background: "#111", border: "1px solid #2a2a2a",
    color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px",
    letterSpacing: "0.1em", cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Article list */}
      <div style={{ width: "220px", borderRight: "1px solid #1a1a1a", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button
            onClick={addArticle}
            style={{ width: "100%", background: "none", border: "1px solid #c0392b", color: "#c0392b", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", padding: "8px", cursor: "pointer" }}
          >+ New Article</button>
        </div>
        {draft.fixations.map(a => (
          <div
            key={a.id}
            onClick={() => { setSelectedId(a.id); setTab("settings"); }}
            style={{ padding: "12px 16px", borderBottom: "1px solid #111", cursor: "pointer", background: selectedId === a.id ? "rgba(192,57,43,0.1)" : "transparent", borderLeft: selectedId === a.id ? "2px solid #c0392b" : "2px solid transparent" }}
          >
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", letterSpacing: "0.25em", color: "#c0392b", marginBottom: "4px" }}>{a.category}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", color: "#fff", lineHeight: 1.3 }}>{a.title}</div>
          </div>
        ))}
      </div>

      {/* Article editor */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {!article ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.15)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", letterSpacing: "0.3em" }}>
            SELECT AN ARTICLE
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              {(["settings", "content", "preview"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: tab === t ? "2px solid #c0392b" : "2px solid transparent", color: tab === t ? "#fff" : "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginBottom: "-1px" }}
                >
                  {t}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => delArticle(article.id)}
                style={{ padding: "12px 16px", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.2em", cursor: "pointer" }}
              >× DELETE</button>
            </div>

            {/* Settings tab */}
            {tab === "settings" && (
              <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
                <div style={fg}>
                  <label style={lbl}>Category Tag</label>
                  <input style={inp} value={article.category} onChange={e => updArticle("category", e.target.value.toUpperCase())} onFocus={onF} onBlur={onB} />
                </div>
                <div style={fg}>
                  <label style={lbl}>Title</label>
                  <input style={inp} value={article.title} onChange={e => updArticle("title", e.target.value)} onFocus={onF} onBlur={onB} />
                </div>
                <div style={fg}>
                  <label style={lbl}>Tile Subtitle (body text)</label>
                  <textarea style={txt} value={article.body ?? ""} onChange={e => updArticle("body", e.target.value)} onFocus={onF} onBlur={onB} />
                </div>
                <div style={fg}>
                  <label style={{ ...lbl, marginBottom: "12px" }}>Tile Size</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
                    {TTYPES.map(t => (
                      <button
                        key={t.type}
                        onClick={() => updArticle("type", t.type)}
                        style={{ background: article.type === t.type ? "rgba(192,57,43,0.2)" : "#111", border: `1px solid ${article.type === t.type ? "#c0392b" : "#2a2a2a"}`, padding: "8px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
                      >
                        <div style={{ width: `${Math.min(t.c * 5, 60)}px`, height: `${Math.min(t.r * 8, 40)}px`, background: article.type === t.type ? "#c0392b" : "rgba(255,255,255,0.08)" }} />
                        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "12px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}>
                  <input type="checkbox" checked={!!article.accent} onChange={e => updArticle("accent", e.target.checked)} style={{ accentColor: "#c0392b", width: "14px", height: "14px" }} />
                  RED ACCENT BACKGROUND
                </label>
              </div>
            )}

            {/* Content tab */}
            {tab === "content" && (
              <div style={{ padding: "24px 28px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ ...fg }}>
                  <label style={lbl}>Opening Lede</label>
                  <textarea style={{ ...txt, minHeight: "72px" }} value={article.lede ?? ""} onChange={e => updArticle("lede", e.target.value)} onFocus={onF} onBlur={onB} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <label style={lbl}>Body Content</label>
                  <div style={{ display: "flex", gap: "2px", marginBottom: "6px", flexWrap: "wrap" }}>
                    {[
                      { l: "P",  cmd: "formatBlock", val: "p" },
                      { l: "H2", cmd: "formatBlock", val: "h2" },
                      { l: "H3", cmd: "formatBlock", val: "h3" },
                      { l: "BQ", cmd: "formatBlock", val: "blockquote" },
                      { l: "B",  cmd: "bold" },
                      { l: "I",  cmd: "italic" },
                    ].map(btn => (
                      <button
                        key={btn.l}
                        onMouseDown={e => { e.preventDefault(); exec(btn.cmd, btn.val); }}
                        style={{ ...toolbarBtn, fontWeight: btn.l === "B" ? "bold" : "normal", fontStyle: btn.l === "I" ? "italic" : "normal" }}
                      >{btn.l}</button>
                    ))}
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    style={{ flex: 1, background: "#111", border: "1px solid #2a2a2a", padding: "12px 14px", color: "rgba(255,255,255,0.8)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "14px", outline: "none", lineHeight: 1.7, overflowY: "auto", minHeight: "120px" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#c0392b")}
                    onBlur={e => { e.currentTarget.style.borderColor = "#2a2a2a"; updArticle("contentHtml", e.currentTarget.innerHTML); }}
                  />
                </div>
              </div>
            )}

            {/* Preview tab */}
            {tab === "preview" && (
              <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
                <label style={{ ...lbl, marginBottom: "12px" }}>Tile Preview</label>
                <div style={{ display: "inline-flex", flexDirection: "column", background: article.accent ? "rgba(192,57,43,0.12)" : "#141414", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", minWidth: "220px", maxWidth: "360px", marginBottom: "36px", position: "relative", minHeight: "120px", overflow: "hidden" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", letterSpacing: "0.3em", color: "#c0392b", marginBottom: "8px" }}>{article.category}</div>
                  <div style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "1.5rem", color: "#fff", textTransform: "uppercase", lineHeight: 1.05 }}>{article.title}</div>
                  {article.body && <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: "8px", lineHeight: 1.5 }}>{article.body}</p>}
                  <div style={{ position: "absolute", bottom: "4px", right: "10px", fontFamily: "'Anton',sans-serif", fontSize: "3.5rem", color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none" }}>{String(article.id).padStart(2, "0")}</div>
                </div>

                {(article.lede || article.contentHtml) && (
                  <>
                    <label style={{ ...lbl, marginBottom: "12px" }}>Article Preview</label>
                    {article.lede && (
                      <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "1.05rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginBottom: "20px", borderLeft: "2px solid #c0392b", paddingLeft: "16px" }}>{article.lede}</p>
                    )}
                    {article.contentHtml && (
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.35)", lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ContactEditor ─────────────────────────────────────────────────────────────
function ContactEditor({ draft, setDraft }: { draft: HpContent; setDraft: React.Dispatch<React.SetStateAction<HpContent>> }) {
  const co = draft.contact;
  const upd = (field: keyof typeof co, val: string) =>
    setDraft(p => ({ ...p, contact: { ...p.contact, [field]: val } }));
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={fg}>
        <label style={lbl}>Eyebrow Text</label>
        <input style={inp} value={co.eyebrow} onChange={e => upd("eyebrow", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
      <div style={fg}>
        <label style={lbl}>Tagline</label>
        <textarea style={txt} value={co.tagline} onChange={e => upd("tagline", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
      <div style={fg}>
        <label style={lbl}>Email Address</label>
        <input style={inp} type="email" value={co.email} onChange={e => upd("email", e.target.value)} onFocus={onF} onBlur={onB} />
      </div>
    </div>
  );
}

// ─── GraphEditor ───────────────────────────────────────────────────────────────
const NODE_TYPES: GraphNode["type"][] = ["root", "cat", "skill", "job"];

const BLANK_NODE: GraphNode = { id: "", label: "", type: "skill", r: 20, info: { sub: "", desc: "" } };

function GraphEditor() {
  const [nodes, setNodes] = useState<GraphNode[]>(() => loadNodes());
  const [links, setLinks] = useState<GraphLink[]>(() => loadLinks());
  const [tab, setTab] = useState<"nodes" | "links">("nodes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GraphNode | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newLink, setNewLink] = useState<{ s: string; t: string; x: boolean }>({ s: "", t: "", x: false });
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const persist = (n: GraphNode[], l: GraphLink[]) => {
    setNodes(n); setLinks(l);
    saveGraph(n, l);
    setError("");
  };

  // ── node handlers ──────────────────────────────────────────────────────────
  const selectNode = (id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setSelectedId(id);
    setDraft(JSON.parse(JSON.stringify(node)));
    setIsNew(false);
    setError("");
    setConfirmDeleteId(null);
  };

  const startNewNode = () => {
    setDraft({ ...BLANK_NODE });
    setIsNew(true);
    setSelectedId(null);
    setError("");
    setConfirmDeleteId(null);
  };

  const saveNode = () => {
    if (!draft) return;
    const id = draft.id.trim();
    if (!id)                         { setError("ID is required."); return; }
    if (/\s/.test(id))               { setError("ID must not contain spaces."); return; }
    if (isNew && nodes.find(n => n.id === id)) { setError(`ID "${id}" already exists.`); return; }
    if (!draft.label.trim())         { setError("Label is required."); return; }
    const cleaned = { ...draft, id, label: draft.label.trim() };
    const next = isNew ? [...nodes, cleaned] : nodes.map(n => n.id === id ? cleaned : n);
    persist(next, links);
    setSelectedId(id);
    setIsNew(false);
  };

  const deleteNode = (id: string) => {
    const nodeLinks = links.filter(l => l.s === id || l.t === id);
    if (nodeLinks.length > 0 && confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setError(`This node has ${nodeLinks.length} link(s). Click DELETE again to remove it and all its links.`);
      return;
    }
    persist(nodes.filter(n => n.id !== id), links.filter(l => l.s !== id && l.t !== id));
    setDraft(null); setSelectedId(null); setIsNew(false); setConfirmDeleteId(null);
  };

  // ── link handlers ──────────────────────────────────────────────────────────
  const addLink = () => {
    if (!newLink.s || !newLink.t)                                  { setError("Both source and target are required."); return; }
    if (newLink.s === newLink.t)                                   { setError("Source and target must be different nodes."); return; }
    if (links.find(l => l.s === newLink.s && l.t === newLink.t))  { setError("That link already exists."); return; }
    persist(nodes, [...links, { ...newLink }]);
    setNewLink({ s: "", t: "", x: false });
  };

  const deleteLink = (i: number) => persist(nodes, links.filter((_, j) => j !== i));

  const resetToDefaults = () => {
    if (!confirm("Reset graph to default nodes and links? This cannot be undone.")) return;
    persist(JSON.parse(JSON.stringify(DEFAULT_NODES)), JSON.parse(JSON.stringify(DEFAULT_LINKS)));
    setDraft(null); setSelectedId(null); setIsNew(false); setError("");
  };

  // ── shared row style ───────────────────────────────────────────────────────
  const rowStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 16px", borderBottom: "1px solid #111", cursor: "pointer",
    background: active ? "rgba(192,57,43,0.1)" : "transparent",
    borderLeft: active ? "2px solid #c0392b" : "2px solid transparent",
  });

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div style={{ width: "240px", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>

        {/* Sub-tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          {(["nodes", "links"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setDraft(null); setIsNew(false); setError(""); setConfirmDeleteId(null); }}
              style={{ flex: 1, padding: "12px 8px", background: "none", border: "none", marginBottom: "-1px", borderBottom: tab === t ? "2px solid #c0392b" : "2px solid transparent", color: tab === t ? "#fff" : "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
            >{t}</button>
          ))}
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {tab === "nodes" && (
            <>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #1a1a1a" }}>
                <button
                  onClick={startNewNode}
                  style={{ width: "100%", background: "none", border: "1px solid #c0392b", color: "#c0392b", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", padding: "7px", cursor: "pointer" }}
                >+ New Node</button>
              </div>
              {nodes.map(n => (
                <div key={n.id} onClick={() => selectNode(n.id)} style={rowStyle(selectedId === n.id && !isNew)}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", letterSpacing: "0.25em", color: "#c0392b", marginBottom: "2px" }}>{n.type.toUpperCase()} · r{n.r}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", color: "#fff", lineHeight: 1.2 }}>{n.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>{n.id}</div>
                </div>
              ))}
            </>
          )}

          {tab === "links" && (
            <>
              {links.map((l, i) => (
                <div key={`${l.s}>${l.t}`} style={{ padding: "10px 14px 10px 16px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "12px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.s} → {l.t}</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "9px", letterSpacing: "0.2em", color: l.x ? "#c0392b" : "rgba(255,255,255,0.25)", marginTop: "2px" }}>{l.x ? "CROSS" : "DIRECT"}</div>
                  </div>
                  <button onClick={() => deleteLink(i)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: "16px", cursor: "pointer", padding: "0 4px", flexShrink: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Reset button */}
        <div style={{ borderTop: "1px solid #1a1a1a", padding: "10px 12px", flexShrink: 0 }}>
          <button
            onClick={resetToDefaults}
            style={{ width: "100%", background: "none", border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.2)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", padding: "6px", cursor: "pointer" }}
          >Reset Defaults</button>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Error / warning banner */}
        {error && (
          <div style={{ background: "rgba(192,57,43,0.12)", borderBottom: "1px solid rgba(192,57,43,0.3)", padding: "10px 24px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "12px", color: "#e74c3c", letterSpacing: "0.05em" }}>
            {error}
          </div>
        )}

        {/* ── Node form ── */}
        {tab === "nodes" && draft && (
          <div style={{ padding: "24px 28px" }}>
            <div style={fg}>
              <label style={lbl}>Node ID {isNew ? "" : "(read-only)"}</label>
              <input
                style={{ ...inp, color: isNew ? "#fff" : "rgba(255,255,255,0.35)", cursor: isNew ? "text" : "default" }}
                value={draft.id}
                readOnly={!isNew}
                onChange={e => isNew && setDraft(p => p && ({ ...p, id: e.target.value.replace(/\s/g, "") }))}
                onFocus={isNew ? onF : undefined} onBlur={isNew ? onB : undefined}
                placeholder="unique-id-no-spaces"
              />
            </div>
            <div style={fg}>
              <label style={lbl}>Label</label>
              <input style={inp} value={draft.label} onChange={e => setDraft(p => p && ({ ...p, label: e.target.value }))} onFocus={onF} onBlur={onB} />
            </div>
            <div style={{ ...fg, display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Type</label>
                <select
                  style={inp}
                  value={draft.type}
                  onChange={e => setDraft(p => p && ({ ...p, type: e.target.value as GraphNode["type"] }))}
                  onFocus={onF} onBlur={onB}
                >
                  {NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Radius (r)</label>
                <input
                  style={inp} type="number" min={8} max={80}
                  value={draft.r}
                  onChange={e => setDraft(p => p && ({ ...p, r: Number(e.target.value) }))}
                  onFocus={onF} onBlur={onB}
                />
              </div>
            </div>
            <div style={fg}>
              <label style={lbl}>Sub-label</label>
              <input style={inp} value={draft.info.sub ?? ""} onChange={e => setDraft(p => p && ({ ...p, info: { ...p.info, sub: e.target.value } }))} onFocus={onF} onBlur={onB} placeholder="e.g. Design tool · 2020–Present" />
            </div>
            <div style={fg}>
              <label style={lbl}>Description</label>
              <textarea style={txt} value={draft.info.desc} onChange={e => setDraft(p => p && ({ ...p, info: { ...p.info, desc: e.target.value } }))} onFocus={onF} onBlur={onB} />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={saveNode}
                style={{ background: "#c0392b", border: "none", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", padding: "9px 24px", cursor: "pointer" }}
              >{isNew ? "ADD NODE" : "SAVE NODE"}</button>
              {!isNew && (
                <button
                  onClick={() => deleteNode(draft.id)}
                  style={{ background: "none", border: "none", color: confirmDeleteId === draft.id ? "#e74c3c" : "rgba(255,255,255,0.25)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", padding: "9px 0" }}
                >{confirmDeleteId === draft.id ? "× CONFIRM DELETE" : "× DELETE"}</button>
              )}
            </div>
          </div>
        )}

        {tab === "nodes" && !draft && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.15)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "13px", letterSpacing: "0.3em" }}>
            SELECT A NODE OR ADD NEW
          </div>
        )}

        {/* ── Add link form ── */}
        {tab === "links" && (
          <div style={{ padding: "24px 28px" }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "20px" }}>Add Link</div>
            <div style={{ ...fg, display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Source</label>
                <select style={inp} value={newLink.s} onChange={e => setNewLink(p => ({ ...p, s: e.target.value }))} onFocus={onF} onBlur={onB}>
                  <option value="">— select —</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Target</label>
                <select style={inp} value={newLink.t} onChange={e => setNewLink(p => ({ ...p, t: e.target.value }))} onFocus={onF} onBlur={onB}>
                  <option value="">— select —</option>
                  {nodes.filter(n => n.id !== newLink.s).map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </div>
            </div>
            <div style={{ ...fg }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "12px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)" }}>
                <input
                  type="checkbox" checked={newLink.x}
                  onChange={e => setNewLink(p => ({ ...p, x: e.target.checked }))}
                  style={{ accentColor: "#c0392b", width: "14px", height: "14px" }}
                />
                CROSS-CONNECTION (dashed line)
              </label>
            </div>
            <button
              onClick={addLink}
              style={{ background: "#c0392b", border: "none", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", padding: "9px 24px", cursor: "pointer" }}
            >ADD LINK</button>

            <div style={{ marginTop: "32px", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "10px", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "10px" }}>
              {links.length} link{links.length !== 1 ? "s" : ""} total · {links.filter(l => l.x).length} cross
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AdminPanel ────────────────────────────────────────────────────────────────
type Section = "home" | "fluency" | "fixations" | "contact" | "graph";
const SECTIONS: { id: Section; label: string }[] = [
  { id: "home",      label: "HOMEPAGE"  },
  { id: "fluency",   label: "FLUENCY"   },
  { id: "fixations", label: "FIXATIONS" },
  { id: "contact",   label: "CONTACT"   },
  { id: "graph",     label: "GRAPH"     },
];

export default function AdminPanel({
  content,
  onSave,
  onClose,
}: {
  content: HpContent;
  onSave: (c: HpContent) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<HpContent>(() => JSON.parse(JSON.stringify(content)));
  const [section, setSection] = useState<Section>("home");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveContent(draft);
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div data-admin style={{ position: "fixed", inset: 0, zIndex: 9000, background: "#0d0d0d", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: "52px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: "16px", color: "#c0392b", letterSpacing: "0.15em", flex: 1 }}>■ ADMIN</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handleSave}
            style={{ background: saved ? "#27ae60" : "#c0392b", border: "none", color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", padding: "8px 22px", cursor: "pointer", transition: "background 0.3s" }}
          >{saved ? "✓ SAVED" : "SAVE"}</button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "1px solid #2a2a2a", color: "rgba(255,255,255,0.35)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer" }}
          >CLOSE ADMIN</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: "160px", borderRight: "1px solid #1a1a1a", flexShrink: 0 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderLeft: section === s.id ? "2px solid #c0392b" : "2px solid transparent", color: section === s.id ? "#fff" : "rgba(255,255,255,0.3)", fontFamily: "'Barlow Condensed',sans-serif", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", padding: "16px 20px", cursor: "pointer" }}
            >{s.label}</button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: (section === "fixations" || section === "graph") ? "hidden" : "auto" }}>
          {section === "home"      && <HomeEditor      draft={draft} setDraft={setDraft} />}
          {section === "fluency"   && <FluencyEditor   draft={draft} setDraft={setDraft} />}
          {section === "fixations" && <FixationsEditor draft={draft} setDraft={setDraft} />}
          {section === "contact"   && <ContactEditor   draft={draft} setDraft={setDraft} />}
          {section === "graph"     && <GraphEditor />}
        </div>
      </div>
    </div>
  );
}
