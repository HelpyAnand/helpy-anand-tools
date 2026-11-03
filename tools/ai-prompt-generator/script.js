// ===== Elements =====

const platform = document.getElementById("platform");
const category = document.getElementById("category");
const topic = document.getElementById("topic");
const tone = document.getElementById("tone");
const language = document.getElementById("language");
const wordCount = document.getElementById("wordCount");

const outputPrompt = document.getElementById("outputPrompt");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

generateBtn.addEventListener("click", function () {

    if (topic.value.trim() === "") {
        alert("Please enter a topic.");
        topic.focus();
        return;
    }

  let prompt = promptTemplates[category.value];

prompt = prompt.replace("{topic}", topic.value);
prompt = prompt.replace("{tone}", toneInstructions[tone.value]);
prompt = prompt.replace("{language}", languageInstructions[language.value]);
prompt = prompt.replace("{wordCount}", getWordCountInstruction(wordCount.value));
const finalPrompt =
platformPrefix[platform.value] + "\n\n" + prompt;

outputPrompt.value = finalPrompt;

 
});

// ===== Prompt Templates =====

const promptTemplates = {

"Blog Writing": `
Write a detailed, informative and engaging blog article about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- SEO-friendly title
- Engaging introduction
- Well-structured H2 and H3 headings
- Detailed explanations
- Relevant examples
- Bullet points
- Conclusion
- Frequently Asked Questions (FAQ)
`,

"SEO Article": `
Write a fully SEO-optimized article about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- SEO meta title
- Meta description
- Primary and secondary keywords
- Search intent analysis
- H1, H2 and H3 headings
- Keyword optimization without keyword stuffing
- Internal and external link suggestions
- Conclusion
- FAQs
`,

"YouTube Script": `
Create an engaging YouTube video script about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Attention-grabbing opening hook
- Video introduction
- Main content divided into clear sections
- Examples and storytelling
- Audience engagement questions
- Suggested visual scenes
- Strong call to action
- Closing
`,

"Facebook Post": `
Create an engaging Facebook post about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Attention-grabbing opening
- Interesting and useful content
- Short, readable paragraphs
- Relevant emojis where appropriate
- Engaging question for the audience
- Suitable hashtags
- Call to action
`,

"Instagram Caption": `
Write a creative and engaging Instagram caption about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Catchy opening line
- Short and engaging caption
- Relevant emojis
- Audience engagement question
- Clear call to action
- Relevant Instagram hashtags
`,

"Email": `
Write a clear and professional email about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Appropriate email subject line
- Professional greeting
- Clear purpose of the email
- Well-organized message body
- Polite and relevant closing
- Professional sign-off
`,

"Coding": `
Act as an experienced software developer and programming mentor.

Task: Help me with "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Clear understanding of the requirement
- Recommended technology and approach
- Complete and properly structured code
- Step-by-step implementation instructions
- Explanation of important code sections
- Error handling and best practices
- Testing instructions
- Common mistakes and solutions

Make the solution beginner-friendly and practical.
`,

"Image Prompt": `
Create a detailed and professional AI image-generation prompt about "{topic}".

Tone: {tone}
Language: {language}
Length: {wordCount}

Include:
- Main subject and scene description
- Visual style and artistic direction
- Composition and camera angle
- Lighting and shadows
- Color palette
- Background and environment
- Texture and fine details
- Image quality and resolution guidance
- Negative prompt suggestions

Make the final image prompt descriptive and visually specific.
`
};


// ===== Platform Prefix =====

const platformPrefix = {

"ChatGPT":
"You are an expert AI assistant. Think step by step and provide the highest quality response.",

"Gemini":
"You are Google's Gemini AI. Generate detailed, accurate and well-structured content.",

"Claude":
"You are Claude AI. Think deeply before answering and provide clear reasoning.",

"Grok":
"You are Grok AI. Provide practical, direct and creative responses.",

"DeepSeek":
"You are DeepSeek AI. Generate comprehensive and SEO-friendly content."

};


// ===== Tone Instructions =====

const toneInstructions = {

"Professional":
"Use a professional and authoritative tone.",

"Friendly":
"Write in a friendly and conversational style.",

"Formal":
"Use formal language with proper grammar.",

"Casual":
"Write naturally like talking to a friend.",

"Persuasive":
"Write persuasively and encourage the reader to take action."

};


// ===== Language Instructions =====

const languageInstructions = {

"English":
"Write the complete response in fluent and natural English.",

"Hindi":
"Write the complete response in simple, natural and easy-to-understand Hindi."

};


// ===== Word Count Instructions =====

function getWordCountInstruction(words) {

    return `Write approximately ${words} words while maintaining quality, clarity and completeness.`;

}

// ===== Copy Prompt =====

copyBtn.addEventListener("click", function () {

    if (outputPrompt.value.trim() === "") {
        alert("Nothing to copy!");
        return;
    }

    navigator.clipboard.writeText(outputPrompt.value);

    copyBtn.innerHTML = "✅ Copied";

    setTimeout(function () {

        copyBtn.innerHTML = "📋 Copy";

    }, 2000);

});

// ===== Reset =====

resetBtn.addEventListener("click", function () {

    platform.selectedIndex = 0;
    category.selectedIndex = 0;
    topic.value = "";
    tone.selectedIndex = 0;
    language.selectedIndex = 0;
    wordCount.value = 500;

    outputPrompt.value = "";

    topic.focus();

});