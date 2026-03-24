import { createWorker } from "@cloudflare/worker-bundler";

interface RunRequestBody {
  files: Record<string, string>;
  options?: {
    bundle?: boolean;
    minify?: boolean;
  };
}

function buildErrorResponse(error: unknown): Response {
  console.error("Error in orchestrator:", error);
  return Response.json(
    {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    },
    { status: 500 }
  );
}

function normalizeFiles(files: Record<string, string>): Record<string, string> {
  const normalized = Object.fromEntries(
    Object.entries(files)
      .map(([path, contents]) => [path.trim(), contents])
      .filter(([path]) => path.length > 0)
  );

  if (!normalized["package.json"]) {
    const entryPoint =
      normalized["src/index.ts"] || normalized["src/index.js"]
        ? Object.keys(normalized).find((file) => file === "src/index.ts" || file === "src/index.js")
        : Object.keys(normalized).find((file) => file.endsWith(".ts") || file.endsWith(".js"));

    normalized["package.json"] = JSON.stringify(
      {
        name: "dynamic-workers-orchestrator-worker",
        main: entryPoint ?? "src/index.ts",
      },
      null,
      2
    );
  }
  return normalized;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Deploy endpoint
    if (url.pathname.startsWith("/api/deploy/") && request.method === "POST") {
      try {
        const workerName = url.pathname.slice("/api/deploy/".length);
        const { files, options } = (await request.json()) as RunRequestBody;
        
        if (!files || Object.keys(files).length === 0) {
          return Response.json({ error: "At least one source file is required." }, { status: 400 });
        }
        
        const normalizedFiles = normalizeFiles(files);
        const { mainModule, modules, wranglerConfig, warnings } = await createWorker({
          files: normalizedFiles,
          bundle: options?.bundle ?? true,
          minify: options?.minify ?? false,
        });
        
        const bundleData = { mainModule, modules, wranglerConfig, warnings: warnings ?? [] };

        await env.WORKER_FILES.put(workerName, JSON.stringify({ files: normalizedFiles, options }));
        await env.WORKER_FILES.put(`bundle::${workerName}`, JSON.stringify(bundleData));

        return Response.json({ success: true, workerName, warnings: warnings ?? [] });
      } catch (error) {
        return buildErrorResponse(error);
      }
    }

    // Dynamic Execution endpoint
    const pathParts = url.pathname.split("/");
    if (pathParts.length >= 2 && pathParts[1] !== "api" && pathParts[1] !== "") {
      const workerName = pathParts[1];
      const newPathname = "/" + pathParts.slice(2).join("/");

      let bundleObj = null;
      try {
        const cachedBundleStr = await env.WORKER_FILES.get(`bundle::${workerName}`);
        if (cachedBundleStr) {
          bundleObj = JSON.parse(cachedBundleStr);
        } else {
          const rawFilesStr = await env.WORKER_FILES.get(workerName);
          if (rawFilesStr) {
            const { files, options } = JSON.parse(rawFilesStr);
            bundleObj = await createWorker({
              files,
              bundle: options?.bundle ?? true,
              minify: options?.minify ?? false,
            });
            await env.WORKER_FILES.put(`bundle::${workerName}`, JSON.stringify(bundleObj));
          }
        }
      } catch (error) {
        return buildErrorResponse(error);
      }

      if (bundleObj) {
        try {
          const worker = env.LOADER.get(workerName, async () => {
            return {
              mainModule: bundleObj.mainModule,
              modules: bundleObj.modules as Record<string, string>,
              compatibilityDate: bundleObj.wranglerConfig?.compatibilityDate ?? "2026-01-01",
              compatibilityFlags: bundleObj.wranglerConfig?.compatibilityFlags ?? [],
              env: { WORKER_ID: workerName },
              globalOutbound: null
            };
          });

          const entrypoint = worker.getEntrypoint() as Fetcher & { __warmup__?: () => Promise<void> };
          try {
            await entrypoint.__warmup__?.();
          } catch {}

          const workerUrl = new URL(request.url);
          workerUrl.pathname = newPathname;
          const workerRequest = new Request(workerUrl.toString(), request);
          
          return await entrypoint.fetch(workerRequest);
        } catch (error) {
          return buildErrorResponse(error);
        }
      }
    }

    return new Response("Worker not found or unhandled route.", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
