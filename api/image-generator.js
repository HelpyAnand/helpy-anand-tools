
export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    try {

        const { prompt } = req.body || {};

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

        const MAX_CHARACTERS = 2048;

        if (cleanPrompt.length > MAX_CHARACTERS) {
            return res.status(400).json({
                error: "Maximum 2,048 characters allowed."
            });
        }

        // Check Cloudflare credentials
        const accountId =
            process.env.CLOUDFLARE_ACCOUNT_ID;

        const apiToken =
            process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            console.error("Cloudflare credentials missing.");

            return res.status(500).json({
                error: "Image service configuration error."
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
            })

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

            console.error(
                "Cloudflare API Error:",
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

        // Convert Base64 to image data URL
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
            error
        );

        return res.status(500).json({
            error: "Something went wrong. Please try again."
        });

    }

}
