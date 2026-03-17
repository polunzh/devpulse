---
name: devpulse-start
description: Start the DevPulse server (API + Web UI)
---

Start the DevPulse development hotspot aggregator server.

## Steps

1. Check if a DevPulse server is already running:
   ```bash
   lsof -i :3377 2>/dev/null
   ```

2. If not running, start the server:
   ```bash
   cd <project-root>/packages/web && pnpm start &
   ```

3. Wait for startup and confirm:
   ```bash
   sleep 2 && curl -s http://localhost:3377/api/sites | head -c 100
   ```

4. Report to user: "DevPulse is running at http://localhost:3377"
