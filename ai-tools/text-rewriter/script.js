// ==========================================
// AI TEXT REWRITER
// Helpy Anand Tools
// ==========================================

const inputText =
    document.getElementById("inputText");

const outputText =
    document.getElementById("outputText");

const rewriteBtn =
    document.getElementById("rewriteBtn");

const clearBtn =
    document.getElementById("clearBtn");

const copyBtn =
    document.getElementById("copyBtn");

const charCount =
    document.getElementById("charCount");

const statusMessage =
    document.getElementById("statusMessage");


// ==========================================
// Character Counter
// ==========================================

inputText.addEventListener("input", function () {

    charCount.textContent =
        inputText.value.length;

});


// ==========================================
// Rewrite with AI
// ==========================================

rewriteBtn.addEventListener(
    "click",
    async function () {

        const text =
            inputText.value.trim();


        // Empty text check
        if (!text) {

            statusMessage.textContent =
                "Please enter some text first.";

            statusMessage.style.color =
                "#dc2626";

            inputText.focus();

            return;
        }


        // Disable button
        rewriteBtn.disabled = true;

        rewriteBtn.textContent =
            "✨ Rewriting...";


        statusMessage.textContent =
            "AI is rewriting your text...";

        statusMessage.style.color =
            "#2563eb";


        outputText.value = "";

        copyBtn.disabled = true;


        try {

            const response =
                await fetch("/api/rewrite", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })

                });


            const data =
                await response.json();


            // API error
            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to rewrite text."
                );

            }


            // Show result
            outputText.value =
                data.rewrittenText || "";


            if (!outputText.value) {

                throw new Error(
                    "AI returned empty text."
                );

            }


            copyBtn.disabled = false;


            statusMessage.textContent =
                "✓ Text rewritten successfully.";

            statusMessage.style.color =
                "#16a34a";


        } catch (error) {

            console.error(
                "Rewrite Error:",
                error
            );


            statusMessage.textContent =
                error.message ||
                "Something went wrong. Please try again.";

            statusMessage.style.color =
                "#dc2626";


        } finally {

            rewriteBtn.disabled = false;

            rewriteBtn.textContent =
                "✨ Rewrite with AI";

        }

    }
);


// ==========================================
// Copy Rewritten Text
// ==========================================

copyBtn.addEventListener(
    "click",
    async function () {

        if (!outputText.value) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                outputText.value
            );


            const originalText =
                copyBtn.textContent;


            copyBtn.textContent =
                "✓ Copied";


            setTimeout(function () {

                copyBtn.textContent =
                    originalText;

            }, 1500);


        } catch (error) {

            console.error(
                "Copy Error:",
                error
            );

            statusMessage.textContent =
                "Unable to copy text.";

            statusMessage.style.color =
                "#dc2626";

        }

    }
);


// ==========================================
// Clear Tool
// ==========================================

clearBtn.addEventListener(
    "click",
    function () {

        inputText.value = "";

        outputText.value = "";

        charCount.textContent = "0";

        copyBtn.disabled = true;

        statusMessage.textContent = "";

        inputText.focus();

    }
);