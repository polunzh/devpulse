---
name: devpulse-stop
description: Stop the DevPulse server
---

Stop the running DevPulse server.

## Steps

1. Find the server process:
   ```bash
   lsof -ti :3377
   ```

2. Kill the process:
   ```bash
   kill $(lsof -ti :3377)
   ```

3. Confirm: "DevPulse server stopped."
