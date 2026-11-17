
"use strict";

const dns = require("node:dns").promises;
const net = require("node:net");
const http = require("node:http");
const https = require("node:https");

const MAX_HTML_SIZE = 1024 * 1024;
const REQUEST_TIMEOUT = 10000;
const MAX_REDIRECTS = 3;

// ------------------------------------
// IP ADDRESS SECURITY
// ------------------------------------

function isPublicIPv4(ip) {
    const p = ip.split(".").map(Number);

    if (p.length !== 4) return false;

    const [a, b, c] = p;

    if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0) ||
        (a === 192 && b === 88 && c === 99) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113)
    ) {
        return false;
    }

    return true;
}

function ipv6ToBigInt(ip) {
    let address = ip.toLowerCase().split("%")[0];

    if (address.includes(".")) {
        const index = address.lastIndexOf(":");
        const ipv4 = address.slice(index + 1);

        if (!isPublicIPv4(ipv4)) return null;

        const p = ipv4.split(".").map(Number);

        const hex =
            ((p[0] << 8) | p[1]).toString(16) +
            ":" +
            ((p[2] << 8) | p[3]).toString(16);

        address = address.slice(0, index + 1) + hex;
    }

    const halves = address.split("::");

    let left = halves[0] ? halves[0].split(":") : [];
    let right = halves.length > 1 && halves[1]
        ? halves[1].split(":")
        : [];

    const missing = 8 - left.length - right.length;

    if (missing < 0) return null;

    const groups = halves.length > 1
        ? [...left, ...Array(missing).fill("0"), ...right]
        : left;

    if (groups.length !== 8) return null;

    try {
        return groups.reduce(
            (value, part) =>
                (value << 16n) | BigInt(parseInt(part, 16)),
            0n
        );
    } catch {
        return null;
    }
}

function isPublicIP(ip) {
    const version = net.isIP(ip);

    if (version === 4) {
        return isPublicIPv4(ip);
    }

    if (version !== 6 || ip.includes("%")) {
        return false;
    }

    const value = ipv6ToBigInt(ip);

    if (value === null) return false;

    // Only globally allocated unicast range 2000::/3.
    if ((value >> 125n) !== 1n) return false;

    const first32 = value >> 96n;
    const first16 = value >> 112n;

    // Documentation, transition and special-purpose ranges.
    if (
        first32 === 0x20010db8n ||
        first32 === 0x20010000n ||
        first16 === 0x2002n ||
        (value >> 108n) === 0x3ffn
    ) {
        return false;
    }

    return true;
}

// ------------------------------------
// DOMAIN DNS VALIDATION
// ------------------------------------

async function resolvePublicHost(hostname) {
    const host = hostname.replace(/^\[|\]$/g, "");

    if (net.isIP(host)) {
        if (!isPublicIP(host)) {
            throw new Error("Private or restricted IP addresses are blocked.");
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

    if (!addresses.length) {
        throw new Error("Website domain has no valid IP address.");
    }

    if (addresses.some(item => !isPublicIP(item.address))) {
        throw new Error("Website resolves to a private or restricted IP.");
    }

    return addresses;
}

// ------------------------------------
// SAFE WEBSITE FETCH
// ------------------------------------

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
                "User-Agent": "HelpyAnandSEOChecker/1.0",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Encoding": "identity",
                "Connection": "close"
            },

          lookup: (hostname, lookupOptions, callback) => {
    if (lookupOptions && lookupOptions.all) {
        callback(null, [{
            address: selected.address,
            family: selected.family
        }]);
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

            const redirectCodes = [301, 302, 303, 307, 308];

            if (redirectCodes.includes(status)) {
                const location = response.headers.location;

                response.destroy();

                return resolve({
                    redirect: location,
                    status
                });
            }

            const contentType = String(
                response.headers["content-type"] || ""
            );

            if (
                !contentType.toLowerCase().includes("text/html") &&
                !contentType.toLowerCase().includes("application/xhtml+xml")
            ) {
                response.destroy();
                return reject(new Error("Website did not return HTML content."));
            }

            if (status < 200 || status >= 300) {
                response.destroy();
                return reject(
                    new Error("Website returned HTTP status " + status)
                );
            }

            let body = "";
            let size = 0;

            response.on("data", chunk => {
                size += chunk.length;

                if (size > MAX_HTML_SIZE) {
                    response.destroy();
                    request.destroy(
                        new Error("Website HTML exceeds the 1 MB limit.")
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
            request.destroy(new Error("Website request timed out."));
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
            throw new Error("Unsafe website URL or port.");
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
            throw new Error("Too many website redirects.");
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

    throw new Error("Unable to fetch website.");
}

// ------------------------------------
// HTML HELPERS
// ------------------------------------

function decodeHTML(value) {
    return String(value || "")
        .replace(/&nbsp;/gi, " ")
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

function getText(value) {
    return decodeHTML(
        value.replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
    );
}

function getAttribute(tag, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const match = tag.match(
        new RegExp(
            "\\b" + escaped + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
            "i"
        )
    );

    return match
        ? decodeHTML(match[1] ?? match[2] ?? match[3])
        : "";
}

function getMeta(html, name) {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];

    for (const tag of tags) {
        const key =
            getAttribute(tag, "name") ||
            getAttribute(tag, "property");

        if (key.toLowerCase() === name.toLowerCase()) {
            return getAttribute(tag, "content");
        }
    }

    return "";
}

function addCheck(checks, name, status, message, weight) {
    checks.push({
        name,
        status,
        message,
        weight
    });
}

// ------------------------------------
// SEO ANALYSIS ENGINE
// ------------------------------------

function analyzeHTML(html, pageUrl, httpStatus) {

    const checks = [];

    const titleMatch = html.match(
        /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i
    );

    const title = titleMatch
        ? getText(titleMatch[1])
        : "";

    const description = getMeta(html, "description");
    const robots = getMeta(html, "robots");
    const viewport = getMeta(html, "viewport");
    const ogTitle = getMeta(html, "og:title");
    const ogDescription = getMeta(html, "og:description");

    const h1 = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1\s*>/gi) || [];
    const h2 = html.match(/<h2\b[^>]*>[\s\S]*?<\/h2\s*>/gi) || [];

    const images = html.match(/<img\b[^>]*>/gi) || [];

    const missingAlt = images.filter(image => {
        const match = image.match(/\balt\s*=/i);
        return !match;
    });

    const canonicalMatch = html.match(
        /<link\b[^>]*>/gi
    ) || [];

    let canonical = "";

    for (const tag of canonicalMatch) {
        if (
            getAttribute(tag, "rel")
                .toLowerCase()
                .split(/\s+/)
                .includes("canonical")
        ) {
            canonical = getAttribute(tag, "href");
            break;
        }
    }

    const htmlTag = html.match(/<html\b[^>]*>/i);
    const language = htmlTag
        ? getAttribute(htmlTag[0], "lang")
        : "";

    const charset =
        /<meta\b[^>]*charset\s*=/i.test(html) ||
        /<meta\b[^>]*http-equiv\s*=\s*["']content-type["']/i.test(html);

    const links = html.match(/<a\b[^>]*href\s*=/gi) || [];

    let internalLinks = 0;
    let externalLinks = 0;

    const pageHost = new URL(pageUrl).hostname;

    const anchorTags = html.match(/<a\b[^>]*>/gi) || [];

    for (const tag of anchorTags) {
        const href = getAttribute(tag, "href");

        try {
            const linkUrl = new URL(href, pageUrl);

            if (!["http:", "https:"].includes(linkUrl.protocol)) {
                continue;
            }

            if (linkUrl.hostname === pageHost) {
                internalLinks++;
            } else {
                externalLinks++;
            }
        } catch {
            // Ignore invalid links.
        }
    }

    const titleLength = title.length;
    const descriptionLength = description.length;

    addCheck(
        checks,
        "Page Title",
        titleLength >= 30 && titleLength <= 60
            ? "good"
            : titleLength > 0 ? "warning" : "error",
        title
            ? `Title length: ${titleLength} characters. Recommended: 30–60.`
            : "Page title is missing.",
        12
    );

    addCheck(
        checks,
        "Meta Description",
        descriptionLength >= 120 && descriptionLength <= 160
            ? "good"
            : descriptionLength > 0 ? "warning" : "error",
        description
            ? `Description length: ${descriptionLength} characters. Recommended: 120–160.`
            : "Meta description is missing.",
        12
    );

    addCheck(
        checks,
        "H1 Heading",
        h1.length === 1
            ? "good"
            : h1.length === 0 ? "error" : "warning",
        `Found ${h1.length} H1 heading(s). One clear main heading is recommended.`,
        10
    );

    addCheck(
        checks,
        "H2 Headings",
        h2.length > 0 ? "good" : "warning",
        `Found ${h2.length} H2 heading(s).`,
        5
    );

    addCheck(
        checks,
        "Image ALT Attributes",
        images.length === 0
            ? "warning"
            : missingAlt.length === 0
                ? "good"
                : "error",
        `Found ${images.length} image(s); ${missingAlt.length} missing ALT attributes.`,
        9
    );

    addCheck(
        checks,
        "Canonical URL",
        canonical ? "good" : "warning",
        canonical
            ? `Canonical URL found: ${canonical}`
            : "Canonical link is missing.",
        7
    );

    const noIndex = /\bnoindex\b/i.test(robots);

    addCheck(
        checks,
        "Robots Meta Tag",
        noIndex ? "error" : "good",
        noIndex
            ? "The page contains a noindex directive."
            : robots
                ? `Robots directive: ${robots}`
                : "No restrictive robots meta directive found.",
        9
    );

    addCheck(
        checks,
        "Open Graph Title",
        ogTitle ? "good" : "warning",
        ogTitle ? "Open Graph title is present." : "og:title is missing.",
        4
    );

    addCheck(
        checks,
        "Open Graph Description",
        ogDescription ? "good" : "warning",
        ogDescription
            ? "Open Graph description is present."
            : "og:description is missing.",
        4
    );

    addCheck(
        checks,
        "Mobile Viewport",
        viewport ? "good" : "error",
        viewport
            ? "Viewport meta tag is present."
            : "Mobile viewport meta tag is missing.",
        7
    );

    addCheck(
        checks,
        "HTML Language",
        language ? "good" : "warning",
        language
            ? `HTML language: ${language}`
            : "HTML lang attribute is missing.",
        4
    );

    addCheck(
        checks,
        "Character Encoding",
        charset ? "good" : "warning",
        charset
            ? "Character encoding declaration found."
            : "Charset declaration is missing.",
        3
    );

    addCheck(
        checks,
        "HTTPS Security",
        new URL(pageUrl).protocol === "https:"
            ? "good"
            : "error",
        new URL(pageUrl).protocol === "https:"
            ? "Website uses HTTPS."
            : "Website is using HTTP instead of HTTPS.",
        6
    );

    addCheck(
        checks,
        "Internal Links",
        internalLinks > 0 ? "good" : "warning",
        `Found ${internalLinks} internal link(s).`,
        3
    );

    addCheck(
        checks,
        "External Links",
        externalLinks > 0 ? "good" : "warning",
        `Found ${externalLinks} external link(s).`,
        2
    );

    const totalWeight = checks.reduce(
        (sum, check) => sum + check.weight,
        0
    );

    const earnedWeight = checks.reduce(
        (sum, check) => sum +
            (
                check.status === "good"
                    ? check.weight
                    : check.status === "warning"
                        ? check.weight * 0.5
                        : 0
            ),
        0
    );

    const score = Math.round(
        (earnedWeight / totalWeight) * 100
    );

    const scoreLabel =
        score >= 80 ? "Excellent SEO Health" :
        score >= 60 ? "Good SEO - Improvements Needed" :
        score >= 40 ? "SEO Needs Improvement" :
        "Poor SEO Health";

    return {
        score,
        scoreLabel,
        httpStatus,
        pageTitle: title,
        metaDescription: description,
        canonical,
        totalImages: images.length,
        missingAltImages: missingAlt.length,
        internalLinks,
        externalLinks,
        checks: checks.map(({ weight, ...check }) => check)
    };
}

// ------------------------------------
// VERCEL API HANDLER
// ------------------------------------

module.exports = async function handler(req, res) {

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    try {

        const body = req.body || {};

        if (
            typeof body.url !== "string" ||
            !body.url.trim() ||
            body.url.length > 2048
        ) {
            return res.status(400).json({
                error: "Please enter a valid website URL."
            });
        }

        let targetUrl;

        try {
            targetUrl = new URL(
                /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(body.url)
                    ? body.url
                    : "https://" + body.url
            );
        } catch {
            return res.status(400).json({
                error: "Invalid website URL."
            });
        }

        if (
            !["http:", "https:"].includes(targetUrl.protocol) ||
            targetUrl.username ||
            targetUrl.password
        ) {
            return res.status(400).json({
                error: "Only public HTTP and HTTPS websites are supported."
            });
        }

        const page = await fetchWebsite(targetUrl.href);

        const report = analyzeHTML(
            page.html,
            page.finalUrl,
            page.status
        );

        return res.status(200).json({
            success: true,
            report
        });

    } catch (error) {

        console.error(
            "SEO Checker Error:",
            error.message
        );

        return res.status(400).json({
            error: error.message ||
                "Unable to analyze this website."
        });
    }
};
