import "./styles.css";
import {
  Button,
  DropdownMenu,
  Input,
  Surface,
  Textarea,
} from "@cloudflare/kumo";
import {
  CaretDown,
  FileText,
  GithubLogo,
  Info,
  Monitor,
  Moon,
  Play,
  Plus,
  Sun,
  X,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  size?: "sm" | "lg";
  children: React.ReactNode;
}

function Modal({ open, onClose, title, size = "sm", children }: ModalProps) {
  if (!open) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
        }}
      />
      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "var(--color-kumo-surface)",
          border: "1px solid var(--color-kumo-line, #e5e7eb)",
          borderRadius: 12,
          padding: 24,
          width: size === "lg" ? 480 : 360,
          maxWidth: "calc(100vw - 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-color-kumo-default)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {title}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid var(--color-kumo-line, #e5e7eb)",
              background: "var(--color-kumo-surface)",
              cursor: "pointer",
              color: "var(--text-color-kumo-default)",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

type PlaygroundFiles = Record<string, string>;

interface RunResult {
  bundleInfo: {
    mainModule: string;
    modules: string[];
    warnings: string[];
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  workerError: {
    message: string;
    stack?: string;
  } | null;
  logs: Array<{
    level: string;
    message: string;
    timestamp: number;
  }>;
  timing: {
    buildTime: number;
    loadTime: number;
    runTime: number;
    totalTime: number;
  };
}

interface GitHubImportResult {
  error?: string;
  files?: PlaygroundFiles;
}

type StatusTone = "idle" | "running" | "success" | "error";

const EXAMPLES: Array<{
  id: string;
  label: string;
  files: PlaygroundFiles;
}> = [
  {
    id: "simple",
    label: "Simple Worker",
    files: {
      "src/index.ts": `export default {
  fetch(request: Request): Response {
    return new Response("Hello from dynamic worker!");
  }
};`,
      "package.json": JSON.stringify(
        { name: "simple-worker", main: "src/index.ts" },
        null,
        2
      ),
    },
  },
  {
    id: "multi-file",
    label: "Multi-file Worker",
    files: {
      "src/index.ts": `import { greet } from "./utils";
import { formatDate } from "./helpers/date";

export default {
  fetch(request: Request): Response {
    const message = greet("World");
    const time = formatDate(new Date());
    return new Response(\`\${message}\\nTime: \${time}\`);
  }
};`,
      "src/utils.ts": `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`,
      "src/helpers/date.ts": `export function formatDate(date: Date): string {
  return date.toISOString();
}`,
      "package.json": JSON.stringify(
        { name: "multi-file-worker", main: "src/index.ts" },
        null,
        2
      ),
    },
  },
  {
    id: "json-config",
    label: "JSON Config",
    files: {
      "src/index.ts": `import config from "./config.json";

export default {
  fetch(request: Request): Response {
    return new Response(
      JSON.stringify(
        {
          app: config.name,
          version: config.version,
          features: config.features
        },
        null,
        2
      ),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};`,
      "src/config.json": JSON.stringify(
        {
          name: "My App",
          version: "1.0.0",
          features: ["auth", "api", "webhooks"],
        },
        null,
        2
      ),
      "package.json": JSON.stringify(
        { name: "config-worker", main: "src/index.ts" },
        null,
        2
      ),
    },
  },
  {
    id: "with-env",
    label: "With Env Bindings",
    files: {
      "src/index.ts": `interface Env {
  API_KEY: string;
  DEBUG: string;
}

export default {
  fetch(request: Request, env: Env): Response {
    const data = {
      hasApiKey: !!env.API_KEY,
      apiKeyPreview: env.API_KEY ? env.API_KEY.slice(0, 4) + "..." : null,
      debugMode: env.DEBUG === "true"
    };

    return new Response(JSON.stringify(data, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }
};`,
      "package.json": JSON.stringify(
        { name: "env-worker", main: "src/index.ts" },
        null,
        2
      ),
    },
  },
  {
    id: "api-router",
    label: "API Router",
    files: {
      "src/index.ts": `import { handleUsers } from "./routes/users";
import { handleHealth } from "./routes/health";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return handleHealth();
    }

    if (url.pathname.startsWith("/users")) {
      return handleUsers(request);
    }

    return new Response(
      JSON.stringify(
        {
          error: "Not Found",
          availableRoutes: ["/health", "/users"]
        },
        null,
        2
      ),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};`,
      "src/routes/users.ts": `const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

export function handleUsers(request: Request): Response {
  return new Response(JSON.stringify({ users }), {
    headers: { "Content-Type": "application/json" }
  });
}`,
      "src/routes/health.ts": `export function handleHealth(): Response {
  return new Response(
    JSON.stringify(
      {
        status: "healthy",
        timestamp: new Date().toISOString()
      },
      null,
      2
    ),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}`,
      "package.json": JSON.stringify(
        { name: "api-router", main: "src/index.ts" },
        null,
        2
      ),
    },
  },
];

function snapshotFiles(files: PlaygroundFiles) {
  return JSON.stringify(files);
}

function inferPrimaryFile(files: PlaygroundFiles) {
  return (
    Object.keys(files).find(
      (file) => file === "src/index.ts" || file === "src/index.js"
    ) ||
    Object.keys(files).find(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    ) ||
    Object.keys(files)[0]
  );
}

function prettyBody(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function getContentType(headers: Record<string, string>) {
  const match = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === "content-type"
  );
  return match?.[1] ?? "text/plain";
}

function statusClassName(status: StatusTone) {
  if (status === "success") return "success";
  if (status === "error") return "error";
  if (status === "running") return "loading";
  return "idle";
}

function consolePrefix(level: string) {
  if (level === "error") return "✕";
  if (level === "warn") return "!";
  return "›";
}

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  function toggle() {
    const next = !dark;
    setDark(next);
    const mode = next ? "dark" : "light";
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem("theme", mode);
  }

  return { dark, toggle };
}

function LayersLogo() {
  return (
    <svg
      className="brand-logo"
      viewBox="0 0 48 49"
      aria-hidden="true"
      style={{ width: 32, height: 32, flexShrink: 0, fill: "#f6821f" }}
    >
      <path d="m18.63 37.418-9.645-12.9 9.592-12.533-1.852-2.527L5.917 23.595l-.015 1.808 10.86 14.542z" />
      <path d="M21.997 6.503h-3.712l13.387 18.3-13.072 17.7h3.735L35.4 24.81z" />
      <path d="M29.175 6.503h-3.758l13.598 18.082-13.598 17.918h3.765l12.908-17.01v-1.808z" />
    </svg>
  );
}

function PoweredByWorkers() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "12px 0",
        fontSize: 12,
        color: "var(--text-color-kumo-subdued, #6b7280)",
      }}
    >
      <span>Powered by</span>
      <a
        href="https://workers.cloudflare.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: "inherit",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        <LayersLogo />
        <span>Cloudflare Workers</span>
      </a>
    </div>
  );
}

export function App() {
  const { dark, toggle: toggleDark } = useDarkMode();
  const initialExample = EXAMPLES[0];
  const [files, setFiles] = useState<PlaygroundFiles>({
    ...initialExample.files,
  });
  const [currentFile, setCurrentFile] = useState(
    inferPrimaryFile(initialExample.files)
  );
  const [bundle, setBundle] = useState(true);
  const [minify, setMinify] = useState(false);
  const [status, setStatus] = useState<{ tone: StatusTone; label: string }>({
    tone: "idle",
    label: "Ready",
  });
  const [workerVersion, setWorkerVersion] = useState(0);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<{
    message: string;
    stack?: string;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [addFileName, setAddFileName] = useState("");
  const [githubUrl, setGitHubUrl] = useState("");

  const orderedFiles = useMemo(() => Object.keys(files), [files]);
  const currentValue = currentFile ? (files[currentFile] ?? "") : "";

  function applyFiles(nextFiles: PlaygroundFiles) {
    setFiles(nextFiles);
    setCurrentFile(inferPrimaryFile(nextFiles));
    setResult(null);
    setError(null);
    setStatus({ tone: "idle", label: "Ready" });
  }

  function handleExampleChange(exampleId: string) {
    const example = EXAMPLES.find((item) => item.id === exampleId);
    if (!example) return;
    applyFiles({ ...example.files });
  }

  function updateCurrentFile(value: string) {
    if (!currentFile) return;
    setFiles((prev) => ({ ...prev, [currentFile]: value }));
  }

  function handleAddFile() {
    const filename = addFileName.trim();
    if (!filename) return;
    if (files[filename]) {
      window.alert("File already exists");
      return;
    }

    const nextFiles = {
      ...files,
      [filename]: filename.endsWith(".json") ? "{}" : "",
    };

    setFiles(nextFiles);
    setCurrentFile(filename);
    setAddFileName("");
    setAddFileOpen(false);
  }

  function removeFile(filename: string) {
    if (Object.keys(files).length <= 1) {
      window.alert("Cannot delete the last file");
      return;
    }

    const nextFiles = { ...files };
    delete nextFiles[filename];
    setFiles(nextFiles);

    if (currentFile === filename) {
      setCurrentFile(Object.keys(nextFiles)[0]);
    }
  }

  function formatCurrentFile() {
    if (!currentFile || !currentFile.endsWith(".json")) {
      return;
    }

    try {
      const parsed = JSON.parse(currentValue);
      updateCurrentFile(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore invalid JSON formatting requests.
    }
  }

  async function importFromGitHub() {
    const url = githubUrl.trim();

    if (!url) {
      window.alert("Please enter a GitHub URL");
      return;
    }

    if (!url.startsWith("https://github.com/")) {
      window.alert(
        "Please enter a valid GitHub URL (https://github.com/...)"
      );
      return;
    }

    setImporting(true);
    setStatus({ tone: "running", label: "Importing from GitHub..." });

    try {
      const response = await fetch("/api/github", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const rawData: unknown = await response.json();
      const data = rawData as GitHubImportResult;
      if (!response.ok || data.error) {
        throw new Error(data.error || "GitHub import failed.");
      }

      const importedFiles = data.files ?? {};
      if (!importedFiles["package.json"]) {
        const mainFile =
          Object.keys(importedFiles).find(
            (file) =>
              file === "src/index.ts" ||
              file === "src/index.js" ||
              file === "index.ts" ||
              file === "index.js"
          ) ||
          Object.keys(importedFiles).find(
            (file) => file.endsWith(".ts") || file.endsWith(".js")
          );

        if (mainFile) {
          importedFiles["package.json"] = JSON.stringify(
            { name: "imported-worker", main: mainFile },
            null,
            2
          );
        }
      }

      applyFiles(importedFiles);
      setGitHubUrl("");
      setGithubOpen(false);
      setStatus({
        tone: "success",
        label: `Imported ${Object.keys(importedFiles).length} file${Object.keys(importedFiles).length === 1 ? "" : "s"}`,
      });
    } catch (importError) {
      setStatus({ tone: "error", label: "Import failed" });
      window.alert(
        importError instanceof Error
          ? importError.message
          : String(importError)
      );
    } finally {
      setImporting(false);
    }
  }

  async function runWorker() {
    setRunning(true);
    setError(null);
    setStatus({ tone: "running", label: "Bundling..." });

    try {
      const nextSnapshot = snapshotFiles(files);
      const nextVersion =
        nextSnapshot === lastSnapshot ? workerVersion : workerVersion + 1;

      if (nextVersion !== workerVersion) {
        setWorkerVersion(nextVersion);
        setLastSnapshot(nextSnapshot);
      }

      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files,
          version: nextVersion,
          options: { bundle, minify },
        }),
      });

      const rawPayload: unknown = await response.json();
      const payload = rawPayload as RunResult & {
        error?: string;
        stack?: string;
      };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Failed to run worker.");
      }

      setResult(payload);

      if (payload.workerError) {
        setStatus({ tone: "error", label: "Runtime Error" });
      } else {
        setStatus({ tone: "success", label: "Success" });
      }
    } catch (runError) {
      const nextError = {
        message:
          runError instanceof Error ? runError.message : String(runError),
        stack: runError instanceof Error ? runError.stack : undefined,
      };

      setResult(null);
      setError(nextError);
      setStatus({ tone: "error", label: "Bundle Error" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 1400,
          margin: "0 auto",
          width: "100%",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Explainer card */}
        <Surface>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 16,
            }}
          >
            <Info
              size={20}
              style={{
                flexShrink: 0,
                marginTop: 2,
                color: "var(--color-kumo-brand, #f6821f)",
              }}
            />
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text-color-kumo-default)",
                }}
              >
                Dynamic Workers Playground
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--text-color-kumo-subdued)",
                }}
              >
                Write, bundle, and run Cloudflare Worker code directly in your
                browser using{" "}
                <code
                  style={{
                    fontFamily: "monospace",
                    background: "var(--color-kumo-surface)",
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  @cloudflare/worker-bundler
                </code>
                . Edit files, load an example, or import from GitHub — then
                click <strong>Run Worker</strong> to see the response, console
                logs, and timing in real time.
              </p>
            </div>
          </div>
        </Surface>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LayersLogo />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--text-color-kumo-default)",
                }}
              >
                Dynamic Workers Playground
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--text-color-kumo-subdued)",
                }}
              >
                Build and run Workers dynamically from source code
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              aria-live="polite"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  display: "inline-block",
                  backgroundColor:
                    status.tone === "success"
                      ? "#16a34a"
                      : status.tone === "error"
                        ? "#dc2626"
                        : status.tone === "running"
                          ? "#f59e0b"
                          : "#9ca3af",
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-color-kumo-subdued)",
                }}
              >
                {status.label}
              </span>
            </div>

            <button
              type="button"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={toggleDark}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid var(--color-kumo-border, #e5e7eb)",
                background: "var(--color-kumo-surface, #ffffff)",
                cursor: "pointer",
                color: "var(--text-color-kumo-subdued)",
                flexShrink: 0,
              }}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 16,
            flex: 1,
          }}
        >
          {/* Source panel */}
          <Surface
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 600,
              minWidth: 0,
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom:
                  "1px solid var(--color-kumo-border, #e5e7eb)",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-color-kumo-default)",
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                <FileText size={16} style={{ flexShrink: 0 }} />
                <span>Source Files</span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
              >
                <DropdownMenu>
                  <DropdownMenu.Trigger
                    render={
                      <Button variant="secondary">
                        Load Example...
                        <CaretDown size={13} />
                      </Button>
                    }
                  />
                  <DropdownMenu.Content style={{ background: "var(--color-kumo-surface)" }}>
                    {EXAMPLES.map((example) => (
                      <DropdownMenu.Item
                        key={example.id}
                        onClick={() => handleExampleChange(example.id)}
                      >
                        {example.label}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu>

                <Button
                  variant="secondary"
                  onClick={() => setGithubOpen(true)}
                >
                  <GithubLogo size={16} weight="fill" />
                  Import from GitHub
                </Button>
              </div>
            </div>

            {/* File tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                borderBottom: "1px solid var(--color-kumo-border, #e5e7eb)",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: "0 8px",
                  overflowX: "auto",
                  overflowY: "hidden",
                  flex: "1 1 auto",
                  minWidth: 0,
                  flexWrap: "nowrap",
                }}
              >
                {orderedFiles.map((filename) => (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => setCurrentFile(filename)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontFamily: "monospace",
                      background: "none",
                      border: "none",
                      borderBottom:
                        filename === currentFile
                          ? "2px solid var(--color-kumo-brand, #f6821f)"
                          : "2px solid transparent",
                      color:
                        filename === currentFile
                          ? "var(--text-color-kumo-default)"
                          : "var(--text-color-kumo-subdued)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flex: "0 0 auto",
                    }}
                  >
                    <span>{filename}</span>
                    {filename !== "package.json" ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(filename);
                        }}
                        style={{
                          fontSize: 10,
                          lineHeight: 1,
                          opacity: 0.6,
                          cursor: "pointer",
                          padding: "0 2px",
                        }}
                      >
                        ×
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 8px 0 0",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setAddFileOpen(true)}
                  aria-label="Add new file"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 8px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-color-kumo-subdued)",
                    borderRadius: 4,
                  }}
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Editor */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Textarea
                aria-label="Worker source code"
                spellCheck={false}
                placeholder="Select a file or add a new one..."
                value={currentValue}
                onChange={(e) => updateCurrentFile(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Tab") return;
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const next = `${currentValue.slice(0, start)}  ${currentValue.slice(end)}`;
                  updateCurrentFile(next);
                  queueMicrotask(() => {
                    target.selectionStart = start + 2;
                    target.selectionEnd = start + 2;
                  });
                }}
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: 13,
                  resize: "none",
                  border: "none",
                  borderRadius: 0,
                  minHeight: 380,
                }}
              />
            </div>

            {/* Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderTop: "1px solid var(--color-kumo-border, #e5e7eb)",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  variant="primary"
                  disabled={running}
                  onClick={() => void runWorker()}
                >
                  <Play size={14} weight="fill" />
                  {running ? "Running..." : "Run Worker"}
                </Button>
                <Button variant="secondary" onClick={formatCurrentFile}>
                  Format
                </Button>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { label: "Bundle", checked: bundle, onChange: setBundle },
                  { label: "Minify", checked: minify, onChange: setMinify },
                ].map(({ label, checked, onChange }) => (
                  <label
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "var(--text-color-kumo-default)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChange(e.target.checked)}
                      style={{
                        width: 14,
                        height: 14,
                        cursor: "pointer",
                        accentColor: "var(--color-kumo-brand, #f6821f)",
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </Surface>

          {/* Output panel */}
          <Surface
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 600,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                borderBottom:
                  "1px solid var(--color-kumo-border, #e5e7eb)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-color-kumo-default)",
              }}
            >
              <Monitor size={16} />
              <span>Output</span>
            </div>

            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {error ? (
                <div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "#dc2626",
                    }}
                  >
                    Error
                  </p>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "#dc2626",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {error.message}
                  </pre>
                  {error.stack ? (
                    <pre
                      style={{
                        margin: "8px 0 0",
                        fontSize: 11,
                        fontFamily: "monospace",
                        color: "#9ca3af",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {error.stack}
                    </pre>
                  ) : null}
                </div>
              ) : null}

              {!error && !result ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    color: "var(--text-color-kumo-subdued)",
                  }}
                >
                  <Play size={48} />
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Click &ldquo;Run Worker&rdquo; to bundle and execute your
                    code
                  </p>
                </div>
              ) : null}

              {!error && result ? (
                <>
                  {/* Response */}
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: result.workerError
                          ? "#dc2626"
                          : "var(--text-color-kumo-subdued)",
                      }}
                    >
                      {result.workerError
                        ? "Worker Error"
                        : `Response (${result.response.status})`}
                    </p>

                    {result.workerError ? (
                      <>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontFamily: "monospace",
                            color: "#dc2626",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {result.workerError.message}
                        </pre>
                        {result.workerError.stack ? (
                          <pre
                            style={{
                              margin: "8px 0 0",
                              fontSize: 11,
                              fontFamily: "monospace",
                              color: "#9ca3af",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {result.workerError.stack}
                          </pre>
                        ) : null}
                      </>
                    ) : (
                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 11,
                            color: "var(--text-color-kumo-subdued)",
                            fontFamily: "monospace",
                          }}
                        >
                          Content-Type: {getContentType(result.response.headers)}
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 12,
                            fontFamily: "monospace",
                            color: "#16a34a",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            background: "var(--color-kumo-surface)",
                            padding: 10,
                            borderRadius: 6,
                          }}
                        >
                          {prettyBody(result.response.body)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Console */}
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-color-kumo-subdued)",
                      }}
                    >
                      Console
                      {result.logs.length
                        ? ` (${result.logs.length} log${result.logs.length === 1 ? "" : "s"})`
                        : ""}
                    </p>
                    <div
                      style={{
                        background: "var(--color-kumo-surface)",
                        borderRadius: 6,
                        padding: 10,
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                    >
                      {result.logs.length ? (
                        result.logs.map((log, i) => (
                          <div
                            key={`${log.timestamp}-${i}`}
                            style={{
                              display: "flex",
                              gap: 6,
                              color:
                                log.level === "error"
                                  ? "#dc2626"
                                  : log.level === "warn"
                                    ? "#d97706"
                                    : "var(--text-color-kumo-default)",
                            }}
                          >
                            <span style={{ opacity: 0.5 }}>
                              {consolePrefix(log.level)}
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))
                      ) : (
                        <span
                          style={{
                            color: "var(--text-color-kumo-subdued)",
                            fontSize: 12,
                          }}
                        >
                          No console output. Use{" "}
                          <code>console.log()</code> in your worker to see
                          logs here.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-color-kumo-subdued)",
                      }}
                    >
                      Timing (
                      {result.timing.loadTime > 0 ? "cold" : "warm"})
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                      }}
                    >
                      {[
                        { label: "Build", value: result.timing.buildTime },
                        { label: "Load", value: result.timing.loadTime },
                        { label: "Run", value: result.timing.runTime },
                        { label: "Total", value: result.timing.totalTime },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            background: "var(--color-kumo-surface)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--text-color-kumo-subdued)",
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 14,
                              fontWeight: 600,
                              fontFamily: "monospace",
                            }}
                          >
                            {value}ms
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bundle info */}
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-color-kumo-subdued)",
                      }}
                    >
                      Bundle Info
                    </p>
                     <div
                      style={{
                        background: "var(--color-kumo-surface)",
                        borderRadius: 6,
                        padding: 10,
                        fontSize: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <p style={{ margin: 0, fontFamily: "monospace" }}>
                        <strong>Main:</strong> {result.bundleInfo.mainModule}
                      </p>

                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 11,
                            color: "var(--text-color-kumo-subdued)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Modules ({result.bundleInfo.modules.length})
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {result.bundleInfo.modules.map((m) => (
                            <span
                              key={m}
                              style={{
                                background: "var(--color-kumo-tint)",
                                color: "var(--color-kumo-brand, #f6821f)",
                                borderRadius: 4,
                                padding: "2px 6px",
                                fontSize: 11,
                                fontFamily: "monospace",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {result.bundleInfo.warnings.length ? (
                        <div>
                          <p
                            style={{
                              margin: "0 0 4px",
                              fontSize: 11,
                              color: "#d97706",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Warnings
                          </p>
                          <pre
                            style={{
                              margin: 0,
                              fontSize: 11,
                              fontFamily: "monospace",
                              color: "#d97706",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {result.bundleInfo.warnings.join("\n")}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </Surface>
        </div>

        {/* Footer */}
        <PoweredByWorkers />
      </div>

      {/* Add file modal */}
      <Modal
        open={addFileOpen}
        onClose={() => setAddFileOpen(false)}
        title="Add New File"
        size="sm"
      >
        <Input
          autoFocus
          aria-label="New file name"
          placeholder="e.g., src/utils.ts"
          value={addFileName}
          onChange={(e) => setAddFileName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddFile();
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={() => setAddFileOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddFile}>
            Add File
          </Button>
        </div>
      </Modal>

      {/* GitHub import modal */}
      <Modal
        open={githubOpen}
        onClose={() => setGithubOpen(false)}
        title={
          <>
            <GithubLogo size={18} weight="fill" />
            Import from GitHub
          </>
        }
        size="lg"
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--text-color-kumo-subdued)",
            overflowWrap: "break-word",
          }}
        >
          Paste a GitHub URL to import files from any repository. Supports
          repos, branches, and subdirectories.
        </p>
        <Input
          autoFocus
          aria-label="GitHub URL"
          placeholder="https://github.com/owner/repo/tree/branch/path"
          value={githubUrl}
          onChange={(e) => setGitHubUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void importFromGitHub();
          }}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 12 }}>
          <span style={{ color: "var(--text-color-kumo-subdued)" }}>
            Example:{" "}
          </span>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              cursor: "pointer",
              color: "var(--color-kumo-brand, #f6821f)",
              textDecoration: "underline",
            }}
            onClick={() =>
              setGitHubUrl(
                "https://github.com/honojs/starter/tree/main/templates/cloudflare-workers"
              )
            }
          >
            Hono Starter
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" onClick={() => setGithubOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={importing}
            onClick={() => void importFromGitHub()}
          >
            Import
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
