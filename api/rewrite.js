export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                error: "Please enter some text."
            });
        }

        const prompt = `
Rewrite the following text in a clear, natural and improved way.

Keep the original meaning.
Do not add false information.
Do not explain what you changed.
Return only the rewritten text.

Text:
${text}
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

    console.error("Gemini API Error:", data);

    return res.status(response.status).json({
        error:
            data?.error?.message ||
            "AI service error."
    });

}

        const rewrittenText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rewrittenText) {

            return res.status(500).json({
                error: "AI did not return any text."
            });

        }

        return res.status(200).json({
            rewrittenText: rewrittenText.trim()
        });

    } catch (error) {

        console.error("Server Error:", error);

        return res.status(500).json({
            error: "Something went wrong."
        });

    }

}