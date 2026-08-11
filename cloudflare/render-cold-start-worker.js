const ORIGIN_HOSTNAME = "flashcard-oldi.onrender.com";
const ORIGIN_TIMEOUT_MS = 4500;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/__origin-health") {
      return checkOrigin();
    }

    const originUrl = new URL(request.url);
    originUrl.protocol = "https:";
    originUrl.hostname = ORIGIN_HOSTNAME;

    const response = await fetchOrigin(originUrl, request);
    if (response && response.ok) {
      return response;
    }

    if (response && response.status < 500) {
      return response;
    }

    return loadingResponse(url.pathname + url.search);
  },
};

async function fetchOrigin(url, request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ORIGIN_TIMEOUT_MS);

  try {
    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", new URL(request.url).hostname);
    headers.set("X-Forwarded-Proto", "https");

    return await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkOrigin() {
  const response = await fetchOrigin(new URL(`https://${ORIGIN_HOSTNAME}/api/health?wake=${Date.now()}`), {
    method: "GET",
    headers: new Headers(),
    url: `https://${ORIGIN_HOSTNAME}/api/health`,
  });

  return new Response(JSON.stringify({ ok: Boolean(response?.ok) }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function loadingResponse(returnPath) {
  const safePath = JSON.stringify(returnPath || "/");
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>English For Kids</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        background: #fff4df;
        color: #0f172a;
        font-family: ui-rounded, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 420px);
        padding: 28px;
        border: 5px solid #ffffff;
        border-radius: 28px;
        background: #ffffff;
        text-align: center;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
      }
      .loader {
        width: 76px;
        height: 76px;
        margin: 0 auto 18px;
        border: 9px solid #e0f2fe;
        border-top-color: #ec4899;
        border-right-color: #22c55e;
        border-radius: 50%;
        animation: spin 900ms linear infinite;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.75rem;
        font-weight: 900;
      }
      p {
        margin: 0;
        color: #64748b;
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.45;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <main>
      <div class="loader" aria-hidden="true"></div>
      <h1>English For Kids</h1>
      <p>The app is waking up. This usually takes a few seconds on the free plan.</p>
    </main>
    <script>
      const returnPath = ${safePath};
      async function waitForOrigin() {
        try {
          const response = await fetch("/__origin-health", { cache: "no-store" });
          const data = await response.json();
          if (data.ok) {
            window.location.replace(returnPath);
            return;
          }
        } catch {}
        window.setTimeout(waitForOrigin, 2500);
      }
      waitForOrigin();
    </script>
  </body>
</html>`, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
