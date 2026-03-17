---
name: devpulse-add-site
description: Add a new site to DevPulse
---

Interactively add a new site to the DevPulse aggregator.

## Steps

1. Ask the user which adapter to use:
   - `hackernews` — Hacker News (no config needed)
   - `reddit` — Reddit (needs: subreddit name)
   - `v2ex` — V2EX (optional: API token)
   - `medium` — Medium (needs: RSS feed URL)

2. Ask for a display name and any required config.

3. Create the site via API:
   ```bash
   curl -s -X POST http://localhost:3377/api/sites \
     -H 'Content-Type: application/json' \
     -d '{"name":"<name>","adapter":"<adapter>","config":{"key":"value"}}'
   ```

4. Confirm creation and offer to trigger an immediate fetch.
