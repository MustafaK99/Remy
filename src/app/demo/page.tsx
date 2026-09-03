import type { Metadata } from "next";
import { DemoLoader } from "@/components/demo/demo-loader";

export const metadata: Metadata = {
  title: "WebMCP return demo",
  description:
    "Watch a browser assistant return an ecommerce order through WebMCP while Remy shows each change and asks before refunding money.",
};

export default function DemoPage() {
  return <DemoLoader />;
}
