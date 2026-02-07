import { NextRequest, NextResponse } from "next/server";

function resolveDemoHost(): string {
    const explicit = process.env.NEXT_PUBLIC_DEMO_HOST?.trim();
    if (explicit) {
        return explicit
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
            .toLowerCase();
    }

    const base =
        process.env.NEXT_PUBLIC_DEMO_BASE_URL ||
        process.env.DEMO_BASE_URL ||
        "https://demo.prosektorweb.com";

    try {
        return new URL(base).host.toLowerCase();
    } catch {
        return "demo.prosektorweb.com";
    }
}

function resolveDashboardHost(): string | null {
    const explicit = process.env.NEXT_PUBLIC_DASHBOARD_HOST?.trim();
    if (explicit) {
        return explicit
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
            .toLowerCase();
    }

    const base =
        process.env.DASHBOARD_PUBLIC_API_BASE ||
        process.env.DASHBOARD_API_BASE ||
        "";

    if (!base) return null;

    try {
        return new URL(base).host.toLowerCase();
    } catch {
        return null;
    }
}

const DEMO_HOST = resolveDemoHost();
const DASHBOARD_HOST = resolveDashboardHost();

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /admin routes
         * 3. /_next (Next.js internals)
         * 4. /_static (inside /public)
         * 5. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|admin|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const rawHost = req.headers.get("host") || "";
    const hostWithoutPort = rawHost.split(":")[0];
    const normalizedHost = hostWithoutPort.toLowerCase();

    // Get hostname of request (e.g. demo.vercel.pub, test.com)
    const hostname = rawHost.replace(
        ".localhost:3001",
        `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
    );

    // Get the pathname of the request (e.g. /, /about, /blog/first-post)
    const path = url.pathname;
    const isLocalHost =
        hostWithoutPort === "localhost" ||
        hostWithoutPort === "127.0.0.1" ||
        hostWithoutPort === "0.0.0.0";
    const isPrivateLanHost = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(
        hostWithoutPort
    );

    // During local development, do not rewrite by subdomain rules.
    if (isLocalHost || isPrivateLanHost) {
        return NextResponse.next();
    }

    // demo.prosektorweb.com path-based tenant: /[siteSlug]
    if (normalizedHost === DEMO_HOST) {
        return NextResponse.next();
    }

    // dashboard.prosektorweb.com should stay app-routed (no tenant rewrite)
    if (DASHBOARD_HOST && normalizedHost === DASHBOARD_HOST) {
        return NextResponse.next();
    }

    // rewrites for app pages
    if (
        hostname === `app.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` ||
        hostname === "localhost:3001"
    ) {
        return NextResponse.next();
    }

    // rewrite root domain to landing page (if you have one)
    if (
        hostname === "localhost:3001" ||
        hostname === process.env.NEXT_PUBLIC_ROOT_DOMAIN
    ) {
        return NextResponse.next();
    }

    // rewrite everything else to `/_sites/[hostname]/[path]`
    return NextResponse.rewrite(
        new URL(`/_sites/${hostname}${path}`, req.url)
    );
}
