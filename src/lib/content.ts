export type TileType = "wide"|"tall"|"mini2"|"thin"|"sq"|"mini"|"med"|"strip";

export interface MenuItem {
  label: string;
  target: "fluency"|"fixations"|"contact";
}

export interface Language {
  name: string;
  native: string;
  levelLabel: string;
  percent: number;
  levelText: string;
}

export interface FixArticle {
  id: number;
  type: TileType;
  category: string;
  title: string;
  body?: string;
  accent?: boolean;
  lede?: string;
  contentHtml?: string;
}

export interface HpContent {
  home: { title: string; menuItems: MenuItem[] };
  fluency: {
    eyebrow: string;
    subtitle: string;
    sectionHeading: string;
    languages: Language[];
    quote: string;
    attribution: string;
  };
  fixations: FixArticle[];
  contact: { eyebrow: string; tagline: string; email: string };
}

export const DEFAULT_CONTENT: HpContent = {
  home: {
    title: "HASAN'S PLAYGROUND",
    menuItems: [
      { label: "FLUENCY",   target: "fluency" },
      { label: "FIXATIONS", target: "fixations" },
      { label: "CONTACT",   target: "contact" },
    ],
  },
  fluency: {
    eyebrow: "01 — FLUENCY",
    subtitle: "Language as lens. The words you know shape the world you see.",
    sectionHeading: "Languages Lived In",
    languages: [
      { name: "Arabic",  native: "العربية",  levelLabel: "Native",        percent: 100, levelText: "The first language, the one that holds the oldest memories." },
      { name: "English", native: "English",  levelLabel: "Fluent",         percent: 95,  levelText: "The language of ambition, of building, of becoming." },
      { name: "French",  native: "Français", levelLabel: "Conversational", percent: 60,  levelText: "Learned in school, kept alive by music and film." },
    ],
    quote: "Every language you speak is a different version of yourself.",
    attribution: "— Unknown",
  },
  fixations: [
    { id:1,  type:"wide",  category:"CULTURE",    title:"ARAB IDENTITY IN THE WEST",    body:"The unresolved negotiation between where you're from and where you've landed. The hyphen as home.", accent:true },
    { id:2,  type:"tall",  category:"TECH",       title:"HOW AI REWRITES MEMORY",       body:"A machine can learn what I know — but it can't inherit what I've forgotten." },
    { id:3,  type:"mini2", category:"AESTHETICS", title:"THE GRAMMAR OF SILENCE" },
    { id:4,  type:"thin",  category:"IDEA",       title:"POLYGLOTISM AS EMPATHY" },
    { id:5,  type:"sq",    category:"FILM",       title:"CINEMA AS PHILOSOPHY",          body:"Obsessing over films and what they quietly teach you." },
    { id:6,  type:"mini",  category:"TECH",       title:"OPEN SOURCE ETHICS" },
    { id:7,  type:"mini",  category:"IDEA",       title:"DEATH OF EXPERTISE" },
    { id:8,  type:"med",   category:"DESIGN",     title:"BRUTALISM AS BEAUTY",           body:"Rawness isn't a flaw. The unfinished surface is the honest one." },
    { id:9,  type:"sq",    category:"FILM",       title:"TIME AS A MATERIAL",            body:"What you choose to show reveals everything." },
    { id:10, type:"strip", category:"FEATURE",    title:"MUSIC THAT DOESN'T RESOLVE" },
  ],
  contact: {
    eyebrow: "03 — Reach Out",
    tagline: "Let's build something worth talking about.",
    email: "hchybli@gmail.com",
  },
};

const KEY = "hp_content";

export function loadContent(): HpContent {
  if (typeof window === "undefined") return DEFAULT_CONTENT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_CONTENT;
    const p = JSON.parse(raw) as Partial<HpContent>;
    return {
      home:      { ...DEFAULT_CONTENT.home,    ...p.home },
      fluency:   { ...DEFAULT_CONTENT.fluency, ...p.fluency },
      fixations: p.fixations ?? DEFAULT_CONTENT.fixations,
      contact:   { ...DEFAULT_CONTENT.contact, ...p.contact },
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}

export function saveContent(c: HpContent): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(c));
}
