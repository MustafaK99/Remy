"use client";

import dynamic from "next/dynamic";

const DemoApp = dynamic(
  () => import("./demo-app").then((module) => module.DemoApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#eeece6]" aria-label="Loading Remy demo" />
    ),
  },
);

export function DemoLoader() {
  return <DemoApp />;
}
