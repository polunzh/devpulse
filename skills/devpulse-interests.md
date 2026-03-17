---
name: devpulse-interests
description: View and manage interest keywords for AI recommendations
---

Manage the interest keywords that drive AI-powered content recommendations.

## Steps

1. Fetch current interests:
   ```bash
   curl -s http://localhost:3377/api/interests
   ```

2. Display them in a table showing keyword, weight, and source (manual/learned).

3. Ask the user what they'd like to do:
   - **Add**: POST new keyword
   - **Remove**: DELETE by id
   - **Done**: exit

4. For additions:
   ```bash
   curl -s -X POST http://localhost:3377/api/interests \
     -H 'Content-Type: application/json' \
     -d '{"keyword":"<keyword>"}'
   ```
