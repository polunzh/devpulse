---
name: devpulse-fetch
description: Manually trigger content fetch from all or specific sites
---

Trigger a manual content fetch from configured sites.

## Arguments

- No args: fetch from all enabled sites
- Site name: fetch from a specific site (e.g., `/devpulse-fetch hackernews`)

## Steps

1. Call the fetch API:
   ```bash
   curl -s -X POST http://localhost:3377/api/fetch \
     -H 'Content-Type: application/json' \
     -d '{}' # or {"siteId": "<id>"} for specific site
   ```

2. If a site name is given as argument, first look up the site ID:
   ```bash
   curl -s http://localhost:3377/api/sites
   ```
   Then pass the matching `siteId` in the fetch request body.

3. Report results: "Fetch complete. Check http://localhost:3377 for new posts."
