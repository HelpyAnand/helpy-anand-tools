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

IMPORTANT RULES:
- Automatically detect the language of the input text.
- Rewrite the text in the SAME language as the input.
- Never translate the text into another language.
- Preserve the original meaning.
- Do not add false or new information.
- Change the wording and sentence structure naturally.
- Do not copy the original text word-for-word unless a phrase must remain unchanged.
- Do not explain what you changed.
- Return ONLY the rewritten text.
- If the input is in Hindi, return Hindi.
- If the input is in English, return English.
- If the input is in Hinglish, return Hinglish.
- If the input is in another language, return that same language.

Text:
${text}
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },

                body: JSON.stringify({
                    model: "gemini-3.5-flash-lite",
                    input: prompt
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "Gemini API Error:",
                data
            );

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "AI service error."
            });
        }

        const rewrittenText =
            data?.steps
                ?.filter(
                    step => step.type === "model_output"
                )
                ?.flatMap(
                    step => step.content || []
                )
                ?.filter(
                    content => content.type === "text"
                )
                ?.map(
                    content => content.text
                )
                ?.join("\n")
                ?.trim();

        if (!rewrittenText) {

            console.error(
                "Gemini Response:",
                JSON.stringify(data, null, 2)
            );

            return res.status(500).json({
                error: "AI did not return any text."
            });
        }

        return res.status(200).json({
            rewrittenText: rewrittenText
        });

    } catch (error) {

        console.error(
            "Server Error:",
            error
        );

        return res.status(500).json({
            error: "Something went wrong."
        });
    }
}