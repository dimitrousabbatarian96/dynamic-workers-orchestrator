# Dynamic Workers Playground

This is a playground for executing Dynamic Workers.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dinasaur404/dynamic-workers-playground)

You can use it to:

- write or import worker code
- bundle it at runtime with [`@cloudflare/worker-bundler`](https://www.npmjs.com/package/@cloudflare/worker-bundler)
- run it through a dynamic worker loader
- see real-time responses, logs, timing, and bundle details

> **Note:** This playground will allow users to excute arbitrary Worker code once it's deployed. Before sharing the URL publicly, we recommend protecting it with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/) to restrict access to trusted users. Alternatively, test it locally first with `npm start` before deploying.

## What it demonstrates

**Server-side**
- Runtime bundling with `@cloudflare/worker-bundler` — resolves npm deps and bundles source files inside a Worker
- Dynamic execution via a `worker_loaders` binding, with automatic caching when source hasn't changed
- Log capture pipeline — a Tail Worker (`DynamicWorkerTail`) forwards `console.*` output from dynamically loaded workers to a Durable Object (`LogSession`), streamed back to the caller in real time
- Execution timing — granular build/load/run breakdown with cold vs. warm start detection

**Client-side**
- Tabbed file editor with Tab-key indentation support
- Load built-in example workers or import any public GitHub repo
- Bundle/minify toggles passed through to `worker-bundler`
- Real-time output: response body, console logs, timing, and bundle info

## Running

```bash
npm install
npm start
```

Open [http://localhost:5173](http://localhost:5173).

To deploy:

```bash
npm run deploy
```

## How it works

When you click **Run Worker**, the host Worker receives your source files and calls `createWorker()` from `@cloudflare/worker-bundler` to bundle them at runtime:

```ts
const { mainModule, modules } = await createWorker({
  files: normalizedFiles,
  bundle: true,
  minify: false,
});

const worker = env.LOADER.get(workerId, async () => ({
  mainModule,
  modules,
  tails: [contextExports.DynamicWorkerTail({ props: { workerId } })],
}));

const response = await worker.getEntrypoint().fetch(request);
```

Console logs from the dynamic worker are captured by `DynamicWorkerTail` (a Tail Worker) and routed through a `LogSession` Durable Object back to the HTTP response.

## Project structure

```
src/
  server.ts    Host worker — API routes (/api/run, /api/github)
  github.ts    GitHub import helper
  logging.ts   Tail Worker + Durable Object logging pipeline
  client.tsx   React frontend
  styles.css   Tailwind + Kumo styles
```

## Related examples

- [cloudflare/agents — playground](https://github.com/cloudflare/agents/tree/main/examples/playground) — full Agents SDK kitchen-sink demo (also uses `worker_loaders`)
