"use strict";

/* ==========================================
   HELPY ANAND - KEYWORD RESEARCH API
   Google + Bing Autocomplete
========================================== */

const REQUEST_TIMEOUT = 8000;
const MAX_KEYWORD_LENGTH = 120;
const MAX_SUGGESTIONS = 60;

function cleanKeyword(value) {
    if (typeof value !== "string") return "";

    return value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_KEYWORD_LENGTH);
}

function normalizeKeyword(value) {
    return value.toLocaleLowerCase().trim();
}

function getUniqueSuggestions(items, source) {
    const results = [];

    if (!Array.isArray(items)) return results;

    for (const item of items) {
        if (typeof item !== "string") continue;

        const keyword = cleanKeyword(item);

        if (
            keyword.length < 2 ||
            keyword.length > MAX_KEYWORD_LENGTH
        ) {
            continue;
        }

        results.push({
            keyword,
            source
        });
    }

    return results;
}

/* ==========================================
   GOOGLE AUTOCOMPLETE
========================================== */

async function getGoogleSuggestions(keyword, language, country) {
    const url = new URL(
        "https://suggestqueries.google.com/complete/search"
    );

    url.search = new URLSearchParams({
        client: "firefox",
        q: keyword,
        hl: language,
        gl: country
    }).toString();

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
        throw new Error("Google suggestions unavailable.");
    }

    const text = await response.text();

    if (text.length > 512000) {
        throw new Error("Google response too large.");
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data) || !Array.isArray(data[1])) {
        throw new Error("Invalid Google response.");
    }

    return getUniqueSuggestions(data[1], "Google");
}

/* ==========================================
   BING AUTOCOMPLETE
========================================== */

async function getBingSuggestions(keyword, language, country) {
    const url = new URL("https://api.bing.com/osjson.aspx");

    url.search = new URLSearchParams({
        query: keyword,
        mkt: `${language}-${country}`
    }).toString();

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
    });

    if (!response.ok) {
        throw new Error("Bing suggestions unavailable.");
    }

    const text = await response.text();

    if (text.length > 512000) {
        throw new Error("Bing response too large.");
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data) || !Array.isArray(data[1])) {
        throw new Error("Invalid Bing response.");
    }

    return getUniqueSuggestions(data[1], "Bing");
}

/* ==========================================
   VERCEL API HANDLER
========================================== */

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

        const keyword = cleanKeyword(body.keyword);

        if (
            !keyword ||
            keyword.length < 2 ||
            /[\u0000-\u001F\u007F]/.test(body.keyword)
        ) {
            return res.status(400).json({
                success: false,
                error: "Please enter a valid keyword (at least 2 characters)."
            });
        }

        const language = typeof body.language === "string"
            ? body.language.trim().toLowerCase()
            : "en";

        const country = typeof body.country === "string"
            ? body.country.trim().toUpperCase()
            : "IN";

        if (!/^[a-z]{2,3}$/.test(language)) {
            return res.status(400).json({
                success: false,
                error: "Invalid language selection."
            });
        }

        if (!/^[A-Z]{2}$/.test(country)) {
            return res.status(400).json({
                success: false,
                error: "Invalid country selection."
            });
        }

        const results = await Promise.allSettled([
            getGoogleSuggestions(keyword, language, country),
            getBingSuggestions(keyword, language, country)
        ]);

        const googleResult = results[0];
        const bingResult = results[1];

        const googleSuggestions = googleResult.status === "fulfilled"
            ? googleResult.value
            : [];

        const bingSuggestions = bingResult.status === "fulfilled"
            ? bingResult.value
            : [];

        if (!googleSuggestions.length && !bingSuggestions.length) {
            return res.status(502).json({
                success: false,
                error: "Keyword suggestions are temporarily unavailable. Please try again."
            });
        }

        const keywordMap = new Map();

        for (const item of [
            ...googleSuggestions,
            ...bingSuggestions
        ]) {

            const key = normalizeKeyword(item.keyword);

            if (!keywordMap.has(key)) {
                keywordMap.set(key, {
                    keyword: item.keyword,
                    sources: []
                });
            }

            const existing = keywordMap.get(key);

            if (!existing.sources.includes(item.source)) {
                existing.sources.push(item.source);
            }
        }

        const suggestions = Array.from(keywordMap.values())
            .slice(0, MAX_SUGGESTIONS);

        return res.status(200).json({
            success: true,
            seedKeyword: keyword,
            country,
            language,
            total: suggestions.length,
            sources: {
                google: googleResult.status === "fulfilled",
                bing: bingResult.status === "fulfilled"
            },
            suggestions
        });

    } catch (error) {

        console.error(
            "Keyword Research API Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error: "Unable to research keywords right now. Please try again."
        });
    }
};

