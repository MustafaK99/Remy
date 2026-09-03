import type { Metadata } from "next";
import { DemoLoader } from "@/components/demo/demo-loader";

export const metadata: Metadata = {
  title: "Live WebMCP demo",
  description:
    "Use WebMCP to return order #1842 while Remy runs reversible work, records receipts, and pauses the refund for approval.",
};

export default function DemoPage() {
  return <DemoLoader />;
}
