// ─── types ────────────────────────────────────────────────────────────────────
export type GraphNodeType = "root" | "cat" | "skill" | "job";

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  r: number;
  info: { desc: string; sub?: string };
  /** initial x as a fraction of canvas width (0–1), optional */
  ix?: number;
  /** initial y as a fraction of canvas height (0–1), optional */
  iy?: number;
}

export interface GraphLink {
  s: string;
  t: string;
  x: boolean; // true = cross-connection (dashed)
}

// ─── defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_NODES: GraphNode[] = [
  { id: "root",   label: "Fluency",        type: "root",  r: 38, ix: 0.5,   iy: 0.5,   info: { desc: "An interactive map of skills and experience." } },
  { id: "design", label: "Design",         type: "cat",   r: 28, ix: 0.335, iy: 0.364, info: { desc: "Visual thinking, interaction design, and building interfaces people enjoy using." } },
  { id: "eng",    label: "Engineering",    type: "cat",   r: 28, ix: 0.665, iy: 0.364, info: { desc: "Frontend and fullstack development." } },
  { id: "work",   label: "Work",           type: "cat",   r: 28, ix: 0.5,   iy: 0.7,   info: { desc: "Professional experience across companies and roles." } },
  { id: "figma",  label: "Figma",          type: "skill", r: 20, info: { sub: "Design tool",   desc: "..." } },
  { id: "ux",     label: "UX Research",    type: "skill", r: 20, info: { sub: "Design skill",  desc: "..." } },
  { id: "motion", label: "Motion",         type: "skill", r: 20, info: { sub: "Design skill",  desc: "..." } },
  { id: "dsys",   label: "Design Systems", type: "skill", r: 20, info: { sub: "Design skill",  desc: "..." } },
  { id: "react",  label: "React",          type: "skill", r: 20, info: { sub: "Engineering",   desc: "..." } },
  { id: "ts",     label: "TypeScript",     type: "skill", r: 20, info: { sub: "Engineering",   desc: "..." } },
  { id: "css",    label: "CSS",            type: "skill", r: 20, info: { sub: "Engineering",   desc: "..." } },
  { id: "node",   label: "Node.js",        type: "skill", r: 20, info: { sub: "Engineering",   desc: "..." } },
  { id: "acme",   label: "Acme Corp",      type: "job",   r: 24, info: { sub: "Senior Product Designer · 2023–Present", desc: "..." } },
  { id: "blend",  label: "Studio Blend",   type: "job",   r: 24, info: { sub: "UI Engineer · 2021–2023",               desc: "..." } },
  { id: "pixel",  label: "Pixel & Co",     type: "job",   r: 24, info: { sub: "Frontend Developer · 2019–2021",        desc: "..." } },
  { id: "free",   label: "Freelance",      type: "job",   r: 20, info: { sub: "Developer · 2017–2019",                 desc: "..." } },
];

export const DEFAULT_LINKS: GraphLink[] = [
  { s: "root",   t: "design", x: false }, { s: "root",   t: "eng",   x: false }, { s: "root",  t: "work",  x: false },
  { s: "design", t: "figma",  x: false }, { s: "design", t: "ux",    x: false }, { s: "design", t: "motion", x: false }, { s: "design", t: "dsys", x: false },
  { s: "eng",    t: "react",  x: false }, { s: "eng",    t: "ts",    x: false }, { s: "eng",    t: "css",   x: false  }, { s: "eng",    t: "node",  x: false },
  { s: "work",   t: "acme",   x: false }, { s: "work",   t: "blend", x: false }, { s: "work",   t: "pixel", x: false  }, { s: "work",   t: "free",  x: false },
  { s: "figma",  t: "acme",   x: true  }, { s: "ux",     t: "acme",  x: true  }, { s: "motion", t: "acme",  x: true  },
  { s: "dsys",   t: "blend",  x: true  }, { s: "dsys",   t: "acme",  x: true  },
  { s: "react",  t: "acme",   x: true  }, { s: "react",  t: "blend", x: true  },
  { s: "ts",     t: "acme",   x: true  }, { s: "ts",     t: "blend", x: true  },
  { s: "css",    t: "pixel",  x: true  }, { s: "css",    t: "acme",  x: true  },
  { s: "node",   t: "blend",  x: true  },
];

// ─── storage ──────────────────────────────────────────────────────────────────
const LS_NODES = "fg_nodes";
const LS_LINKS = "fg_links";
export const GRAPH_CHANGE_EVENT = "fg_change";

function ok() { return typeof window !== "undefined"; }

export function loadNodes(): GraphNode[] {
  if (!ok()) return DEFAULT_NODES;
  try {
    const raw = localStorage.getItem(LS_NODES);
    return raw ? (JSON.parse(raw) as GraphNode[]) : DEFAULT_NODES;
  } catch { return DEFAULT_NODES; }
}

export function loadLinks(): GraphLink[] {
  if (!ok()) return DEFAULT_LINKS;
  try {
    const raw = localStorage.getItem(LS_LINKS);
    return raw ? (JSON.parse(raw) as GraphLink[]) : DEFAULT_LINKS;
  } catch { return DEFAULT_LINKS; }
}

export function saveNodes(nodes: GraphNode[]): void {
  if (!ok()) return;
  localStorage.setItem(LS_NODES, JSON.stringify(nodes));
  window.dispatchEvent(new CustomEvent(GRAPH_CHANGE_EVENT));
}

export function saveLinks(links: GraphLink[]): void {
  if (!ok()) return;
  localStorage.setItem(LS_LINKS, JSON.stringify(links));
  window.dispatchEvent(new CustomEvent(GRAPH_CHANGE_EVENT));
}

export function saveGraph(nodes: GraphNode[], links: GraphLink[]): void {
  if (!ok()) return;
  localStorage.setItem(LS_NODES, JSON.stringify(nodes));
  localStorage.setItem(LS_LINKS, JSON.stringify(links));
  window.dispatchEvent(new CustomEvent(GRAPH_CHANGE_EVENT));
}
