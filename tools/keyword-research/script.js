"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const elements = {
        keyword: $("seedKeyword"),
        search: $("researchBtn"),
        country: $("countrySelect"),
        language: $("languageSelect"),
        error: $("keywordError"),
        loading: $("keywordLoading"),
        results: $("keywordResults"),
        summary: $("researchSummary"),
        copy: $("copyKeywordsBtn"),
        export: $("exportCsvBtn"),
        total: $("totalKeywords"),
        google: $("googleStatus"),
        bing: $("bingStatus"),
        table: $("keywordTableBody"),
        empty: $("keywordEmptyState"),
        clusters: $("keywordClusters")
    };

    const state = {
        seed: "",
        keywords: [],
        relatedKeywords: [],
        alphabetKeywords: [],
        activeTab: "all",
        sources: { google: false, bing: false }
    };

    const questionWords = ["what", "how", "why", "when", "where", "who", "which", "can", "does", "is", "are"];

    const intentPatterns = {
        transactional: /\b(buy|order|purchase|download|hire|book|coupon|discount|price|cheap)\b/i,
        commercial: /\b(best|top|review|reviews|vs|versus|comparison|compare)\b/i,
        navigational: /\b(login|log in|sign in|official|website|homepage|portal)\b/i,
        informational: /\b(what|how|why|when|where|who|guide|tips|tutorial|meaning|definition|examples|benefits)\b/i
    };

    function getIntent(keyword) {
        for (const [intent, pattern] of Object.entries(intentPatterns)) {
            if (pattern.test(keyword)) return intent;
        }
        return "informational";
    }

    function isQuestion(keyword) {
        const normalized = keyword.trim().toLowerCase();
        return questionWords.some(word =>
            normalized.startsWith(word + " ") ||
            normalized === word
        ) || normalized.endsWith("?");
    }

    function getKeywordType(keyword) {
        if (isQuestion(keyword)) return "Question";
        if (keyword.trim().split(/\s+/).length >= 4) return "Long-tail";
        if (keyword.toLowerCase() === state.seed.toLowerCase()) return "Seed";
        return "Related";
    }

    function safeText(value) {
        return String(value ?? "");
    }

    function createCell(value, className) {
        const cell = document.createElement("td");
        cell.textContent = safeText(value);
        if (className) cell.className = className;
        return cell;
    }

    function showError(message) {
        if (!elements.error) return;
        elements.error.textContent = message;
        elements.error.hidden = false;
    }

    function clearError() {
        if (!elements.error) return;
        elements.error.textContent = "";
        elements.error.hidden = true;
    }




    function normalizeKeyword(value) {
        return String(value || "").trim().replace(/\s+/g, " ");
    }

    function uniqueKeywords(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = normalizeKeyword(item.keyword).toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function setLoading(active) {
        if (elements.loading) elements.loading.hidden = !active;
        if (elements.search) elements.search.disabled = active;
    }

    function updateSourceStatus(sources) {
        if (elements.google) {
            elements.google.textContent = sources.google ? "Google: Available" : "Google: Unavailable";
        }
        if (elements.bing) {
            elements.bing.textContent = sources.bing ? "Bing: Available" : "Bing: Unavailable";
        }
    }


    async function fetchKeywordSuggestions(keyword) {
        const response = await fetch("/api/keyword-research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                keyword: keyword,
                country: elements.country ? elements.country.value : "IN",
                language: elements.language ? elements.language.value : "en"
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Keyword research failed. Please try again.");
        }

        if (!Array.isArray(data.suggestions)) {
            throw new Error("Invalid keyword data received from the server.");
        }

        return {
            suggestions: uniqueKeywords(data.suggestions),
            sources: data.sources || { google: false, bing: false }
        };
    }





    async function fetchQuestionSuggestions(keyword) {
        const queries = [
            "what is " + keyword,
            "how to choose " + keyword,
            "why use " + keyword,
            "when to use " + keyword,
            "where to buy " + keyword,
            "which " + keyword
        ];

        const results = await Promise.allSettled(
            queries.map(query => fetchKeywordSuggestions(query))
        );

        return results
            .filter(result => result.status === "fulfilled")
            .flatMap(result => result.value.suggestions)
            .filter(item => isQuestionKeyword(item.keyword));
    }
    async function fetchRelatedKeywordSuggestions(keyword) {
        const modifiers = ["for beginners", "for men", "for women", "under 1000", "under 2000", "under 5000", "for daily use", "in India"];
        const results = await Promise.allSettled(modifiers.map(modifier => fetchKeywordSuggestions(keyword + " " + modifier)));
        const suggestions = results.filter(result => result.status === "fulfilled").flatMap(result => result.value.suggestions);
        return uniqueKeywords(suggestions).filter(item => normalizeKeyword(item.keyword).toLowerCase() !== keyword.toLowerCase());
    }

        async function fetchAlphabetKeywordSuggestions(keyword) {
        const characters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
        const suggestions = [];

        for (let i = 0; i < characters.length; i += 6) {
            const batch = characters.slice(i, i + 6);
            const results = await Promise.allSettled(batch.map(char => fetchKeywordSuggestions(keyword + " " + char)));
            results.filter(result => result.status === "fulfilled").forEach(result => suggestions.push(...result.value.suggestions));
        }

        return uniqueKeywords(suggestions).filter(item => normalizeKeyword(item.keyword).toLowerCase() !== keyword.toLowerCase());
    }

function renderKeywords() {
        if (!elements.table) return;

        const rows = getVisibleKeywords();
        elements.table.replaceChildren();

        if (elements.total) {
            elements.total.textContent = String(rows.length);
        }

        if (elements.empty) {
            elements.empty.hidden = rows.length > 0;
        }

        rows.forEach(item => {
            const keyword = normalizeKeyword(item.keyword);
            if (!keyword) return;

            const row = document.createElement("tr");
            const intent = getIntent(keyword);
            const sources = Array.isArray(item.sources)
                ? item.sources.join(", ")
                : "Generated idea";

            row.append(
                createCell(keyword),
                createCell(intent + " (Estimated)", "keyword-intent"),
                createCell(sources),
                createCell(getKeywordType(keyword))
            );

            elements.table.appendChild(row);
        });
    }



    function isLongTail(keyword) {
        return keyword.trim().split(/\s+/).length >= 4;
    }

    function isQuestionKeyword(keyword) {
        return isQuestion(keyword);
    }

    function getVisibleKeywords() {
        if (state.activeTab === "longtail") {
            return state.keywords.filter(item => isLongTail(item.keyword));
        }

        if (state.activeTab === "alphabet") {
            return state.alphabetKeywords;
        }

        if (state.activeTab === "related") {
            return state.relatedKeywords;
        }

        if (state.activeTab === "questions") {
            return state.keywords.filter(item => isQuestionKeyword(item.keyword));
        }

        return state.keywords;
    }

    async function setActiveTab(tabName) {
        state.activeTab = tabName;
        if (tabName === "alphabet" && state.seed && !state.alphabetKeywords.length) {
            setLoading(true);
            try {
                state.alphabetKeywords = await fetchAlphabetKeywordSuggestions(state.seed);
            } catch (error) {
                showError(error.message || "Alphabet keyword expansion failed.");
            } finally {
                setLoading(false);
            }
        }

        document.querySelectorAll(".keyword-tab").forEach(tab => {
            const active = tab.dataset.tab === tabName;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });

        renderKeywords();
    }




    function clusterKeywords(keywords) {
        const groups = new Map();

        keywords.forEach(item => {
            const keyword = normalizeKeyword(item.keyword);
            const words = keyword.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 2);

            const key = words.slice(0, 2).join(" ") || "Other";

            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(keyword);
        });

        return Array.from(groups, ([name, items]) => ({
            name,
            keywords: items
        }));
    }

    function renderClusters() {
        if (!elements.clusters) return;

        elements.clusters.replaceChildren();

        const groups = clusterKeywords(state.keywords);

        groups.forEach(group => {
            const card = document.createElement("div");
            card.className = "keyword-cluster-card";

            const heading = document.createElement("h3");
            heading.textContent = group.name;

            const list = document.createElement("p");
            list.textContent = group.keywords.join(", ");

            card.append(heading, list);
            elements.clusters.appendChild(card);
        });
    }
    async function copyKeywords() {
        const keywords = getVisibleKeywords()
            .map(item => normalizeKeyword(item.keyword))
            .filter(Boolean);

        if (!keywords.length) {
            showError("No keywords available to copy.");
            return;
        }

        try {
            await navigator.clipboard.writeText(keywords.join("\n"));
            clearError();
            elements.copy.textContent = "Copied!";
        } catch (error) {
            showError("Clipboard access failed. Please use CSV export.");
        }
    }

    function exportCsv() {
        const rows = getVisibleKeywords();

        if (!rows.length) {
            showError("No keywords available to export.");
            return;
        }

        const escapeCsv = value =>
            '"' + String(value ?? "").replace(/"/g, '""') + '"';

        const csvRows = [
            ["Keyword", "Search Intent", "Source", "Keyword Type"],
            ...rows.map(item => [
                item.keyword,
                getIntent(item.keyword) + " (Estimated)",
                Array.isArray(item.sources) ? item.sources.join(", ") : "Generated idea",
                getKeywordType(item.keyword)
            ])
        ];

        const csv = "\uFEFF" + csvRows
            .map(row => row.map(escapeCsv).join(","))
            .join("\r\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "helpy-anand-keyword-research.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        clearError();
    }
    async function runKeywordResearch() {
        const keyword = normalizeKeyword(elements.keyword?.value);

        clearError();

        if (keyword.length < 2) {
            showError("Please enter at least 2 characters.");
            elements.keyword?.focus();
            return;
        }

        state.seed = keyword;
        state.alphabetKeywords = [];
        setLoading(true);

        if (elements.results) elements.results.hidden = false;

        try {
            const result = await fetchKeywordSuggestions(keyword);
            const questionSuggestions = await fetchQuestionSuggestions(keyword);
              const relatedSuggestions = await fetchRelatedKeywordSuggestions(keyword);

            state.keywords = uniqueKeywords([...result.suggestions, ...questionSuggestions]);
              state.relatedKeywords = relatedSuggestions;
            state.sources = result.sources;

            updateSourceStatus(state.sources);
            renderKeywords();
            renderClusters();

            if (elements.summary) {
                elements.summary.textContent =
                    state.keywords.length + " keyword suggestions found for \"" + keyword + "\".";
            }

            if (!state.keywords.length) {
                showError("No keyword suggestions found. Try another keyword.");
            }
        } catch (error) {
            state.keywords = [];
            state.relatedKeywords = [];
            renderKeywords();
            renderClusters();
            showError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }
    if (elements.search) {
        elements.search.addEventListener("click", runKeywordResearch);
    }

    if (elements.keyword) {
        elements.keyword.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                runKeywordResearch();
            }
        });
    }

    if (elements.copy) {
        elements.copy.addEventListener("click", copyKeywords);
    }

    if (elements.export) {
        elements.export.addEventListener("click", exportCsv);
    }

    document.querySelectorAll(".keyword-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            setActiveTab(tab.dataset.tab);
        });
    });
});




