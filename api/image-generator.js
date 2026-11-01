
export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    try {

        const {
            prompt,
            turnstileToken
        } = req.body || {};

        // Validate prompt
        if (
            typeof prompt !== "string" ||
            !prompt.trim()
        ) {
            return res.status(400).json({
                error: "Please enter an image description."
            });
        }

        const cleanPrompt = prompt.trim();

        if (cleanPrompt.length > 2048) {
            return res.status(400).json({
                error: "Maximum 2,048 characters allowed."
            });
        }

        // Validate Turnstile token
        if (
            typeof turnstileToken !== "string" ||
            !turnstileToken.trim() ||
            turnstileToken.length > 2048
        ) {
            return res.status(403).json({
                error: "Please complete security verification."
            });
        }

        // Read environment variables
        const accountId =
            process.env.CLOUDFLARE_ACCOUNT_ID;

        const apiToken =
            process.env.CLOUDFLARE_API_TOKEN;

        const turnstileSecret =
            process.env.TURNSTILE_SECRET_KEY;

        if (
            !accountId ||
            !apiToken ||
            !turnstileSecret
        ) {
            console.error("Required API configuration missing.");

            return res.status(500).json({
                error: "Image service configuration error."
            });
        }

        // Verify Turnstile token on server
        const forwardedFor =
            req.headers["x-forwarded-for"];

        const remoteIp = typeof forwardedFor === "string"
            ? forwardedFor.split(",")[0].trim()
            : "";

        const verificationBody = new URLSearchParams({
            secret: turnstileSecret,
            response: turnstileToken.trim()
        });

        if (remoteIp) {
            verificationBody.append("remoteip", remoteIp);
        }

        const verificationResponse = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: verificationBody,
                signal: AbortSignal.timeout(10000)
            }
        );

        if (!verificationResponse.ok) {
            throw new Error("Turnstile verification service unavailable.");
        }

        const verificationData =
            await verificationResponse.json();

        if (
            !verificationData.success ||
            verificationData.hostname !==
                "helpy-anand-tools.vercel.app"
        ) {
            console.warn(
                "Turnstile verification rejected:",
                verificationData["error-codes"] || "Invalid hostname/token"
            );

            return res.status(403).json({
                error: "Security verification failed. Please try again."
            });
        }

        // Cloudflare FLUX.1 Schnell API
        const apiUrl =
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

        const response = await fetch(apiUrl, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: cleanPrompt,
                steps: 4
            }),

            signal: AbortSignal.timeout(120000)

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            console.error(
                "Cloudflare AI API Error:",
                data.errors || response.status
            );

            return res.status(502).json({
                error: "Image generation failed. Please try again later."
            });
        }

        const generatedImage =
            data?.result?.image;

        if (
            !generatedImage ||
            typeof generatedImage !== "string"
        ) {
            console.error("Image missing in API response.");

            return res.status(500).json({
                error: "AI did not return an image."
            });
        }

        // Return generated image
        const imageUrl =
            `data:image/jpeg;base64,${generatedImage}`;

        return res.status(200).json({

            success: true,

            image: imageUrl,

            message: "Image generated successfully."

        });

    } catch (error) {

        console.error(
            "Image Generator Server Error:",
            error.message
        );

        return res.status(500).json({
            error: "Something went wrong. Please try again."
        });

    }

}
