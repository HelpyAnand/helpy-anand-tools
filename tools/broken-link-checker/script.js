/* =========================================
   HELPY ANAND - BROKEN LINK CHECKER
   Frontend Application
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        form: document.getElementById("scanForm"),
        url: document.getElementById("websiteUrl"),
        depth: document.getElementById("crawlDepth"),
        scanBtn: document.getElementById("scanBtn"),

        loading: document.getElementById("loadingSection"),
        progressText: document.getElementById("progressText"),
        progressBar: document.getElementById("progressBar"),
        scanProgress: document.getElementById("scanProgress"),

        error: document.getElementById("errorSection"),
        errorMessage: document.getElementById("errorMessage"),

        results: document.getElementById("resultsSection"),
        analyzedUrl: document.getElementById("analyzedUrl"),

	pagesCrawled: document.getElementById("pagesCrawled"),
	linksDiscovered: document.getElementById("linksDiscovered"),
	linksChecked: document.getElementById("linksChecked"),
	linksSkipped: document.getElementById("linksSkipped"),
        brokenLinks: document.getElementById("brokenLinks"),
        workingLinks: document.getElementById("workingLinks"),
        redirectLinks: document.getElementById("redirectLinks"),
        errorLinks: document.getElementById("errorLinks"),

        exportBtn: document.getElementById("exportCsvBtn"),
        statusFilter: document.getElementById("statusFilter"),
        typeFilter: document.getElementById("typeFilter"),
        tableBody: document.getElementById("resultsTableBody"),
        emptyState: document.getElementById("emptyState"),
        resultCount: document.getElementById("resultCount"),
        scanDetails: document.getElementById("scanDetails")
    };

    const state = {
        scanning: false,
        results: [],
        report: null,
        startedAt: null
    };

    const MAX_PAGES = 20;
    const MAX_LINKS = 100;
    const API_ENDPOINT = "/api/broken-link-checker";

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function normalizeWebsiteURL(value) {
        const input = String(value || "").trim();

        if (!input) {
            throw new Error("Please enter a website URL.");
        }

        let url;

        try {
            url = new URL(
                /^[a-z][a-z\d+.-]*:\/\//i.test(input)
                    ? input
                    : `https://${input}`
            );
        } catch {
            throw new Error("Please enter a valid website URL.");
        }

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Only HTTP and HTTPS website URLs are supported.");
        }

        if (url.username || url.password) {
            throw new Error("Website URLs containing login credentials are not allowed.");
        }

        if (!url.hostname || !url.hostname.includes(".")) {
            throw new Error("Please enter a valid public website domain.");
        }

        if (url.port && !["80", "443"].includes(url.port)) {
            throw new Error("Only standard website ports 80 and 443 are supported.");
        }

        url.hash = "";

        return url.toString();
    }

    function setLoading(isLoading) {
        state.scanning = isLoading;

        elements.scanBtn.disabled = isLoading;
        elements.scanBtn.textContent = isLoading
            ? "Scanning..."
            : "Check Broken Links";

        elements.loading.hidden = !isLoading;

        if (isLoading) {
            elements.error.hidden = true;
            elements.results.hidden = true;
            updateProgress(5, "Preparing website scan...");
        }
    }

    function updateProgress(percent, message) {
        const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));

        elements.progressBar.style.width = `${safePercent}%`;
        elements.progressBar.setAttribute("aria-valuenow", String(safePercent));

        elements.progressText.textContent = message || "Scanning website...";
        elements.scanProgress.textContent = `${Math.round(safePercent)}% complete`;
    }

    function showError(message) {
        elements.errorMessage.textContent =
            message || "Something went wrong. Please try again.";

        elements.error.hidden = false;
        elements.results.hidden = true;
    }

    function getErrorMessage(error) {
        if (error instanceof Error && error.message) {
            return error.message;
        }

        return "Unable to scan this website. Please try again later.";
    }
    /* =========================================
       REPORT NORMALIZATION
    ========================================= */

    function normalizeStatus(status) {
        const value = String(status || "").toLowerCase();

        if (["broken", "working", "redirect", "error"].includes(value)) {
            return value;
        }

        return "error";
    }

    function normalizeType(type) {
        return String(type || "").toLowerCase() === "internal"
            ? "internal"
            : "external";
    }


    function normalizeResults(results) {
        if (!Array.isArray(results)) {
            return [];
        }

        return results.slice(0, MAX_LINKS).map(item => ({
            sourcePage: String(item.sourcePage || ""),
            targetUrl: String(item.targetUrl || ""),
            anchorText: String(item.anchorText || ""),
            type: normalizeType(item.type),
            status: normalizeStatus(item.status),

            httpStatus: item.httpStatus == null
                ? "—"
                : String(item.httpStatus),

            finalUrl: String(
                item.finalUrl || item.targetUrl || ""
            ),

            redirectChain: Array.isArray(item.redirectChain)
                ? item.redirectChain.slice(0, 3)
                : [],

            error: typeof item.error === "string"
                ? item.error
                : ""
        }));
    }

    /* =========================================
       SAFE LINK DISPLAY
    ========================================= */

    function createLinkCell(value) {
        const cell = document.createElement("td");
        const text = String(value || "");

        try {
            const url = new URL(text);

            if (["http:", "https:"].includes(url.protocol)) {
                const link = document.createElement("a");

                link.href = url.href;
                link.textContent = text;
                link.target = "_blank";
                link.rel = "noopener noreferrer nofollow";
                link.referrerPolicy = "no-referrer";

                cell.appendChild(link);
                return cell;
            }
        } catch {
            // Invalid URL: display as plain text.
        }

        cell.textContent = text || "—";
        return cell;
    }

    function createTextCell(value, className) {
        const cell = document.createElement("td");

        cell.textContent = String(value || "—");

        if (className) {
            cell.className = className;
        }

        return cell;
    }

    function createStatusCell(status) {
        const cell = document.createElement("td");
        const label = document.createElement("span");

        const labels = {
            broken: "Broken",
            working: "Working",
            redirect: "Redirect",
            error: "Other Error"
        };

        label.className = `broken-status-label broken-status-${status}`;
        label.textContent = labels[status] || "Other Error";

        cell.appendChild(label);

        return cell;
    }

    /* =========================================
       FILTERED RESULTS TABLE
    ========================================= */

    function getFilteredResults() {
        const selectedStatus = elements.statusFilter.value;
        const selectedType = elements.typeFilter.value;

        return state.results.filter(item => {
            const statusMatches =
                selectedStatus === "all" ||
                item.status === selectedStatus;

            const typeMatches =
                selectedType === "all" ||
                item.type === selectedType;

            return statusMatches && typeMatches;
        });
    }

       function renderResultsTable() {
        const filtered = getFilteredResults();
        const fragment = document.createDocumentFragment();

        filtered.forEach(item => {
            const row = document.createElement("tr");

            const redirectText = item.redirectChain.length
                ? item.redirectChain.join(" -> ")
                : "No redirects";

            row.append(
                createLinkCell(item.sourcePage),
                createLinkCell(item.targetUrl),
                createLinkCell(item.finalUrl),
                createTextCell(redirectText),
                createTextCell(item.anchorText),
                createTextCell(
                    item.type === "internal" ? "Internal" : "External"
                ),
                createStatusCell(item.status),
                createTextCell(item.httpStatus),
                createTextCell(item.error)
            );

            fragment.appendChild(row);
        });

        elements.tableBody.replaceChildren(fragment);

        elements.emptyState.hidden = filtered.length !== 0;

        elements.resultCount.textContent =
            `${filtered.length} of ${state.results.length} results`;
    }
    function updateStatistics(report) {
        const counts = {
            broken: 0,
            working: 0,
            redirect: 0,
            error: 0
        };

        state.results.forEach(item => {
            if (Object.prototype.hasOwnProperty.call(counts, item.status)) {
                counts[item.status]++;
            }
        });

        elements.pagesCrawled.textContent =
            Number(report.pagesCrawled || 0);

        elements.linksDiscovered.textContent =
            Number(report.linksDiscovered ?? state.results.length);

        elements.linksChecked.textContent =
            Number(report.linksChecked ?? state.results.length);

        elements.linksSkipped.textContent =
            Number(report.linksSkipped || 0);

        elements.brokenLinks.textContent = counts.broken;
        elements.workingLinks.textContent = counts.working;
        elements.redirectLinks.textContent = counts.redirect;
        elements.errorLinks.textContent = counts.error;
    }

    function renderReport(report) {
        if (!report || typeof report !== "object") {
            throw new Error("The server returned an invalid scan report.");
        }

        state.report = report;
        state.results = normalizeResults(report.results);

        elements.analyzedUrl.textContent =
            String(report.analyzedUrl || elements.url.value);

        updateStatistics(report);
        renderResultsTable();

        const duration = Number(report.durationMs);
        const scanStatus = String(report.scanStatus || "completed");

        const statusMessages = {
            completed: "Scan completed successfully.",
            partial: "Partial scan: some pages or links could not be checked.",
            timed_out: "Scan time limit reached. Some links may remain unchecked."
        };

        const statusMessage =
            statusMessages[scanStatus] || statusMessages.partial;

        const durationMessage =
            Number.isFinite(duration) && duration >= 0
                ? ` Scan duration: ${(duration / 1000).toFixed(1)} seconds.`
                : "";

        elements.scanDetails.textContent =
            statusMessage + durationMessage;

        elements.results.hidden = false;
    }

    /* =========================================
       API COMMUNICATION
    ========================================= */

    async function startScan(websiteUrl, depth) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    url: websiteUrl,
                    depth: depth,
                    maxPages: MAX_PAGES,
                    maxLinks: MAX_LINKS
                }),
                signal: controller.signal,
                credentials: "same-origin",
                cache: "no-store"
            });

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error("The server returned an invalid response.");
            }

            if (!response.ok || !data || data.success !== true) {
                throw new Error(
                    data && typeof data.error === "string"
                        ? data.error
                        : `Scan request failed (HTTP ${response.status}).`
                );
            }

            return data.report;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /* =========================================
       CSV EXPORT
    ========================================= */

    function csvEscape(value) {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection.
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    }


    function exportCSV() {
        if (!state.results.length) {
            showError("There are no scan results to export.");
            return;
        }

        const headers = [
            "Source Page",
            "Target URL",
            "Final URL",
            "Redirect Chain",
            "Anchor Text",
            "Link Type",
            "Status",
            "HTTP Status",
            "Error Details"
        ];

        const rows = state.results.map(item => [
            item.sourcePage,
            item.targetUrl,
            item.finalUrl,
            item.redirectChain.join(" -> "),
            item.anchorText,
            item.type,
            item.status,
            item.httpStatus,
            item.error
        ]);

        const csv = [
            headers,
            ...rows
        ].map(row => row.map(csvEscape).join(",")).join("\r\n");

        const blob = new Blob(
            ["\uFEFF", csv],
            { type: "text/csv;charset=utf-8;" }
        );

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = "helpy-anand-broken-link-report.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    /* =========================================
       FORM SUBMISSION
    ========================================= */

    elements.form.addEventListener("submit", async event => {
        event.preventDefault();

        if (state.scanning) {
            return;
        }

        let websiteUrl;

        try {
            websiteUrl = normalizeWebsiteURL(elements.url.value);
        } catch (error) {
            showError(getErrorMessage(error));
            return;
        }

        const depth = Number(elements.depth.value);

        if (![1, 2, 3].includes(depth)) {
            showError("Please select a valid crawl depth.");
            return;
        }

        state.startedAt = Date.now();

        setLoading(true);

        try {
            updateProgress(10, "Connecting to the scan service...");

            const report = await startScan(websiteUrl, depth);

            updateProgress(100, "Scan completed successfully.");

            renderReport(report);

        } catch (error) {
            const message = error.name === "AbortError"
                ? "The scan request timed out. Please try a smaller website or lower crawl depth."
                : getErrorMessage(error);

            showError(message);

        } finally {
            setLoading(false);
        }
    });

    /* =========================================
       FILTERS & EXPORT EVENTS
    ========================================= */

    elements.statusFilter.addEventListener(
        "change",
        renderResultsTable
    );

    elements.typeFilter.addEventListener(
        "change",
        renderResultsTable
    );

    elements.exportBtn.addEventListener(
        "click",
        exportCSV
    );

    /* =========================================
       INITIAL STATE
    ========================================= */

    elements.loading.hidden = true;
    elements.error.hidden = true;
    elements.results.hidden = true;

    console.info("Helpy Anand Broken Link Checker initialized.");
});
