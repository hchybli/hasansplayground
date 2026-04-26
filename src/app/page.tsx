"use client";

import dynamic from "next/dynamic";

const Gallery3D = dynamic(() => import("@/components/Gallery3D"), { ssr: false });

export default function Home() {
  return <Gallery3D />;
}
