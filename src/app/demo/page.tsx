import type { Metadata } from "next";
import { DemoLoader } from "@/components/demo/demo-loader";

export const metadata: Metadata = {
  title: "Live WebMCP demo",
  description:
    "See Remy apply autonomy, record changes, support recovery, and pause consequential WebMCP actions inside a fictional shop.",
};

export default function DemoPage() {
  return <DemoLoader />;
}
