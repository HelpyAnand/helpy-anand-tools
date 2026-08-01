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
Write a detailed blog article about "{topic}".

Tone: {tone}

Language: {language}

Length: {wordCount} words.

Include:

• SEO Friendly Title

• Introduction

• H2 & H3 Headings

• Bullet Points

• Conclusion

• FAQ
`,

"SEO Article": `
Write a complete SEO optimized article about "{topic}".

Tone: {tone}

Language: {language}

Length: {wordCount} words.

Include:

• Meta Title

• Meta Description

• Focus Keyword

• H1

• H2

• H3

• Conclusion
`,

"YouTube Script": `
Write an engaging YouTube video script about "{topic}".

Tone: {tone}

Language: {language}

Length: {wordCount} words.

Include:

• Hook

• Intro

• Main Content

• Call To Action
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