
"use strict";

/* ==========================================
   HELPY ANAND TOOLS - XML SITEMAP GENERATOR
========================================== */

(() => {
    const MAX_URLS = 100;
    const API_URL = "/api/xml-sitemap";
    const ROBOTS_USER_AGENT = "HelpyAnandSitemapGenerator";

    const $ = (id) => document.getElementById(id);

    const elements = {
        websiteUrl: $("websiteUrl"),
        manualUrls: $("manualUrls"),
        startBtn: $("startCrawlBtn"),
        stopBtn: $("stopCrawlBtn"),
        addManualBtn: $("addManualBtn"),
        progressSection: $("progressSection"),
        progressStatus: $("progressStatus"),
        progressPercent: $("progressPercent"),
        progressFill: $("progressFill"),
        discoveredCount: $("discoveredCount"),
        processedCount: $("processedCount"),
        statsGrid: $("statsGrid"),
        totalPages: $("totalPages"),
        successPages: $("successPages"),
        errorPages: $("errorPages"),
        messageBox: $("messageBox"),
        resultSection: $("resultSection"),
        xmlPreview: $("xmlPreview"),
        copyBtn: $("copyXmlBtn"),
        downloadBtn: $("downloadXmlBtn")
    };

    let urls = new Map();
    let errors = [];
    let isCrawling = false;
    let stopRequested = false;
    let currentOrigin = "";
    let xmlOutput = "";
    let robotsRules = [];
    let robotsLoadedFor = "";

    function showMessage(message, type = "info") {
        elements.messageBox.textContent = message;
        elements.messageBox.className = `message-box ${type}`;
        elements.messageBox.hidden = false;
    }

    function hideMessage() {
        elements.messageBox.hidden = true;
    }

    function normalizeUrl(value, base = "") {
        try {
            const url = new URL(value.trim(), base || undefined);

            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }

            if (url.username || url.password) {
                return null;
            }

            url.hash = "";

            if (url.pathname.length > 1) {
                url.pathname = url.pathname.replace(/\/+$/, "");
            }

            return url.href;
        } catch {
            return null;
        }
    }

    function isSameOrigin(value) {
        try {
            return new URL(value).origin === currentOrigin;
        } catch {
            return false;
        }
    }

    function addUrl(value) {
        const normalized = normalizeUrl(value);

        if (!normalized || !isSameOrigin(normalized)) {
            return false;
        }

        if (urls.has(normalized) || urls.size >= MAX_URLS) {
            return false;
        }

        urls.set(normalized, {
            url: normalized,
            noindex: false
        });

        return true;
    }

    function updateStats(processed = 0, discovered = 0) {
        elements.totalPages.textContent = urls.size;
        elements.successPages.textContent = Math.max(0, urls.size - errors.length);
        elements.errorPages.textContent = errors.length;
        elements.discoveredCount.textContent = discovered;
        elements.processedCount.textContent = processed;
    }

    function updateProgress(processed, discovered, status, completed = false) {
        const percent = completed
            ? 100
            : discovered
                ? Math.min(99, Math.round((processed / discovered) * 100))
                : 0;

        elements.progressPercent.textContent = `${percent}%`;
        elements.progressFill.style.width = `${percent}%`;
        elements.progressStatus.textContent = status;
    }

    async function apiRequest(action, data) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    action,
                    ...data
                }),
                signal: controller.signal
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(result.error || `Request failed (${response.status})`);
            }

            return result;
        } finally {
            clearTimeout(timeout);
        }
    }

    // Parse robots.txt and select the most specific user-agent group.
    function parseRobotsTxt(text) {
        const groups = [];
        let group = { agents: [], rules: [] };
        let hasDirectives = false;

        const lines = String(text || "").split(/\r?\n/);

        for (let line of lines) {
            line = line.split("#")[0].trim();

            if (!line) continue;

            const separator = line.indexOf(":");
            if (separator === -1) continue;

            const key = line.slice(0, separator).trim().toLowerCase();
            const value = line.slice(separator + 1).trim();

            if (key === "user-agent") {
                if (hasDirectives) {
                    groups.push(group);
                    group = { agents: [], rules: [] };
                    hasDirectives = false;
                }

                group.agents.push(value.toLowerCase());
                continue;
            }

            if ((key === "allow" || key === "disallow") && group.agents.length) {
                hasDirectives = true;

                // Empty Disallow means allow all.
                if (value) {
                    group.rules.push({
                        type: key,
                        path: value
                    });
                }
            }
        }

        if (group.agents.length) {
            groups.push(group);
        }

        const matchingGroups = [];
        let bestSpecificity = -1;

        for (const item of groups) {
            let specificity = -1;

            for (const agent of item.agents) {
                if (agent === "*") {
                    specificity = Math.max(specificity, 0);
                } else if (
                    ROBOTS_USER_AGENT.toLowerCase().includes(agent)
                ) {
                    specificity = Math.max(specificity, agent.length);
                }
            }

            if (specificity > bestSpecificity) {
                bestSpecificity = specificity;
                matchingGroups.length = 0;
                matchingGroups.push(item);
            } else if (specificity === bestSpecificity && specificity >= 0) {
                matchingGroups.push(item);
            }
        }

        return matchingGroups.flatMap(item => item.rules);
    }

    function robotsPatternMatches(pattern, target) {
        const anchored = pattern.endsWith("$");
        const source = anchored ? pattern.slice(0, -1) : pattern;

        const escaped = source
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*");

        try {
            const regex = new RegExp("^" + escaped + (anchored ? "$" : ""));
            return regex.test(target);
        } catch {
            return false;
        }
    }

    function isAllowedByRobots(value) {
        let url;

        try {
            url = new URL(value);
        } catch {
            return false;
        }

        const target = url.pathname + url.search;
        let bestRule = null;
        let bestSpecificity = -1;

        for (const rule of robotsRules) {
            if (!robotsPatternMatches(rule.path, target)) continue;

            const specificity = rule.path
                .replace(/\*/g, "")
                .replace(/\$/g, "")
                .length;

            if (specificity > bestSpecificity) {
                bestSpecificity = specificity;
                bestRule = rule;
            } else if (
                specificity === bestSpecificity &&
                rule.type === "allow"
            ) {
                bestRule = rule;
            }
        }

        // Allow wins when equally specific.
        return !bestRule || bestRule.type === "allow";
    }

    async function loadRobots(homepage) {
        const origin = new URL(homepage).origin;

        if (robotsLoadedFor === origin) {
            return;
        }

        const robotsUrl = new URL("/robots.txt", origin).href;

        const result = await apiRequest("robots", {
            url: robotsUrl
        });

        robotsRules = parseRobotsTxt(result.robotsText || "");
        robotsLoadedFor = origin;
    }

    function escapeXml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    function generateXML() {
        const entries = [...urls.values()]
            .filter(item => !item.noindex)
            .map(item => {
                return `  <url>\n    <loc>${escapeXml(item.url)}</loc>\n  </url>`;
            });

        xmlOutput = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...entries,
            '</urlset>'
        ].join("\n");

        elements.xmlPreview.textContent = xmlOutput;
        elements.resultSection.hidden = false;

        return xmlOutput;
    }

    function recordError(url, error) {
        if (errors.some(item => item.url === url)) return;

        errors.push({
            url,
            error: error.message || String(error)
        });
    }

    async function startCrawl() {
        if (isCrawling) return;

        hideMessage();

        const homepage = normalizeUrl(elements.websiteUrl.value);

        if (!homepage) {
            showMessage("Please enter a valid HTTP or HTTPS website URL.", "error");
            elements.websiteUrl.focus();
            return;
        }

        const homepageUrl = new URL(homepage);

        if (homepageUrl.port && !(
            (homepageUrl.protocol === "https:" && homepageUrl.port === "443") ||
            (homepageUrl.protocol === "http:" && homepageUrl.port === "80")
        )) {
            showMessage("Please use a website URL with the standard HTTP or HTTPS port.", "error");
            return;
        }

        currentOrigin = homepageUrl.origin;

        urls.clear();
        errors = [];
        xmlOutput = "";
        robotsRules = [];
        robotsLoadedFor = "";

        isCrawling = true;
        stopRequested = false;

        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
        elements.addManualBtn.disabled = true;

        elements.progressSection.hidden = false;
        elements.statsGrid.hidden = false;
        elements.resultSection.hidden = true;

        let queue = [];
        const visited = new Set();
        let processed = 0;

        try {
            updateProgress(0, 1, "Checking robots.txt...");

            await loadRobots(homepage);

            if (!isAllowedByRobots(homepage)) {
                throw new Error("The homepage is blocked by robots.txt. Crawling cannot start.");
            }

            addUrl(homepage);
            queue.push(homepage);

            updateStats(processed, queue.length);
            updateProgress(processed, queue.length, "Crawling website...");

            while (queue.length && processed < MAX_URLS && !stopRequested) {
                const pageUrl = queue.shift();

                if (visited.has(pageUrl)) continue;
                visited.add(pageUrl);

                try {
                    const result = await apiRequest("fetch", {
                        url: pageUrl
                    });

                    if (result.noindex) {
                        const entry = urls.get(pageUrl);
                        if (entry) entry.noindex = true;
                    }

                    const links = Array.isArray(result.links)
                        ? result.links
                        : [];

                    for (const link of links) {
                        if (urls.size >= MAX_URLS) break;

                        const normalized = normalizeUrl(link, pageUrl);

                        if (
                            normalized &&
                            isSameOrigin(normalized) &&
                            isAllowedByRobots(normalized) &&
                            !urls.has(normalized) &&
                            !visited.has(normalized)
                        ) {
                            addUrl(normalized);
                            queue.push(normalized);
                        }
                    }
                } catch (error) {
                    recordError(pageUrl, error);
                }

                processed++;

                const discovered = processed + queue.length;
                updateStats(processed, discovered);
                updateProgress(
                    processed,
                    discovered,
                    stopRequested ? "Stopping crawler..." : "Crawling website..."
                );
            }

            if (stopRequested) {
                showMessage("Crawling stopped. You can still use the discovered URLs.", "info");
            } else if (queue.length === 0) {
                showMessage("Website crawling completed successfully.", "success");
            } else {
                showMessage(`Crawling limit reached. Maximum ${MAX_URLS} URLs supported.`, "info");
            }

        } catch (error) {
            showMessage(error.message || "Unable to crawl this website.", "error");
        } finally {
            isCrawling = false;

            elements.startBtn.disabled = false;
            elements.stopBtn.disabled = true;
            elements.addManualBtn.disabled = false;

            const completed = !stopRequested && queue.length === 0;

            updateProgress(
                processed,
                processed + queue.length,
                stopRequested ? "Crawling stopped" : "Crawling finished",
                completed
            );

            updateStats(processed, processed + queue.length);
            generateXML();
        }
    }

    function stopCrawl() {
        if (!isCrawling) return;

        stopRequested = true;
        elements.stopBtn.disabled = true;
    }

    async function addManualUrls() {
        if (isCrawling) return;

        hideMessage();

        const homepage = normalizeUrl(elements.websiteUrl.value);

        if (!homepage) {
            showMessage("Please enter a valid website URL first.", "error");
            return;
        }

        currentOrigin = new URL(homepage).origin;

        const manualEntries = elements.manualUrls.value
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);

        if (!manualEntries.length) {
            showMessage("Please enter at least one URL.", "error");
            return;
        }

        elements.addManualBtn.disabled = true;

        try {
            await loadRobots(homepage);
        } catch (error) {
            elements.addManualBtn.disabled = false;
            showMessage(
                "Could not read robots.txt. Manual URLs were not added: " + error.message,
                "error"
            );
            return;
        }

        const accepted = [];
        let rejected = 0;
        let duplicates = 0;
        let blocked = 0;

        for (const value of manualEntries) {
            if (urls.size >= MAX_URLS) {
                rejected++;
                continue;
            }

            const normalized = normalizeUrl(value, homepage);

            if (!normalized || !isSameOrigin(normalized)) {
                rejected++;
                continue;
            }

            if (!isAllowedByRobots(normalized)) {
                blocked++;
                continue;
            }

            if (urls.has(normalized)) {
                duplicates++;
                continue;
            }

            if (addUrl(normalized)) {
                accepted.push(normalized);
            }
        }

        if (!urls.size) {
            elements.addManualBtn.disabled = false;
            showMessage("No valid URLs were added.", "error");
            return;
        }

        elements.statsGrid.hidden = false;
        elements.progressSection.hidden = false;

        let checked = 0;

        for (const url of accepted) {
            try {
                const result = await apiRequest("fetch", { url });

                if (result.noindex) {
                    const entry = urls.get(url);
                    if (entry) entry.noindex = true;
                }
            } catch (error) {
                recordError(url, error);
            }

            checked++;
            updateStats(checked, accepted.length);
            updateProgress(
                checked,
                accepted.length,
                "Checking manual URLs...",
                checked === accepted.length
            );
        }

        elements.addManualBtn.disabled = false;

        generateXML();

        let message = `${accepted.length} manual URL(s) added and checked.`;

        if (duplicates) message += ` ${duplicates} duplicate(s) skipped.`;
        if (rejected) message += ` ${rejected} invalid, external or over-limit URL(s) skipped.`;
        if (blocked) message += ` ${blocked} URL(s) blocked by robots.txt.`;

        showMessage(message, accepted.length ? "success" : "info");
    }

    async function copyXML() {
        if (!xmlOutput) return;

        try {
            await navigator.clipboard.writeText(xmlOutput);
            showMessage("XML sitemap copied to clipboard.", "success");
        } catch {
            showMessage("Clipboard access failed. Please copy the XML manually.", "error");
        }
    }

    function downloadXML() {
        if (!xmlOutput) return;

        const blob = new Blob(
            [xmlOutput],
            { type: "application/xml;charset=utf-8" }
        );

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = "sitemap.xml";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        showMessage("Your sitemap.xml download has started.", "success");
    }

    elements.startBtn.addEventListener("click", startCrawl);
    elements.stopBtn.addEventListener("click", stopCrawl);
    elements.addManualBtn.addEventListener("click", addManualUrls);
    elements.copyBtn.addEventListener("click", copyXML);
    elements.downloadBtn.addEventListener("click", downloadXML);

    console.log("Helpy Anand XML Sitemap Generator initialized.");
})();
