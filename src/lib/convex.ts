import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL;
if (!url) {
  throw new Error("VITE_CONVEX_URL is not set. Did you run `bunx convex dev`?");
}

export const convex = new ConvexReactClient(url);
