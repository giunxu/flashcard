# Cloudflare cold-start loading screen

Use `render-cold-start-worker.js` as a Cloudflare Worker in front of the Render origin.

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create a Worker and paste `render-cold-start-worker.js`.
4. Set `ORIGIN_HOSTNAME` in the Worker to the Render hostname.
5. Add a Worker route for the production domain, for example:
   - `yourdomain.com/*`
   - `www.yourdomain.com/*`

The Worker tries the Render origin first. If Render is asleep or returns a 5xx response, Cloudflare serves a loading page and polls `/api/health` until the origin is ready.
