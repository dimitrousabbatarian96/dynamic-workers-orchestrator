# Dynamic Workers Orchestrator

This project is a PNPM monorepo for orchestrating Cloudflare Dynamic Workers. It provides a platform where you can deploy your own TS/JS Cloudflare Workers to a central orchestrator. The orchestrator dynamically bundles and runs them inside its own isolate, caching the compilation in KV, and routing HTTP traffic to them via path prefixes.

## Architecture

The monorepo contains the following packages:

- **`workers/orchestrator`**: The core Cloudflare Worker that dynamically compiles, caches, and executes other workers on the fly.
- **`packages/cli`**: A command-line tool `deploy-worker` to instantly package and deploy a worker directory to the orchestrator.
- **`workers/sample-worker`**: A simple test worker to demonstrate deployment via the CLI.

## How it works

1. You create a new worker (like `sample-worker`).
2. You run the CLI `deploy-worker` script in your worker's directory.
3. The CLI POSTs your raw files to the orchestrator (`/api/deploy/:workerName`).
4. The orchestrator compiles the files using `@cloudflare/worker-bundler`, caches the result in a `WORKER_FILES` KV namespace, and returns success.
5. Setup instances routing: Invocations to `/:workerName/*` on the orchestrator are intercepted, the `/:workerName` prefix is stripped, and the request is routed dynamically to the deployed worker using Cloudflare's `env.LOADER.get()`.

## Getting Started

First, install dependencies from the root:
```bash
pnpm install
```

### 1. Run the Orchestrator
```bash
pnpm dev
```
This will start the Orchestrator dev server locally via Wrangler (usually `http://localhost:8787`).

### 2. Deploy a Worker dynamically

#### Using the Workspace (Locally)
In a new terminal, run the CLI deployment from the sample worker directory (it is already linked thanks to `pnpm` workspaces):

```bash
cd workers/sample-worker
pnpm run deploy
```

#### Using `npm link` (Globally)
If you want to use the `deploy-worker` command in any directory on your computer (outside this monorepo):

```bash
cd packages/cli
pnpm link --global # or npm link
```
Now you can go to any folder containing a `package.json` and Cloudflare worker files, and simply type:
```bash
deploy-worker
```

### 3. Test execution
Hit the newly deployed worker through the orchestrator's path routing:
```bash
curl http://localhost:8787/sample-worker/test-route
```
You should see: `[sample-worker] Hello! You requested path: /test-route`
