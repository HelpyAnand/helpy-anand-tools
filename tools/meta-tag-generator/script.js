
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("metaForm");

    const titleInput = document.getElementById("siteTitle");
    const descriptionInput = document.getElementById("siteDescription");

    const titleCount = document.getElementById("titleCount");
    const descriptionCount = document.getElementById("descriptionCount");

    const emptyState = document.getElementById("emptyState");
    const resultArea = document.getElementById("resultArea");
    const generatedCode = document.getElementById("generatedCode");

    const copyBtn = document.getElementById("copyBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    if (!form) {
        console.error("Meta Tag Generator: Form not found.");
        return;
    }

    // HTML special characters ko safe banana
    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    // Character counters
    function updateCounters() {
        if (titleCount && titleInput) {
            titleCount.textContent = titleInput.value.length;
        }

        if (descriptionCount && descriptionInput) {
            descriptionCount.textContent = descriptionInput.value.length;
        }
    }

    titleInput?.addEventListener("input", updateCounters);
    descriptionInput?.addEventListener("input", updateCounters);

    updateCounters();

    // Language ko Open Graph locale mein convert karna
    function getLocale(language) {
        const locales = {
            "en": "en_US",
            "hi": "hi_IN",
            "en-US": "en_US",
            "en-GB": "en_GB",
            "hi-IN": "hi_IN"
        };

        return locales[language] || language.replace("-", "_");
    }

    // Meta tag generator
    function generateMetaTags(data) {
        const title = escapeHTML(data.title);
        const description = escapeHTML(data.description);
        const keywords = escapeHTML(data.keywords);
        const author = escapeHTML(data.author);
        const url = escapeHTML(data.url);
        const image = escapeHTML(data.image);
        const robots = escapeHTML(data.robots);
        const theme = escapeHTML(data.theme);
        const locale = escapeHTML(getLocale(data.language));

        const tags = [
            '<!-- Primary SEO Meta Tags -->',
            `<title>${title}</title>`,
            `<meta name="description" content="${description}">`
        ];

        if (keywords) {
            tags.push(`<meta name="keywords" content="${keywords}">`);
        }

        if (author) {
            tags.push(`<meta name="author" content="${author}">`);
        }

        tags.push(
            `<meta name="robots" content="${robots}">`,
            `<link rel="canonical" href="${url}">`,
            `<meta name="theme-color" content="${theme}">`,
            "",
            "<!-- Open Graph / Facebook -->",
            '<meta property="og:type" content="website">',
            `<meta property="og:title" content="${title}">`,
            `<meta property="og:description" content="${description}">`,
            `<meta property="og:url" content="${url}">`,
            `<meta property="og:locale" content="${locale}">`
        );

        if (image) {
            tags.push(`<meta property="og:image" content="${image}">`);
        }

        tags.push(
            "",
            "<!-- Twitter Card -->",
            `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
            `<meta name="twitter:title" content="${title}">`,
            `<meta name="twitter:description" content="${description}">`
        );

        if (image) {
            tags.push(`<meta name="twitter:image" content="${image}">`);
        }

        return tags.join("\n");
    }

    // URL validation
    function isValidWebURL(value) {
        try {
            const parsed = new URL(value);
            return parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
            return false;
        }
    }

    // Generate button
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const data = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            keywords: document.getElementById("siteKeywords").value.trim(),
            author: document.getElementById("siteAuthor").value.trim(),
            url: document.getElementById("siteUrl").value.trim(),
            image: document.getElementById("siteImage").value.trim(),
            language: document.getElementById("siteLanguage").value,
            robots: document.getElementById("siteRobots").value,
            theme: document.getElementById("siteTheme").value
        };

        if (!isValidWebURL(data.url)) {
            alert("Please enter a valid website URL starting with http:// or https://");
            return;
        }

        if (data.image && !isValidWebURL(data.image)) {
            alert("Please enter a valid image URL starting with http:// or https://");
            return;
        }

        const code = generateMetaTags(data);

        generatedCode.textContent = code;

        emptyState.hidden = true;
        resultArea.hidden = false;

        resultArea.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // Copy generated code
    copyBtn?.addEventListener("click", async () => {
        const code = generatedCode.textContent;

        if (!code) {
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(code);
            } else {
                const temp = document.createElement("textarea");
                temp.value = code;
                temp.style.position = "fixed";
                temp.style.opacity = "0";

                document.body.appendChild(temp);
                temp.select();

                const copied = document.execCommand("copy");
                temp.remove();

                if (!copied) {
                    throw new Error("Copy failed");
                }
            }

            copyBtn.textContent = "Copied! ✓";

            setTimeout(() => {
                copyBtn.textContent = "Copy Code";
            }, 2000);

        } catch (error) {
            console.error("Copy error:", error);
            alert("Unable to copy. Please select and copy the code manually.");
        }
    });

    // Download generated HTML file
    downloadBtn?.addEventListener("click", () => {
        const code = generatedCode.textContent;

        if (!code) {
            return;
        }

        const language = escapeHTML(
            document.getElementById("siteLanguage").value
        );

        const htmlFile = `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${code.split("\n").map(line => "    " + line).join("\n")}
</head>
<body>

</body>
</html>`;

        const blob = new Blob([htmlFile], {
            type: "text/html;charset=utf-8"
        });

        const downloadURL = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = downloadURL;
        link.download = "helpy-anand-meta-tags.html";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(downloadURL);
    });

    // Reset form and generated result
    form.addEventListener("reset", () => {
        setTimeout(() => {
            updateCounters();

            generatedCode.textContent = "";

            emptyState.hidden = false;
            resultArea.hidden = true;

            if (copyBtn) {
                copyBtn.textContent = "Copy Code";
            }
        }, 0);
    });
});
