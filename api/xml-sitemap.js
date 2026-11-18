
"use strict";

const dns = require("node:dns").promises;
const net = require("node:net");
const http = require("node:http");
const https = require("node:https");

const MAX_HTML_SIZE = 1024 * 1024;
const MAX_ROBOTS_SIZE = 512 * 1024;
const REQUEST_TIMEOUT = 5000;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 2048;
const MAX_URLS = 100;

function inIPv4Range(ip, cidr) {
    const [base, bitsText] = cidr.split("/");
    const bits = Number(bitsText);
    const ipNum = ip.split(".").reduce(
        (n, part) => (n << 8n) + BigInt(part), 0n
    );
    const baseNum = base.split(".").reduce(
        (n, part) => (n << 8n) + BigInt(part), 0n
    );
    const mask = bits === 0 ? 0n : (0xffffffffn << BigInt(32 - bits)) & 0xffffffffn;
    return (ipNum & mask) === (baseNum & mask);
}

const BLOCKED_IPV4 = [
    "0.0.0.0/8",
    "10.0.0.0/8",
    "100.64.0.0/10",
    "127.0.0.0/8",
    "169.254.0.0/16",
    "172.16.0.0/12",
    "192.0.0.0/24",
    "192.0.2.0/24",
    "192.88.99.0/24",
    "192.168.0.0/16",
    "198.18.0.0/15",
    "198.51.100.0/24",
    "203.0.113.0/24",
    "224.0.0.0/4",
    "240.0.0.0/4"
];

function isPublicIPv4(ip) {
    if (net.isIP(ip) !== 4) return false;
    return !BLOCKED_IPV4.some(range => inIPv4Range(ip, range));
}

function ipv6ToBigInt(ip) {
    let address = ip.toLowerCase().split("%")[0];

    if (address.includes(".")) return null;

    const halves = address.split("::");
    if (halves.length > 2) return null;

    let left = halves[0] ? halves[0].split(":") : [];
    let right = halves.length === 2 && halves[1]
        ? halves[1].split(":") : [];

    const missing = 8 - left.length - right.length;

    if (halves.length === 1 && missing !== 0) return null;
    if (halves.length === 2 && missing < 1) return null;

    const groups = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];

    if (groups.length !== 8) return null;

    let value = 0n;
    for (const group of groups) {
        if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
        value = (value << 16n) + BigInt(parseInt(group, 16));
    }
    return value;
}

function inIPv6Range(value, base, bits) {
    const shift = 128n - BigInt(bits);
    return (value >> shift) === (base >> shift);
}

function isPublicIPv6(ip) {
    if (net.isIP(ip) !== 6) return false;

    const value = ipv6ToBigInt(ip);
    if (value === null) return false;

    // Only global unicast 2000::/3 is accepted.
    if (!inIPv6Range(value, 0x20000000000000000000000000000000n, 3)) {
        return false;
    }

    const blocked = [
        ["20010000000000000000000000000000", 23], // Special-purpose range
        ["20010db8000000000000000000000000", 32], // Documentation
        ["20020000000000000000000000000000", 16], // 6to4
        ["3fff0000000000000000000000000000", 20]  // Documentation
    ];

    return !blocked.some(([hex, bits]) =>
        inIPv6Range(value, BigInt("0x" + hex), bits)
    );
}

function isPublicIP(ip) {
    const family = net.isIP(ip);
    if (family === 4) return isPublicIPv4(ip);
    if (family === 6) return isPublicIPv6(ip);
    return false;
}

async function resolvePublicHost(hostname) {
    const cleanHost = hostname.toLowerCase().replace(/\.$/, "");

    if (!cleanHost || cleanHost === "localhost" || cleanHost.endsWith(".localhost")) {
        throw new Error("Localhost addresses are not allowed.");
    }

    const directFamily = net.isIP(cleanHost);

    if (directFamily) {
        if (!isPublicIP(cleanHost)) {
            throw new Error("Private or restricted IP address blocked.");
        }
        return [{ address: cleanHost, family: directFamily }];
    }

    let records = [];

    try {
        const [v4, v6] = await Promise.all([
            dns.resolve4(cleanHost).catch(() => []),
            dns.resolve6(cleanHost).catch(() => [])
        ]);

        records = [
            ...v4.map(address => ({ address, family: 4 })),
            ...v6.map(address => ({ address, family: 6 }))
        ];
    } catch {
        throw new Error("Unable to resolve website hostname.");
    }

    if (!records.length) {
        throw new Error("Website hostname could not be resolved.");
    }

    if (records.some(record => !isPublicIP(record.address))) {
        throw new Error("Website resolves to a private or restricted IP.");
    }

    return records;
}

function validateUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        throw new Error("A valid URL is required.");
    }

    if (value.length > MAX_URL_LENGTH) {
        throw new Error("URL is too long.");
    }

    let url;
    try {
        url = new URL(value.trim());
    } catch {
        throw new Error("Invalid URL format.");
    }

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Only HTTP and HTTPS URLs are allowed.");
    }

    if (url.username || url.password) {
        throw new Error("URLs containing credentials are not allowed.");
    }

    if (url.port && !(
        (url.protocol === "http:" && url.port === "80") ||
        (url.protocol === "https:" && url.port === "443")
    )) {
        throw new Error("Non-standard ports are not allowed.");
    }

    url.hash = "";
    return url;
}

function requestPage(url, addresses, mode = "html") {
    return new Promise((resolve, reject) => {
        const transport = url.protocol === "https:" ? https : http;
        const maxSize = mode === "robots" ? MAX_ROBOTS_SIZE : MAX_HTML_SIZE;

        let settled = false;
        const finish = (error, result) => {
            if (settled) return;
            settled = true;
            if (error) reject(error);
            else resolve(result);
        };

        const options = {
            protocol: url.protocol,
            hostname: url.hostname,
            port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search,
            method: "GET",
            headers: {
                "User-Agent": "HelpyAnandSitemapBot/1.0",
                "Accept": mode === "robots"
                    ? "text/plain,*/*;q=0.5"
                    : "text/html,application/xhtml+xml;q=0.9",
                "Accept-Encoding": "identity",
                "Connection": "close"
            },
            timeout: REQUEST_TIMEOUT,
           lookup: (_hostname, options, callback) => {
    const opts = options && typeof options === "object"
        ? options
        : {};

    const cb = typeof options === "function"
        ? options
        : callback;

    const candidates = opts.family
        ? addresses.filter(item => item.family === opts.family)
        : addresses;

    if (!candidates.length) {
        return cb(new Error("No validated IP available."));
    }

    if (opts.all) {
        return cb(null, candidates.map(item => ({
            address: item.address,
            family: item.family
        })));
    }

    const selected = candidates[0];

    return cb(null, selected.address, selected.family);
}
        };

        const req = transport.request(options, res => {
            const status = res.statusCode || 0;
            const location = res.headers.location || "";

            if ([301, 302, 303, 307, 308].includes(status) && location) {
                res.resume();
                return finish(null, {
                    status,
                    redirect: location
                });
            }

            if (mode === "robots" && status === 404) {
                res.resume();
                return finish(null, { status, body: "" });
            }

            if (status < 200 || status >= 300) {
                res.resume();
                return finish(new Error("Website returned HTTP " + status + "."));
            }

            const contentType = String(res.headers["content-type"] || "").toLowerCase();

            if (mode === "html") {
                if (
                    !contentType.includes("text/html") &&
                    !contentType.includes("application/xhtml+xml")
                ) {
                    res.resume();
                    return finish(new Error("The URL did not return an HTML page."));
                }
            } else if (
                contentType &&
                !contentType.includes("text/plain") &&
                !contentType.includes("application/octet-stream")
            ) {
                res.resume();
                return finish(new Error("robots.txt did not return plain text."));
            }

            const declaredLength = Number(res.headers["content-length"] || 0);
            if (declaredLength > maxSize) {
                res.destroy();
                return finish(new Error("Website response is too large."));
            }

            let body = "";
            let total = 0;

            res.setEncoding("utf8");

            res.on("data", chunk => {
                total += Buffer.byteLength(chunk, "utf8");

                if (total > maxSize) {
                    res.destroy();
                    return finish(new Error("Website response exceeded the size limit."));
                }

                body += chunk;
            });

            res.on("end", () => finish(null, { status, body }));
            res.on("error", error => finish(error));
        });

        req.on("timeout", () => {
            req.destroy(new Error("Website request timed out."));
        });

        req.on("error", error => finish(error));
        req.end();
    });
}

async function fetchWebsite(inputUrl, allowedOrigin, mode = "html") {
    let currentUrl = validateUrl(inputUrl);

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
        if (currentUrl.origin !== allowedOrigin) {
            throw new Error("Cross-domain redirects are not allowed.");
        }

        const addresses = await resolvePublicHost(currentUrl.hostname);
        const result = await requestPage(currentUrl, addresses, mode);

        if (result.redirect) {
            if (redirects === MAX_REDIRECTS) {
                throw new Error("Too many redirects.");
            }

            let nextUrl;
            try {
                nextUrl = new URL(result.redirect, currentUrl);
            } catch {
                throw new Error("Invalid redirect URL.");
            }

            nextUrl = validateUrl(nextUrl.href);

            if (nextUrl.origin !== allowedOrigin) {
                throw new Error("Cross-domain redirects are not allowed.");
            }

            currentUrl = nextUrl;
            continue;
        }

        return {
            url: currentUrl.href,
            status: result.status,
            body: result.body
        };
    }

    throw new Error("Unable to fetch website.");
}

function decodeHTML(value) {
    return value
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, code) => {
            const number = Number(code);
            return number > 0 && number <= 0x10ffff
                ? String.fromCodePoint(number)
                : "";
        })
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
            const number = parseInt(code, 16);
            return number > 0 && number <= 0x10ffff
                ? String.fromCodePoint(number)
                : "";
        });
}

function getAttribute(tag, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = tag.match(new RegExp(
        "\\b" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
        "i"
    ));

    return match ? decodeHTML(match[1] || match[2] || match[3] || "") : "";
}

function isHTMLNoIndex(html) {
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

    for (const tag of metaTags) {
        const name = getAttribute(tag, "name").toLowerCase();
        const content = getAttribute(tag, "content").toLowerCase();

        if (
            ["robots", "googlebot", "bingbot"].includes(name) &&
            content.split(/[\s,]+/).includes("noindex")
        ) {
            return true;
        }
    }

    const xRobots = html.match(/<meta\b[^>]*>/gi) || [];
    return xRobots.some(tag =>
        getAttribute(tag, "name").toLowerCase() === "robots" &&
        /\bnoindex\b/i.test(getAttribute(tag, "content"))
    );
}

function extractLinks(html, baseUrl, allowedOrigin) {
    const links = new Set();
    const anchorTags = html.match(/<a\b[^>]*>/gi) || [];

    const blockedExtensions =
        /\.(?:jpg|jpeg|png|gif|webp|svg|ico|css|js|pdf|zip|rar|mp3|mp4|webm|woff2?|ttf|eot)(?:$|[?#])/i;

    for (const tag of anchorTags) {
        const href = getAttribute(tag, "href").trim();

        if (
            !href ||
            href.startsWith("#") ||
            /^(?:mailto:|tel:|javascript:|data:)/i.test(href)
        ) {
            continue;
        }

        try {
            const url = new URL(href, baseUrl);

            if (
                !["http:", "https:"].includes(url.protocol) ||
                url.origin !== allowedOrigin ||
                url.username ||
                url.password
            ) {
                continue;
            }

            url.hash = "";

            if (blockedExtensions.test(url.pathname)) continue;
            if (url.href.length > MAX_URL_LENGTH) continue;

            links.add(url.href);
        } catch {
            // Ignore malformed links.
        }

        if (links.size >= MAX_URLS) break;
    }

    return Array.from(links);
}

function sendJson(res, status, data) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return sendJson(res, 405, {
            success: false,
            error: "Method not allowed. Use POST."
        });
    }

    try {
        const body = req.body && typeof req.body === "object"
            ? req.body
            : {};

        const action = body.action;

        if (action === "validate") {
            const inputUrls = Array.isArray(body.urls) ? body.urls : [];

            if (inputUrls.length > MAX_URLS) {
                return sendJson(res, 400, {
                    success: false,
                    error: "Maximum 100 URLs are allowed."
                });
            }

            const baseUrl = validateUrl(body.baseUrl || inputUrls[0]);
            const valid = [];
            const invalid = [];

            for (const value of inputUrls) {
                try {
                    const url = validateUrl(value);

                    if (url.origin !== baseUrl.origin) {
                        throw new Error("URL belongs to a different domain.");
                    }

                    valid.push(url.href);
                } catch (error) {
                    invalid.push({
                        url: String(value).slice(0, MAX_URL_LENGTH),
                        error: error.message
                    });
                }
            }

            return sendJson(res, 200, {
                success: true,
                valid,
                invalid,
                total: valid.length
            });
        }

        if (action === "fetch") {
            const url = validateUrl(body.url);
            const result = await fetchWebsite(url.href, url.origin, "html");

            const noindex = isHTMLNoIndex(result.body);
            const links = extractLinks(
                result.body,
                result.url,
                url.origin
            );

            return sendJson(res, 200, {
                success: true,
                url: result.url,
                noindex,
                links
            });
        }

        if (action === "robots") {
            const url = validateUrl(body.url);
            const robotsUrl = new URL("/robots.txt", url.origin);

            const result = await fetchWebsite(
                robotsUrl.href,
                url.origin,
                "robots"
            );

            return sendJson(res, 200, {
                success: true,
                url: result.url,
                status: result.status,
                robotsText: result.body || ""
            });
        }

        return sendJson(res, 400, {
            success: false,
            error: "Invalid API action."
        });

    } catch (error) {
        const message = error && error.message
            ? error.message
            : "An unexpected error occurred.";

        return sendJson(res, 400, {
            success: false,
            error: message
        });
    }
};
