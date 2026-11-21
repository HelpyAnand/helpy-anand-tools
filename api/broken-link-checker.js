
"use strict";

const dns = require("node:dns").promises;
const net = require("node:net");
const http = require("node:http");
const https = require("node:https");

const MAX_PAGES = 20;
const MAX_LINKS = 100;
const MAX_DEPTH = 3;
const MAX_HTML_SIZE = 1024 * 1024;
const REQUEST_TIMEOUT = 10000;
const MAX_REDIRECTS = 3;
const TOTAL_DEADLINE = 45000;
const MAX_CONCURRENCY = 3;

const USER_AGENT = "HelpyAnandBrokenLinkChecker/1.0";

// ------------------------------------
// IP ADDRESS SECURITY
// ------------------------------------

function ipv4ToNumber(ip) {
    const parts = ip.split(".").map(Number);

    if (
        parts.length !== 4 ||
        parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
        return null;
    }

    return (
        parts[0] * 16777216 +
        parts[1] * 65536 +
        parts[2] * 256 +
        parts[3]
    );
}

function ipv4InRange(ip, network, prefix) {
    const value = ipv4ToNumber(ip);
    const base = ipv4ToNumber(network);

    if (value === null || base === null) return true;

    const mask = prefix === 0
        ? 0
        : (0xffffffff << (32 - prefix)) >>> 0;

    return ((value >>> 0) & mask) === ((base >>> 0) & mask);
}

const BLOCKED_IPV4 = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.31.196.0", 24],
    ["192.52.193.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["192.175.48.0", 24],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
    ["255.255.255.255", 32]
];

function isPublicIPv4(ip) {
    if (net.isIP(ip) !== 4) return false;

    return !BLOCKED_IPV4.some(([network, prefix]) =>
        ipv4InRange(ip, network, prefix)
    );
}

function ipv6ToBigInt(ip) {
    let address = ip.toLowerCase().split("%")[0];

    if (address.includes(".")) {
        const lastColon = address.lastIndexOf(":");
        const ipv4 = address.slice(lastColon + 1);
        const number = ipv4ToNumber(ipv4);

        if (number === null) return null;

        const high = (number >>> 16).toString(16);
        const low = (number & 0xffff).toString(16);

        address =
            address.slice(0, lastColon + 1) +
            high + ":" + low;
    }

    const halves = address.split("::");

    if (halves.length > 2) return null;

    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves.length === 2 && halves[1]
        ? halves[1].split(":")
        : [];

    const missing = 8 - left.length - right.length;

    if (
        (halves.length === 1 && missing !== 0) ||
        (halves.length === 2 && missing < 1)
    ) {
        return null;
    }

    const groups = [
        ...left,
        ...Array(missing).fill("0"),
        ...right
    ];

    if (groups.length !== 8) return null;

    let value = 0n;

    for (const group of groups) {
        if (!/^[0-9a-f]{1,4}$/.test(group)) return null;

        value = (value << 16n) | BigInt("0x" + group);
    }

    return value;
}

function isPublicIPv6(ip) {
    if (net.isIP(ip) !== 6) return false;

    const value = ipv6ToBigInt(ip);

    if (value === null) return false;

    // Only global unicast addresses: 2000::/3
    if ((value >> 125n) !== 1n) return false;

    // Block special-purpose and non-public IPv6 ranges.
    const blocked = [
        ["2001:db8::", 32],
        ["2001::", 23],
        ["2002::", 16],
        ["3fff::", 20],
        ["64:ff9b::", 96],
        ["64:ff9b:1::", 48]
    ];

    return !blocked.some(([network, prefix]) => {
        const base = ipv6ToBigInt(network);
        const shift = 128n - BigInt(prefix);

        return (value >> shift) === (base >> shift);
    });
}

function isPublicIP(ip) {
    const version = net.isIP(ip);

    if (version === 4) return isPublicIPv4(ip);
    if (version === 6) return isPublicIPv6(ip);

    return false;
}


// ------------------------------------
// DNS RESOLUTION SECURITY
// ------------------------------------

async function resolvePublicHost(hostname, deadline) {
    const host = hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "");

    if (
        !host ||
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal") ||
        host.endsWith(".test") ||
        host.endsWith(".invalid")
    ) {
        throw new Error("Private or local hostnames are not allowed.");
    }

    const ipVersion = net.isIP(host);

    if (ipVersion) {
        if (!isPublicIP(host)) {
            throw new Error("Private or reserved IP addresses are blocked.");
        }

        return [{
            address: host,
            family: ipVersion
        }];
    }

  let addresses;

try {
    const remaining = deadline
        ? deadline - Date.now()
        : REQUEST_TIMEOUT;

    if (remaining <= 0) {
        throw new Error("Scan time limit reached.");
    }

    let dnsTimer;

    try {
        addresses = await Promise.race([
            dns.lookup(host, {
                all: true,
                verbatim: true
            }),
            new Promise((_, reject) => {
                dnsTimer = setTimeout(() => {
                    reject(new Error("DNS lookup timed out."));
                }, remaining);
            })
        ]);
    } finally {
        clearTimeout(dnsTimer);
    }
} catch (error) {
    if (error.message === "Scan time limit reached.") {
        throw error;
    }

    if (error.message === "DNS lookup timed out.") {
        throw new Error("Scan time limit reached.");
    }

    throw new Error("Website DNS lookup failed.");
}

    if (!addresses.length) {
        throw new Error("Website hostname did not resolve.");
    }

    // Reject the complete hostname if even one answer is unsafe.
    for (const item of addresses) {
        if (!isPublicIP(item.address)) {
            throw new Error("Website resolves to a private or reserved IP.");
        }
    }

    return addresses;
}

// ------------------------------------
// SAFE URL VALIDATION
// ------------------------------------

function validateTargetURL(input, baseURL) {
    let target;

    try {
        target = baseURL
            ? new URL(input, baseURL)
            : new URL(input);
    } catch {
        throw new Error("Invalid website URL.");
    }

    if (
        !["http:", "https:"].includes(target.protocol) ||
        target.username ||
        target.password
    ) {
        throw new Error("Only public HTTP and HTTPS URLs are supported.");
    }

   const allowedPort = target.protocol === "https:" ? "443" : "80";

if (target.port && target.port !== allowedPort) {
    throw new Error("Only standard HTTP and HTTPS ports are allowed.");
}

    if (!target.hostname || target.hostname.length > 253) {
        throw new Error("Invalid website hostname.");
    }

    target.hash = "";

    return target;
}

function isSameOrigin(first, second) {
    try {
        return new URL(first).origin === new URL(second).origin;
    } catch {
        return false;
    }
}

// ------------------------------------
// SECURE HTTP / HTTPS REQUEST ENGINE
// ------------------------------------

function requestOnce(target, addresses, options = {}) {
    return new Promise((resolve, reject) => {
        const selected = addresses[0];

        if (!selected || !isPublicIP(selected.address)) {
            return reject(new Error("Unsafe destination IP."));
        }

        const isHttps = target.protocol === "https:";
        const transport = isHttps ? https : http;

        const hostname = target.hostname.replace(/^\[|\]$/g, "");
        const timeoutMs = Math.min(
            options.timeout || REQUEST_TIMEOUT,
            REQUEST_TIMEOUT
        );

        const maxSize = options.maxSize ?? MAX_HTML_SIZE;
        let body = "";
        let size = 0;
        let settled = false;
let absoluteTimeout;

        const finish = (error, result) => {
            if (settled) return;
            settled = true;
	if (absoluteTimeout) clearTimeout(absoluteTimeout);

            if (error) reject(error);
            else resolve(result);
        };

        const requestOptions = {
            protocol: target.protocol,
            hostname,
            port: target.port || (isHttps ? 443 : 80),
            method: options.method || "GET",
            path: target.pathname + target.search,
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.5",
                "Accept-Encoding": "identity",
                "Connection": "close",

            },
            agent: false,
            maxHeaderSize: 16384,
           lookup: (requestedHost, lookupOptions, callback) => {
    if (typeof lookupOptions === "function") {
        callback = lookupOptions;
        lookupOptions = {};
    }

    if (lookupOptions && lookupOptions.all) {
        return callback(null, [selected]);
    }

    callback(
        null,
        selected.address,
        selected.family
    );
}
        };

        if (isHttps && net.isIP(hostname) === 0) {
            requestOptions.servername = hostname;
        }

        const request = transport.request(
            requestOptions,
            response => {
                const status = response.statusCode || 0;
                const location = response.headers.location || "";

                if (
                    status >= 300 &&
                    status < 400 &&
                    location
                ) {
                    response.destroy();

                    return finish(null, {
                        status,
                        redirect: location,
                        headers: response.headers,
                        body: ""
                    });
                }
                if (options.headersOnly) {
                    const result = {
                        status,
                        redirect: null,
                        contentType: String(
                            response.headers["content-type"] || ""
                        ).toLowerCase(),
                        headers: response.headers,
                        body: ""
                    };

                    response.destroy();
                    return finish(null, result);
                }

                const contentType = String(
                    response.headers["content-type"] || ""
                ).toLowerCase();

                response.on("data", chunk => {
                    size += chunk.length;

                    if (size > maxSize) {
                        response.destroy();

                        return finish(
                            new Error("Website response exceeds the size limit.")
                        );
                    }

                    body += chunk.toString("utf8");
                });

                response.on("end", () => {
                    finish(null, {
                        status,
                        redirect: null,
                        contentType,
                        headers: response.headers,
                        body
                    });
                });

                response.on("error", error => {
                    finish(error);
                });
            }
        );

absoluteTimeout = setTimeout(() => {
    request.destroy(
        new Error("Website request exceeded the time limit.")
    );
}, timeoutMs);

        request.setTimeout(timeoutMs, () => {
            request.destroy(
                new Error("Website request timed out.")
            );
        });

        request.on("error", error => {
            finish(error);
        });

        request.end();
    });
}

async function fetchWithRedirects(inputURL, options = {}) {
    let currentURL = validateTargetURL(inputURL);
    const originalURL = currentURL.href;
    const redirectChain = [];

    for (let count = 0; count <= MAX_REDIRECTS; count++) {
        if (options.deadline && Date.now() >= options.deadline) {
            throw new Error("Scan time limit reached.");
        }

  const addresses = await resolvePublicHost(
    currentURL.hostname,
    options.deadline
);

        const remaining = options.deadline
            ? options.deadline - Date.now()
            : REQUEST_TIMEOUT;

        if (remaining <= 0) {
            throw new Error("Scan time limit reached.");
        }

        const result = await requestOnce(currentURL, addresses, {
            method: options.method || "GET",
            maxSize: options.maxSize ?? MAX_HTML_SIZE,
            headersOnly: options.headersOnly === true,
            timeout: Math.min(REQUEST_TIMEOUT, remaining)
        });

        if (!result.redirect) {
            return {
                ...result,
                originalUrl: originalURL,
                finalUrl: currentURL.href,
                redirectChain
            };
        }

        if (count === MAX_REDIRECTS) {
            throw new Error("Too many redirects.");
        }

        const nextURL = validateTargetURL(
            result.redirect,
            currentURL
        );

        redirectChain.push({
            url: currentURL.href,
            status: result.status,
            destination: nextURL.href
        });

        currentURL = nextURL;
    }

    throw new Error("Too many redirects.");
}
function decodeHtmlEntities(value) {
    const entities = {
        amp: "&",
        quot: '"',
        apos: "'",
        lt: "<",
        gt: ">",
        nbsp: " "
    };

    return String(value || "").replace(
        /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
        (match, entity) => {
            if (entity[0] === "#") {
                try {
                    const isHex = entity[1].toLowerCase() === "x";
                    const code = parseInt(
                        entity.slice(isHex ? 2 : 1),
                        isHex ? 16 : 10
                    );

                    if (
                        Number.isInteger(code) &&
                        code >= 0 &&
                        code <= 0x10FFFF &&
                        !(code >= 0xD800 && code <= 0xDFFF)
                    ) {
                        return String.fromCodePoint(code);
                    }
                } catch {
                    return match;
                }

                return match;
            }

            return entities[entity.toLowerCase()] ?? match;
        }
    );
}

function stripHtmlTags(value) {
    return String(value || "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractLinks(html, pageURL) {
    const source = String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "");

    const links = [];
    const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;

    let match;

    while ((match = anchorPattern.exec(source)) !== null) {
        const attributes = match[1] || "";
        const anchorContent = match[2] || "";

        const hrefMatch = attributes.match(
            /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
        );

        if (!hrefMatch) {
            continue;
        }

        const rawHref = decodeHtmlEntities(
            hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? ""
        ).trim();

        if (
            !rawHref ||
            /^(?:javascript|data|mailto|tel|sms|blob|file):/i.test(rawHref) ||
            rawHref.startsWith("#")
        ) {
            continue;
        }

        try {
            const target = validateTargetURL(rawHref, pageURL);

            if (!["http:", "https:"].includes(target.protocol)) {
                continue;
            }

            links.push({
                targetUrl: target.href,
                anchorText: decodeHtmlEntities(
                    stripHtmlTags(anchorContent)
                ).slice(0, 300)
            });
        } catch {
            continue;
        }
    }

    return links;
}
async function checkLinkStatus(targetURL, deadline) {
    try {
        let result = await fetchWithRedirects(targetURL, {
            method: "HEAD",
            headersOnly: true,
            deadline
        });

        // GET fallback when HEAD is unsupported.
        if (result.status === 405 || result.status === 501) {
            result = await fetchWithRedirects(targetURL, {
                method: "GET",
                headersOnly: true,
                deadline
            });
        }

        const status = result.status;

        if (status === 404 || status === 410) {
            return {
                status: "broken",
                httpStatus: status,
                finalUrl: result.finalUrl,
                redirectChain: result.redirectChain
            };
        }

        if (result.redirectChain.length > 0) {
            return {
                status: "redirect",
                httpStatus: result.redirectChain[0].status,
                finalUrl: result.finalUrl,
                redirectChain: result.redirectChain
            };
        }

        if (status >= 200 && status < 300) {
            return {
                status: "working",
                httpStatus: status,
                finalUrl: result.finalUrl,
                redirectChain: []
            };
        }

        return {
            status: "error",
            httpStatus: status,
            finalUrl: result.finalUrl,
            redirectChain: []
        };
    } catch (error) {
        return {
            status: "error",
            httpStatus: null,
            finalUrl: targetURL,
            redirectChain: [],
            error: error.message
        };
    }
}
// ------------------------------------
// CONTROLLED CONCURRENCY
// ------------------------------------


async function runWithConcurrency(items, limit, worker, deadline) {
    const results = new Array(items.length);
    let nextIndex = 0;

    const workerCount = Math.min(limit, items.length);

    async function runWorker() {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            if (Date.now() >= deadline) {
                results[index] = {
                    status: "error",
                    httpStatus: null,
                    checked: false,
                    error: "Scan time limit reached."
                };
                continue;
            }

            try {
                results[index] = await worker(items[index], index);
            } catch (error) {
                results[index] = {
                    status: "error",
                    httpStatus: null,
                    checked: true,
                    error: error.message
                };
            }
        }
    }

    await Promise.all(
        Array.from(
            { length: workerCount },
            () => runWorker()
        )
    );

    return results;
}
// ------------------------------------
// HTTP RESPONSE STATUS CLASSIFICATION
// ------------------------------------

function classifyLinkResponse(result) {
    const status = Number(result.status || 0);

    if (status === 404 || status === 410) {
        return {
            status: "broken",
            httpStatus: status,
            finalUrl: result.finalUrl || "",
            redirectChain: result.redirectChain || []
        };
    }

    if (result.redirectChain && result.redirectChain.length > 0) {
        return {
            status: "redirect",
            httpStatus: result.redirectChain[0].status,
            finalUrl: result.finalUrl || "",
            redirectChain: result.redirectChain
        };
    }

    if (status >= 200 && status < 300) {
        return {
            status: "working",
            httpStatus: status,
            finalUrl: result.finalUrl || "",
            redirectChain: []
        };
    }

    return {
        status: "error",
        httpStatus: status || null,
        finalUrl: result.finalUrl || "",
        redirectChain: []
    };
}
// ------------------------------------
// SAFE HTML PAGE FETCHER
// ------------------------------------

async function fetchHTMLPage(pageURL, deadline) {
    const result = await fetchWithRedirects(pageURL, {
        method: "GET",
        maxSize: MAX_HTML_SIZE,
        deadline
    });

    if (result.status < 200 || result.status >= 300) {
        throw new Error(
            "Website returned HTTP status " + result.status
        );
    }

    const contentType = String(
        result.contentType || ""
    ).toLowerCase();

    const isHTML =
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml");

    return {
        url: result.finalUrl,
        html: isHTML ? result.body : "",
        isHTML,
        status: result.status,
        contentType
    };
}
// ------------------------------------
// MAIN WEBSITE CRAWLER
// ------------------------------------

async function crawlWebsite(startURL, requestedDepth) {
    const startedAt = Date.now();
    const deadline = startedAt + TOTAL_DEADLINE;

    const depth = Math.min(
        MAX_DEPTH,
        Math.max(1, Number(requestedDepth) || 1)
    );

    // Fetch the starting page.
    const firstPage = await fetchHTMLPage(startURL, deadline);

    if (!firstPage.isHTML) {
        throw new Error("The supplied URL did not return an HTML page.");
    }

    const analyzedUrl = firstPage.url;
    const siteOrigin = new URL(analyzedUrl).origin;

    const queue = [{
        url: analyzedUrl,
        depth: 0,
        html: firstPage.html
    }];

    const visitedPages = new Set([analyzedUrl]);
    const seenTargets = new Set();
    const linkEntries = [];

    let pagesCrawled = 0;

    // Discover internal and external links using breadth-first crawling.
    while (
        queue.length > 0 &&
        pagesCrawled < MAX_PAGES &&
        linkEntries.length < MAX_LINKS &&
        Date.now() < deadline
    ) {
        const page = queue.shift();

        let pageData;

        if (typeof page.html === "string") {
            pageData = {
                url: page.url,
                html: page.html,
                isHTML: true
            };
        } else {
            try {
                pageData = await fetchHTMLPage(page.url, deadline);
            } catch {
                continue;
            }
        }

        if (!pageData.isHTML) {
            continue;
        }

        pagesCrawled++;

        const links = extractLinks(
            pageData.html,
            pageData.url
        );

        for (const link of links) {
            if (
                Date.now() >= deadline ||
                linkEntries.length >= MAX_LINKS
            ) {
                break;
            }

            const targetUrl = link.targetUrl;

            if (seenTargets.has(targetUrl)) {
                continue;
            }

            seenTargets.add(targetUrl);

            const targetOrigin = new URL(targetUrl).origin;
            const isInternal = targetOrigin === siteOrigin;

            linkEntries.push({
                sourcePage: pageData.url,
                targetUrl,
                anchorText: link.anchorText,
                type: isInternal ? "internal" : "external"
            });

            // Queue internal pages only when another depth level is allowed.
            if (
                isInternal &&
                page.depth + 1 < depth &&
                !visitedPages.has(targetUrl) &&
                visitedPages.size < MAX_PAGES
            ) {
                visitedPages.add(targetUrl);

                queue.push({
                    url: targetUrl,
                    depth: page.depth + 1,
                    html: null
                });
            }
        }
    }


    // Check discovered links with controlled concurrency.
    const checkedResults = await runWithConcurrency(
        linkEntries,
        MAX_CONCURRENCY,
        async (item) => {
            const check = await checkLinkStatus(
                item.targetUrl,
                deadline
            );

            return {
                ...item,
                ...check,
                checked: true
            };
        },
        deadline
    );

    // Count completed and skipped link checks separately.
    const linksChecked = checkedResults.filter(
        item => item && item.checked === true
    ).length;

    const linksSkipped = checkedResults.filter(
        item => item && item.checked === false
    ).length;

    // Preserve detailed information for every attempted link.
    const results = checkedResults
        .filter(item => item && item.checked === true)
        .map(item => ({
            sourcePage: item.sourcePage,
            targetUrl: item.targetUrl,
            anchorText: item.anchorText,
            type: item.type,
            status: item.status,
            httpStatus: item.httpStatus,
            finalUrl: item.finalUrl || item.targetUrl,
            redirectChain: Array.isArray(item.redirectChain)
                ? item.redirectChain
                : [],
            error: item.error || null
        }));

    // Determine whether the scan completed or stopped early.
    const timedOut =
        Date.now() >= deadline || linksSkipped > 0;

    const limitReached =
        linkEntries.length >= MAX_LINKS ||
        queue.length > 0;

    const scanStatus = timedOut
        ? "timed_out"
        : limitReached
            ? "partial"
            : "completed";

    return {
        analyzedUrl,
        pagesCrawled,
        linksDiscovered: linkEntries.length,
        linksChecked,
        linksSkipped,
        scanStatus,
        durationMs: Date.now() - startedAt,
        results
    };

}
// ------------------------------------
// VERCEL API HANDLER
// ------------------------------------

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            success: false,
            error: "Method not allowed. Use POST."
        });
    }

    try {
        const body =
            req.body && typeof req.body === "object"
                ? req.body
                : {};

        if (
            typeof body.url !== "string" ||
            !body.url.trim() ||
            body.url.length > 2048
        ) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid website URL."
            });
        }

        const depth = Number(body.depth);

        if (![1, 2, 3].includes(depth)) {
            return res.status(400).json({
                success: false,
                error: "Crawl depth must be 1, 2, or 3."
            });
        }

        const startURL = validateTargetURL(body.url.trim());

        const report = await crawlWebsite(
            startURL.href,
            depth
        );

        return res.status(200).json({
            success: true,
            report
        });

      } catch (error) {
        const message = String(error.message || "");

        const lowerMessage = message.toLowerCase();

const isInputError =
    lowerMessage.includes("only http") ||
    lowerMessage.includes("credentials") ||
    lowerMessage.includes("hostname") ||
    lowerMessage.includes("url") ||
    lowerMessage.includes("standard http") ||
    lowerMessage.includes("private") ||
    lowerMessage.includes("reserved") ||
    lowerMessage.includes("local host");

        return res.status(isInputError ? 400 : 502).json({
            success: false,
            error: isInputError
                ? message
                : "The website could not be scanned. Please check the URL and try again."
        });
    }
};
