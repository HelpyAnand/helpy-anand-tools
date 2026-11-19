
"use strict";

const dns = require("node:dns").promises;
const net = require("node:net");
const http = require("node:http");
const https = require("node:https");

const MAX_HTML_SIZE = 1024 * 1024;
const REQUEST_TIMEOUT = 5000;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 2048;
const MAX_URLS = 100;

function isPublicIPv4(ip) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4) return false;

    const [a, b, c] = p;

    if (
        a === 0 || a === 10 || a === 127 || a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0) ||
        (a === 192 && b === 88 && c === 99) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113)
    ) return false;

    return true;
}

function isPublicIP(ip) {
    const version = net.isIP(ip);

    if (version === 4) return isPublicIPv4(ip);
    if (version !== 6 || ip.includes("%")) return false;

    const normalized = ip.toLowerCase();

    // Reject IPv4-mapped IPv6 and non-global special ranges.
    if (
        normalized.startsWith("::ffff:") ||
        normalized === "::" ||
        normalized === "::1"
    ) return false;

    const first = parseInt(normalized.split(":")[0] || "0", 16);

    // Global IPv6 unicast range 2000::/3.
    if (first < 0x2000 || first > 0x3fff) return false;

    if (
        normalized.startsWith("2001:db8:") ||
        normalized.startsWith("2002:") ||
        normalized.startsWith("3fff:")
    ) return false;

    return true;
}

async function resolvePublicHost(hostname) {
    const host = hostname.replace(/^\[|\]$/g, "");

    if (net.isIP(host)) {
        if (!isPublicIP(host)) {
            throw new Error("Private or restricted IP blocked.");
        }

        return [{
            address: host,
            family: net.isIP(host)
        }];
    }

    if (
        !host ||
        host.length > 253 ||
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal")
    ) {
        throw new Error("Invalid or restricted hostname.");
    }

    let addresses;

    try {
        addresses = await dns.lookup(host, {
            all: true,
            verbatim: true
        });
    } catch {
        throw new Error("Unable to resolve website domain.");
    }

    if (
        !addresses.length ||
        addresses.some(item => !isPublicIP(item.address))
    ) {
        throw new Error("Website resolves to a restricted IP.");
    }

    return addresses;
}

function requestPage(targetUrl, addresses) {
    return new Promise((resolve, reject) => {
        const client = targetUrl.protocol === "https:"
            ? https
            : http;

        const selected = addresses[0];

        const options = {
            protocol: targetUrl.protocol,
            hostname: targetUrl.hostname.replace(/^\[|\]$/g, ""),
            port: targetUrl.port || undefined,
            path: targetUrl.pathname + targetUrl.search,
            method: "GET",
            timeout: REQUEST_TIMEOUT,
            maxHeaderSize: 16384,

            headers: {
                "User-Agent": "HelpyAnandSitemapBot/1.0",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Encoding": "identity",
                "Connection": "close"
            },

            lookup: (hostname, lookupOptions, callback) => {
                if (lookupOptions && lookupOptions.all) {
                    callback(null, [selected]);
                } else {
                    callback(
                        null,
                        selected.address,
                        selected.family
                    );
                }
            }
        };

        if (targetUrl.protocol === "https:") {
            options.servername = targetUrl.hostname
                .replace(/^\[|\]$/g, "");
        }

        const request = client.request(options, response => {
            const status = response.statusCode || 0;
            const redirects = [301, 302, 303, 307, 308];

            if (redirects.includes(status)) {
                const location = response.headers.location;
                response.destroy();

                return resolve({
                    redirect: location,
                    status
                });
            }

            if (status < 200 || status >= 300) {
                response.destroy();
                return reject(
                    new Error("HTTP status " + status)
                );
            }

            const contentType = String(
                response.headers["content-type"] || ""
            ).toLowerCase();

            if (
                !contentType.includes("text/html") &&
                !contentType.includes("application/xhtml+xml")
            ) {
                response.destroy();
                return reject(
                    new Error("Page is not HTML.")
                );
            }

            let body = "";
            let size = 0;

            response.on("data", chunk => {
                size += chunk.length;

                if (size > MAX_HTML_SIZE) {
                    response.destroy();
                    request.destroy(
                        new Error("HTML exceeds 1 MB.")
                    );
                    return;
                }

                body += chunk.toString("utf8");
            });

            response.on("end", () => {
                resolve({
                    html: body,
                    status,
                    contentType
                });
            });

            response.on("error", reject);
        });

        request.on("timeout", () => {
            request.destroy(
                new Error("Website request timed out.")
            );
        });

        request.on("error", reject);
        request.end();
    });
}

async function fetchWebsite(url) {
    let currentUrl = new URL(url);

    for (let i = 0; i <= MAX_REDIRECTS; i++) {
        if (
            !["http:", "https:"].includes(currentUrl.protocol) ||
            currentUrl.username ||
            currentUrl.password ||
            (currentUrl.port &&
                currentUrl.port !== "80" &&
                currentUrl.port !== "443")
        ) {
            throw new Error("Unsafe URL or port.");
        }

        const addresses = await resolvePublicHost(
            currentUrl.hostname
        );

        const result = await requestPage(
            currentUrl,
            addresses
        );

        if (!result.redirect) {
            return {
                ...result,
                finalUrl: currentUrl.href
            };
        }

        if (i === MAX_REDIRECTS) {
            throw new Error("Too many redirects.");
        }

        try {
            currentUrl = new URL(
                result.redirect,
                currentUrl
            );
        } catch {
            throw new Error("Invalid redirect URL.");
        }
    }

    throw new Error("Unable to fetch page.");
}

function decodeHTML(value) {
    return String(value || "")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, n) =>
            String.fromCodePoint(Number(n))
        )
        .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
            String.fromCodePoint(parseInt(n, 16))
        )
        .trim();
}

function getAttribute(tag, name) {
    const escaped = name.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const match = tag.match(
        new RegExp(
            "\\b" + escaped +
            "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
            "i"
        )
    );

    return match
        ? decodeHTML(match[1] ?? match[2] ?? match[3])
        : "";
}

function isHTMLNoIndex(html) {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];

    return tags.some(tag => {
        const name = getAttribute(tag, "name").toLowerCase();
        const content = getAttribute(tag, "content").toLowerCase();

        return (
            (name === "robots" || name === "googlebot") &&
            content.split(",").some(value =>
                value.trim() === "noindex"
            )
        );
    });
}

function extractLinks(html, pageUrl, origin) {
    const tags = html.match(/<a\b[^>]*>/gi) || [];
    const links = new Set();

    for (const tag of tags) {
        const href = getAttribute(tag, "href");
        if (!href) continue;

        try {
            const url = new URL(href, pageUrl);

            if (
                !["http:", "https:"].includes(url.protocol) ||
                url.origin !== origin ||
                url.username ||
                url.password
            ) continue;

            url.hash = "";
            url.hostname = url.hostname.toLowerCase();

            if (
                /\.(pdf|jpg|jpeg|png|gif|webp|svg|css|js|zip|mp4|mp3|xml|json|ico|woff2?|ttf|eot)$/i.test(url.pathname)
            ) continue;

            links.add(url.href);
        } catch {
            // Ignore malformed links.
        }
    }

    return [...links];
}

function normalizeInputUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error("Invalid URL.");
    }

    if (value.length > MAX_URL_LENGTH) {
        throw new Error("URL is too long.");
    }

    const url = new URL(
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
            ? value.trim()
            : "https://" + value.trim()
    );

    if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
    ) {
        throw new Error("Only public HTTP/HTTPS URLs are allowed.");
    }

    url.hash = "";
    return url;
}

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            success: false,
            error: "Method not allowed."
        });
    }

    try {
        const body = req.body || {};
        const action = body.action;

        if (action === "fetch") {
            const inputUrl = normalizeInputUrl(body.url);
            const page = await fetchWebsite(inputUrl.href);

            const finalUrl = normalizeInputUrl(page.finalUrl);

            if (finalUrl.origin !== inputUrl.origin) {
                throw new Error("Redirect to another domain is blocked.");
            }

            const noindex = isHTMLNoIndex(page.html);

            return res.status(200).json({
                success: true,
                url: finalUrl.href,
                noindex,
                links: noindex
                    ? []
                    : extractLinks(
                        page.html,
                        finalUrl.href,
                        inputUrl.origin
                    )
            });
        }

        if (action === "validate") {
            if (
                !Array.isArray(body.urls) ||
                body.urls.length > MAX_URLS
            ) {
                throw new Error("Maximum 100 manual URLs allowed.");
            }

            const urls = [];
            const origin = normalizeInputUrl(body.origin).origin;

            for (const value of body.urls) {
                try {
                    const url = normalizeInputUrl(value);

                    if (url.origin === origin) {
                        urls.push(url.href);
                    }
                } catch {
                    // Ignore invalid manual URLs.
                }
            }

            return res.status(200).json({
                success: true,
                urls: [...new Set(urls)].slice(0, MAX_URLS)
            });
        }

        return res.status(400).json({
            success: false,
            error: "Invalid action."
        });

    } catch (error) {
        console.error("XML Sitemap API:", error.message);

        return res.status(400).json({
            success: false,
            error: error.message || "Unable to process sitemap request."
        });
    }
};
