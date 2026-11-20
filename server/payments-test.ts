import application, { type Env } from "./index";

const testOrigin = "https://qofeno-payments-test.sohailkhannn-0525.workers.dev";
const noIndex = "noindex, nofollow, noarchive";
const banner = `<aside aria-label="Payment test environment" style="padding:12px 20px;text-align:center;background:#fbe4c6;color:#52300e;border-bottom:1px solid #c7a174;font:500 13px/1.5 system-ui,sans-serif">Payment test environment · No live charges. Use test payment details only.</aside>`;

/** A separate public provider-test deployment. Production never imports this. */
export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    // Keep test analytics retention isolated from the production database.
    if (env.PUBLIC_SITE_URL !== testOrigin || env.DODO_ENVIRONMENT !== "test_mode") return;
    await application.scheduled(controller, env);
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      url.origin !== testOrigin ||
      env.PUBLIC_SITE_URL !== testOrigin ||
      env.DODO_ENVIRONMENT !== "test_mode"
    ) {
      return new Response(
        "This test deployment is not configured for this origin.",
        {
          status: 503,
          headers: { "X-Robots-Tag": noIndex, "Cache-Control": "no-store" },
        },
      );
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": noIndex,
          "Cache-Control": "no-store",
        },
      });
    }
    if (url.pathname === "/sitemap.xml" || url.pathname.startsWith("/sitemaps/")) {
      return new Response("No sitemap for the test environment.", {
        status: 404,
        headers: { "X-Robots-Tag": noIndex, "Cache-Control": "no-store" },
      });
    }

    // Pass the exact incoming request through: signed webhook bodies must remain
    // untouched. Authentication, environment filtering and fulfillment are shared.
    const result = await application.fetch(request, env);
    const response = new Response(result.body, result);
    response.headers.set("X-Robots-Tag", noIndex);
    if (!response.headers.get("Content-Type")?.includes("text/html"))
      return response;

    response.headers.set("Cache-Control", "no-store");
    return new HTMLRewriter()
      .on('meta[name="robots"]', {
        element(element) {
          element.setAttribute("content", noIndex);
        },
      })
      .on('link[rel="canonical"]', {
        element(element) {
          element.setAttribute("href", testOrigin + url.pathname);
        },
      })
      .on('meta[property="og:url"]', {
        element(element) {
          element.setAttribute("content", testOrigin + url.pathname);
        },
      })
      .on("body", {
        element(element) {
          element.prepend(banner, { html: true });
        },
      })
      .transform(response);
  },
};
