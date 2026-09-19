# Separate public chess site

This folder contains only the chess app. No Kiddo Sprout assets, local game records, player credentials or account secrets are included.

Deploy as a Render Docker web service using render.yaml. The free service runs the Node multiplayer server and receives a public HTTPS URL. PUBLIC_SITE_URL overrides the origin; otherwise the server uses Render's RENDER_EXTERNAL_URL for share metadata and search-engine links. Health check: /api/health.

Free Render services sleep while idle and their filesystem is temporary. Online rooms, tournaments and community records can disappear when the service restarts or redeploys. Local browser history is separate. Durable hosting requires a persistent disk or a database; set DATA_DIR to the persistent disk path if one is configured. Do not scale the JSON-backed server to multiple instances.

The files are prepared; no hosting deployment has been completed yet. A hosting account must be signed in and connected to the separate chess source repository. Do not upload this to KiddoSprout-Family-Hub.
