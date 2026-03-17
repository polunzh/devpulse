---
name: devpulse-status
description: Check DevPulse server status and site fetch times
---

Show the current status of the DevPulse server and configured sites.

## Steps

1. Check if server is running:
   ```bash
   curl -sf http://localhost:3377/api/sites > /dev/null 2>&1 && echo "running" || echo "stopped"
   ```

2. If running, fetch site list:
   ```bash
   curl -s http://localhost:3377/api/sites
   ```

3. Display a status table:
   - Server: running/stopped
   - URL: http://localhost:3377
   - For each site: name, adapter, enabled, last fetched time, fetch interval
