
/* ==========================================
   HELPY ANAND - ADVANCED SEO CHECKER
========================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const websiteInput = document.getElementById("websiteUrl");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const loadingSection = document.getElementById("loadingSection");
    const resultsSection = document.getElementById("resultsSection");
    const analyzedUrl = document.getElementById("analyzedUrl");
    const seoScore = document.getElementById("seoScore");
    const seoReport = document.getElementById("seoReport");

    if (!websiteInput || !analyzeBtn) return;

    analyzeBtn.addEventListener("click", analyzeWebsite);

    websiteInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            analyzeWebsite();
        }
    });

    async function analyzeWebsite() {

        const rawUrl = websiteInput.value.trim();

        if (!rawUrl) {
            showError("Please enter your website URL.");
            websiteInput.focus();
            return;
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(
                /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawUrl)
                    ? rawUrl
                    : `https://${rawUrl}`
            );
        } catch {
            showError("Please enter a valid website URL.");
            return;
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            showError("Only HTTP and HTTPS URLs are supported.");
            return;
        }

        if (parsedUrl.username || parsedUrl.password) {
            showError("URLs containing login credentials are not allowed.");
            return;
        }

        if (!isPublicHostname(parsedUrl.hostname)) {
            showError("Please enter a valid public website domain.");
            return;
        }

        websiteInput.value = parsedUrl.href;

        setLoading(true);

        try {

            const response = await fetch("/api/seo-checker", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: parsedUrl.href
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to analyze this website."
                );
            }

            if (!data.success || !data.report) {
                throw new Error("Invalid SEO report received.");
            }

            displayReport(data.report, parsedUrl.href);

        } catch (error) {

            showError(error.message || "Something went wrong.");

        } finally {

            setLoading(false);

        }
    }

    function isPublicHostname(hostname) {

        const host = hostname.toLowerCase().replace(/\.$/, "");

        if (
            host === "localhost" ||
            host.endsWith(".localhost") ||
            host.endsWith(".local") ||
            host.endsWith(".internal") ||
            host.endsWith(".test")
        ) {
            return false;
        }

        if (
            !host.includes(".") ||
            /^\d+$/.test(host) ||
            /^\[.*\]$/.test(host)
        ) {
            return false;
        }

        const parts = host.split(".");

        if (
            parts.some(part =>
                !part ||
                part.startsWith("-") ||
                part.endsWith("-") ||
                !/^[a-z0-9-]+$/i.test(part)
            )
        ) {
            return false;
        }

        return true;
    }

    function setLoading(isLoading) {

        loadingSection.hidden = !isLoading;
        analyzeBtn.disabled = isLoading;

        analyzeBtn.textContent = isLoading
            ? "Analyzing..."
            : "Analyze Website →";

        analyzeBtn.setAttribute(
            "aria-busy",
            String(isLoading)
        );

        if (isLoading) {
            resultsSection.hidden = true;
        }
    }

    function showError(message) {

        alert(message);

    }

    function displayReport(report, url) {

        analyzedUrl.textContent = url;

        const score = Math.max(
            0,
            Math.min(100, Number(report.score) || 0)
        );

        const scoreColor =
            score >= 80 ? "#16a36a" :
            score >= 50 ? "#e6a12c" :
            "#e14c4c";

        seoScore.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                justify-content:center;
                flex-direction:column;
                padding:30px 15px;
                gap:12px;
            ">
                <div style="
                    width:130px;
                    height:130px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-direction:column;
                    border:9px solid ${scoreColor};
                    border-radius:50%;
                    background:#f8faff;
                    color:#14264b;
                ">
                    <strong style="font-size:38px;">${score}</strong>
                    <small style="font-size:12px;">OUT OF 100</small>
                </div>
                <h3 style="margin:0;">Overall SEO Score</h3>
                <p style="margin:0;color:#68758c;">
                    ${escapeHTML(report.scoreLabel || "SEO Analysis Complete")}
                </p>
            </div>
        `;

        const checks = Array.isArray(report.checks)
            ? report.checks
            : [];

        seoReport.innerHTML = `
            <h3 style="margin:15px 0;">SEO Analysis Details</h3>
            <div style="display:grid;gap:12px;">
                ${checks.map(check => {

                    const status = ["good", "warning", "error"].includes(
                        check.status
                    ) ? check.status : "warning";

                    const colors = {
                        good: "#16865b",
                        warning: "#c08015",
                        error: "#d74646"
                    };

                    const labels = {
                        good: "PASS",
                        warning: "WARNING",
                        error: "NEEDS FIX"
                    };

                    return `
                        <div style="
                            padding:17px;
                            border:1px solid #e4eaf4;
                            border-radius:12px;
                            background:#fff;
                        ">
                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:10px;
                                flex-wrap:wrap;
                                align-items:center;
                            ">
                                <strong>${escapeHTML(check.name)}</strong>
                                <span style="
                                    color:${colors[status]};
                                    font-size:12px;
                                    font-weight:800;
                                ">${labels[status]}</span>
                            </div>
                            <p style="
                                margin:9px 0 0;
                                color:#68758c;
                                font-size:13px;
                                line-height:1.6;
                            ">${escapeHTML(check.message)}</p>
                        </div>
                    `;

                }).join("")}
            </div>
        `;

        resultsSection.hidden = false;

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function escapeHTML(value) {

        return String(value ?? "").replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]
        );
    }

});
