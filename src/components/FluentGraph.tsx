"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  type GraphNode,
  type GraphLink,
  loadNodes,
  loadLinks,
  GRAPH_CHANGE_EVENT,
} from "@/lib/fluencyData";

// ─── constants ────────────────────────────────────────────────────────────────
const W = 1000;
const H = 700;

// ─── internal types (D3 simulation augments these) ────────────────────────────
interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: GraphNode["type"];
  r: number;
  info: { desc: string; sub?: string };
}

interface SimLink {
  source: string | NodeDatum;
  target: string | NodeDatum;
  x: boolean;
}

// ─── visual helpers ───────────────────────────────────────────────────────────
function nodeFill(d: NodeDatum, selectedId: string | null): string {
  if (d.type === "root") return "#0d0d0d";
  if (d.id === selectedId) return "#111";
  if (d.type === "cat") return "rgba(255,255,255,0.1)";
  return "rgba(255,255,255,0.88)";
}
function nodeStroke(d: NodeDatum): string {
  if (d.type === "root") return "rgba(255,255,255,0.2)";
  if (d.type === "cat") return "rgba(255,255,255,0.15)";
  return "rgba(100,100,100,0.6)";
}
function labelFill(d: NodeDatum, selectedId: string | null): string {
  if (d.type === "root") return "#fff";
  if (d.id === selectedId) return "rgba(255,255,255,0.9)";
  return "rgba(255,255,255,0.6)";
}
function linkKey(d: SimLink): string {
  const s = typeof d.source === "string" ? d.source : (d.source as NodeDatum).id;
  const t = typeof d.target === "string" ? d.target : (d.target as NodeDatum).id;
  return `${s}>${t}`;
}

// ─── inner component — owns the D3 simulation ─────────────────────────────────
function FluentGraphInner({ rawNodes, rawLinks }: { rawNodes: GraphNode[]; rawLinks: GraphLink[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [detail, setDetail] = useState<{ label: string; sub?: string; desc: string }>({
    label: rawNodes.find(n => n.type === "root")?.label ?? "Fluency",
    desc:  rawNodes.find(n => n.type === "root")?.info.desc ?? "",
  });
  const [detailVisible, setDetailVisible] = useState(true);

  useEffect(() => {
    if (!svgRef.current) return;

    // ── data transformation ───────────────────────────────────────────────
    const ALL_NODES: NodeDatum[] = rawNodes.map(n => ({
      id: n.id, label: n.label, type: n.type, r: n.r, info: n.info,
      x: n.ix !== undefined ? n.ix * W : undefined,
      y: n.iy !== undefined ? n.iy * H : undefined,
    }));
    const ALL_LINKS: GraphLink[] = rawLinks;

    const NODE_MAP = new Map(ALL_NODES.map(n => [n.id, n]));

    const ADJACENCY = new Map<string, Set<string>>();
    for (const link of ALL_LINKS) {
      if (!ADJACENCY.has(link.s)) ADJACENCY.set(link.s, new Set());
      if (!ADJACENCY.has(link.t)) ADJACENCY.set(link.t, new Set());
      ADJACENCY.get(link.s)!.add(link.t);
      ADJACENCY.get(link.t)!.add(link.s);
    }

    // initial visible = root + its direct neighbours
    const rootNeighbours = ALL_LINKS
      .filter(l => l.s === "root" || l.t === "root")
      .map(l => (l.s === "root" ? l.t : l.s));
    const INITIAL_VISIBLE = new Set(["root", ...rootNeighbours]);

    // ── svg setup ─────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const linkGroup = svg.append("g").attr("class", "fg-links");
    const nodeGroup = svg.append("g").attr("class", "fg-nodes");

    const visible   = new Set<string>(INITIAL_VISIBLE);
    const liveNodes = new Map<string, NodeDatum>();
    let selectedId: string | null = null;
    let simNodes: NodeDatum[] = [];
    let simLinks: SimLink[]   = [];

    // ── simulation ────────────────────────────────────────────────────────
    const sim = d3.forceSimulation<NodeDatum>()
      .force(
        "link",
        d3.forceLink<NodeDatum, SimLink>()
          .id(d => d.id)
          .distance((d: SimLink) => {
            if (d.x) return 320;
            const sid = typeof d.source === "string" ? d.source : d.source.id;
            const tid = typeof d.target === "string" ? d.target : d.target.id;
            if (sid === "root" || tid === "root") return 200;
            return 150;
          }),
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center",  d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide<NodeDatum>().radius(d => d.r + 48));

    const drag = d3.drag<SVGGElement, NodeDatum>()
      .on("start", (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end",   (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null; d.fy = null;
      });

    sim.on("tick", () => {
      simNodes.forEach(n => {
        n.x = Math.max(n.r + 6, Math.min(W - n.r - 6, n.x ?? W / 2));
        n.y = Math.max(n.r + 6, Math.min(H - n.r - 6, n.y ?? H / 2));
      });
      linkGroup.selectAll<SVGLineElement, SimLink>("line").each(function(d) {
        const src = d.source as NodeDatum;
        const tgt = d.target as NodeDatum;
        d3.select(this)
          .attr("x1", src.x ?? 0).attr("y1", src.y ?? 0)
          .attr("x2", tgt.x ?? 0).attr("y2", tgt.y ?? 0);
      });
      nodeGroup.selectAll<SVGGElement, NodeDatum>("g.fgn")
        .attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    function syncVisuals() {
      nodeGroup.selectAll<SVGGElement, NodeDatum>("g.fgn").each(function(nd) {
        const g = d3.select(this);
        g.select("circle.fg-circle").attr("fill",  nodeFill(nd, selectedId));
        g.select("text")            .attr("fill",  labelFill(nd, selectedId));
        g.select("circle.fg-ring")  .attr("stroke-opacity", nd.id === selectedId ? 1 : 0);
      });
    }

    function updateGraph() {
      const nextNodes: NodeDatum[] = [];
      for (const id of visible) {
        const def = NODE_MAP.get(id);
        if (!def) continue;
        if (liveNodes.has(id)) {
          nextNodes.push(liveNodes.get(id)!);
        } else {
          const parentId = ALL_LINKS.find(l => l.t === id && visible.has(l.s))?.s;
          const parent   = parentId ? liveNodes.get(parentId) : null;
          const nd: NodeDatum = {
            ...def,
            x: parent ? (parent.x ?? W / 2) + (Math.random() - 0.5) * 40 : (def.x ?? W / 2),
            y: parent ? (parent.y ?? H / 2) + (Math.random() - 0.5) * 40 : (def.y ?? H / 2),
          };
          liveNodes.set(id, nd);
          nextNodes.push(nd);
        }
      }
      simNodes = nextNodes;

      const visIds = new Set(simNodes.map(n => n.id));
      simLinks = ALL_LINKS
        .filter(l => visIds.has(l.s) && visIds.has(l.t))
        .map(l => ({ source: l.s, target: l.t, x: l.x }));

      sim.nodes(simNodes);
      (sim.force("link") as d3.ForceLink<NodeDatum, SimLink>).links(simLinks);
      sim.alpha(0.3).restart();

      // links
      const lSel = linkGroup
        .selectAll<SVGLineElement, SimLink>("line")
        .data(simLinks, linkKey as (d: SimLink) => string);
      lSel.exit().remove();
      lSel.enter()
        .append("line")
        .attr("stroke", "rgba(255,255,255,0.5)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", d => d.x ? "5,4" : null!)
        .attr("stroke-opacity", 0)
        .transition().duration(450)
        .attr("stroke-opacity", d => d.x ? 0.4 : 0.7);

      // nodes
      const nSel = nodeGroup
        .selectAll<SVGGElement, NodeDatum>("g.fgn")
        .data(simNodes, d => d.id);
      nSel.exit().remove();

      const enter = nSel.enter()
        .append("g").attr("class", "fgn").attr("opacity", 0);

      enter.append("circle")
        .attr("class", "fg-circle")
        .attr("r",            d => d.r)
        .attr("fill",         d => nodeFill(d, selectedId))
        .attr("stroke",       d => nodeStroke(d))
        .attr("stroke-width", 1);

      enter.append("circle")
        .attr("class",          "fg-ring")
        .attr("r",              d => d.r + 5)
        .attr("fill",           "none")
        .attr("stroke",         "rgba(255,255,255,0.55)")
        .attr("stroke-width",   1.5)
        .attr("stroke-opacity", 0)
        .attr("pointer-events", "none");

      enter.append("text")
        .text(d => d.label)
        .attr("text-anchor",   "middle")
        .attr("y",             d => d.type === "root" ? 0 : d.r + 24)
        .attr("dy",            d => d.type === "root" ? "0.35em" : "0")
        .attr("fill",          d => labelFill(d, selectedId))
        .attr("font-family",   "'Barlow Condensed', sans-serif")
        .attr("font-size",     d => d.type === "root" ? 22 : d.type === "cat" ? 20 : 17)
        .attr("font-weight",   d => d.type === "root" ? "600" : "400")
        .attr("letter-spacing","0.08em")
        .attr("pointer-events","none");

      enter.call(drag);
      enter.transition().duration(450).attr("opacity", 1);

      nodeGroup.selectAll<SVGGElement, NodeDatum>("g.fgn")
        .on("click", (event, d) => {
          event.stopPropagation();
          selectedId = d.id;
          syncVisuals();
          ADJACENCY.get(d.id)?.forEach(id => visible.add(id));
          setDetailVisible(false);
          setTimeout(() => {
            setDetail({ label: d.label, sub: d.info.sub, desc: d.info.desc });
            setDetailVisible(true);
          }, 150);
          updateGraph();
        });

      syncVisuals();
    }

    updateGraph();
    return () => { sim.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: "100%" }}>
      <h2 style={{
        fontFamily: "'Anton','Impact',sans-serif",
        fontSize: "clamp(0.9rem,1.8vw,1.2rem)",
        color: "rgba(255,255,255,0.25)",
        letterSpacing: "0.35em",
        textTransform: "uppercase",
        margin: "0 0 32px",
        padding: "clamp(40px,6vw,72px) clamp(20px,5vw,64px) 0",
      }}>
        Skills &amp; Experience
      </h2>

      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="700"
          style={{ display: "block" }}
        />
      </div>

      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "10px",
        letterSpacing: "0.25em",
        color: "rgba(255,255,255,0.2)",
        textTransform: "uppercase",
        margin: "14px 0 0",
        textAlign: "center",
      }}>
        Click nodes to expand · drag to rearrange
      </p>

      <div style={{
        marginTop: "36px",
        padding: "28px clamp(20px,5vw,64px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        opacity: detailVisible ? 1 : 0,
        transition: "opacity 0.15s ease",
        minHeight: "96px",
      }}>
        <div style={{
          fontFamily: "'Anton','Impact',sans-serif",
          fontSize: "clamp(1.6rem,4vw,2.6rem)",
          color: "#fff",
          lineHeight: 1,
          marginBottom: detail?.sub ? "8px" : "12px",
        }}>
          {detail?.label}
        </div>
        {detail?.sub && (
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.28em",
            color: "#c0392b",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}>
            {detail.sub}
          </div>
        )}
        <p style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(13px,1.4vw,15px)",
          color: "rgba(255,255,255,0.4)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: "520px",
        }}>
          {detail?.desc}
        </p>
      </div>
    </div>
  );
}

// ─── outer shell — loads data, re-mounts inner when data changes ───────────────
export default function FluentGraph() {
  const [graphKey, setGraphKey] = useState(0);
  const [nodes,    setNodes]    = useState<GraphNode[]>(() => loadNodes());
  const [links,    setLinks]    = useState<GraphLink[]>(() => loadLinks());

  useEffect(() => {
    const handler = () => {
      setNodes(loadNodes());
      setLinks(loadLinks());
      setGraphKey(k => k + 1);
    };
    window.addEventListener(GRAPH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(GRAPH_CHANGE_EVENT, handler);
  }, []);

  return <FluentGraphInner key={graphKey} rawNodes={nodes} rawLinks={links} />;
}
