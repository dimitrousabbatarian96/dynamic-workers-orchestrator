#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error("No package.json found in current directory.");
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const workerName = pkg.name;
  if (!workerName) {
    console.error("package.json must have a 'name' field.");
    process.exit(1);
  }

  const files = {};

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Ignore common non-source directories
      if (['node_modules', '.git', 'dist', '.wrangler', '.vscode'].includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(cwd, fullPath);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        // Skip binary files or lockfiles to keep payload small
        if (entry.name === 'package-lock.json' || entry.name === 'pnpm-lock.yaml') continue;
        files[relativePath] = fs.readFileSync(fullPath, 'utf8');
      }
    }
  }

  walk(cwd);

  const url = process.env.ORCHESTRATOR_URL || 'http://localhost:8787/api/deploy';
  console.log(`Deploying ${workerName} to ${url}/${workerName}...`);

  const response = await fetch(`${url}/${workerName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, options: { bundle: true, minify: false } })
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Deploy failed: ${response.status} ${text}`);
    process.exit(1);
  }

  console.log(`Deployed successfully! Target: http://localhost:8787/${workerName}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
