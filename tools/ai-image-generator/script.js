
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("imageGeneratorForm");
    const promptInput = document.getElementById("promptInput");
    const charCount = document.getElementById("charCount");
    const generateBtn = document.getElementById("generateBtn");
    const statusText = document.getElementById("statusText");
    const resultSection = document.getElementById("resultSection");
    const generatedImage = document.getElementById("generatedImage");
    const actionButtons = document.getElementById("actionButtons");
    const downloadBtn = document.getElementById("downloadBtn");
    const resetBtn = document.getElementById("resetBtn");

    let generatedImageUrl = "";

    // Load shared Navbar and Footer
    async function loadComponent(elementId, filePath) {
        const element = document.getElementById(elementId);

        if (!element) return;

        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error("Component could not be loaded.");
            }

            element.innerHTML = await response.text();

        } catch (error) {
            console.error("Component loading error:", error);
        }
    }

    loadComponent("navbar-container", "../../components/navbar.html");
    loadComponent("footer-container", "../../components/footer.html");

    // Character Counter
    promptInput.addEventListener("input", () => {
        charCount.textContent = `${promptInput.value.length} / 2048`;
    });

    // Status Helpers
    function showStatus(message, type = "") {
        statusText.textContent = message;
        statusText.className = "status-message";

        if (type) {
            statusText.classList.add(type);
        }
    }

    // Clear generated image
    function clearGeneratedImage() {
        generatedImage.removeAttribute("src");
        generatedImage.hidden = true;
        resultSection.style.display = "none";
        actionButtons.style.display = "none";

        generatedImageUrl = "";
    }

    // Reset Turnstile widget
    function resetVerification() {
        if (window.turnstile) {
            try {
                window.turnstile.reset();
            } catch (error) {
                console.error("Turnstile reset error:", error);
            }
        }
    }

    // Generate Image
    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const prompt = promptInput.value.trim();

        if (!prompt) {
            showStatus("Please enter an image description.", "error");
            promptInput.focus();
            return;
        }

        if (prompt.length > 2048) {
            showStatus("Maximum 2,048 characters allowed.", "error");
            return;
        }

        // Read Cloudflare Turnstile token
        const turnstileToken =
            document.querySelector('[name="cf-turnstile-response"]')?.value;

        if (!turnstileToken) {
            showStatus(
                "Please complete the security verification first.",
                "error"
            );
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "Generating Image...";

        clearGeneratedImage();

        showStatus(
            "Your AI image is being generated. Please wait...",
            "loading"
        );

        try {

            const response = await fetch("/api/image-generator", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: prompt,
                    turnstileToken: turnstileToken
                })

            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.image) {
                throw new Error(
                    data.error || "Image generation failed. Please try again."
                );
            }

            generatedImageUrl = data.image;

            generatedImage.src = generatedImageUrl;
            generatedImage.hidden = false;

            resultSection.style.display = "block";
            actionButtons.style.display = "flex";

            showStatus(
                "Your image has been generated successfully!",
                "success"
            );

            resultSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            // Token is single-use; obtain a fresh verification next time.
            resetVerification();

        } catch (error) {

            console.error("Image generation error:", error);

            showStatus(
                error.message || "Something went wrong. Please try again.",
                "error"
            );

            resetVerification();

        } finally {

            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Image";

        }

    });

    // Download Image
    downloadBtn.addEventListener("click", () => {

        if (!generatedImageUrl) {
            showStatus("No generated image available to download.", "error");
            return;
        }

        const link = document.createElement("a");

        link.href = generatedImageUrl;
        link.download = "helpy-anand-ai-image.jpg";

        document.body.appendChild(link);
        link.click();
        link.remove();

    });

    // Create Another Image
    resetBtn.addEventListener("click", () => {

        promptInput.value = "";
        charCount.textContent = "0 / 2048";

        clearGeneratedImage();
        showStatus("");

        resetVerification();

        promptInput.focus();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});
