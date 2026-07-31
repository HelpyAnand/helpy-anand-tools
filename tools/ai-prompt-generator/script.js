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

    const prompt = `
Write a ${tone.value} ${category.value} about "${topic.value}".

Platform: ${platform.value}

Language: ${language.value}

Word Count: ${wordCount.value} words.

Make the content SEO Friendly.

Include:
• Attractive Title
• Headings
• Bullet Points
• Conclusion
`;

    outputPrompt.value = prompt.trim();

});

// ===== Copy Prompt =====

copyBtn.addEventListener("click", function () {

    if (outputPrompt.value === "") {
        alert("Nothing to copy!");
        return;
    }

    outputPrompt.select();
    outputPrompt.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(outputPrompt.value);

    alert("Prompt copied successfully!");
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