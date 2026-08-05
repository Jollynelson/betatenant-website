import { readFileSync, writeFileSync, cpSync } from "node:fs";
import { join } from "node:path";

const OUT = ".open-next";

// Read worker.js, strip DO exports, and wrap fetch handler with error reporting
let worker = readFileSync(join(OUT, "worker.js"), "utf8");

// Remove Durable Object exports — these import from "cloudflare:workers" and crash
// if the binding isn't configured (Pages doesn't support DO bindings without config)
worker = worker.replace(/^\/\/@ts-expect-error.*\nexport \{ DOQueueHandler \}.*$/m, "");
worker = worker.replace(/^\/\/@ts-expect-error.*\nexport \{ DOShardedTagCache \}.*$/m, "");
worker = worker.replace(/^\/\/@ts-expect-error.*\nexport \{ BucketCachePurge \}.*$/m, "");

// Replace the export default block to add error catching
worker = worker.replace(
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `export default {
    async fetch(request, env, ctx) {
      try {
        return await runWithCloudflareRequestContext(request, env, ctx, async () => {`
);

// Close the try/catch at the end
worker = worker.replace(
  /(\s+}\);\s+}\s*,?\s*};)\s*$/,
  `        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    },
};`
);

writeFileSync(join(OUT, "_worker.js"), worker);

// Copy static assets to output root so Pages serves them at /
cpSync(join(OUT, "assets"), OUT, { recursive: true });

// Create _routes.json to tell Pages which routes are static vs dynamic
const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/favicon.ico",
    "/icons/*",
    "/images/*",
    "/manifest.json",
    "/sw.js",
    "/file.svg",
    "/globe.svg",
    "/next.svg",
    "/vercel.svg",
    "/window.svg",
    "/_next/static/*"
  ]
};
writeFileSync(join(OUT, "_routes.json"), JSON.stringify(routes, null, 2));

console.log("Pages output prepared (_worker.js with error reporting + _routes.json + assets).");
