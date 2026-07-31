const textInput = document.getElementById("textInput");

const words = document.getElementById("words");
const characters = document.getElementById("characters");
const sentences = document.getElementById("sentences");
const paragraphs = document.getElementById("paragraphs");

textInput.addEventListener("input", updateCount);

function updateCount() {

    const text = textInput.value;

    // Characters
    characters.textContent = text.length;

    // Words
    const wordArray = text.trim().split(/\s+/).filter(word => word.length > 0);
    words.textContent = text.trim() === "" ? 0 : wordArray.length;

    // Sentences
    const sentenceArray = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    sentences.textContent = sentenceArray.length;

    // Paragraphs
    const paragraphArray = text.split(/\n+/).filter(paragraph => paragraph.trim().length > 0);
    paragraphs.textContent = paragraphArray.length;
}

// Clear Button
document.getElementById("clearBtn").addEventListener("click", () => {
    textInput.value = "";
    updateCount();
});

// Copy Button
document.getElementById("copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(textInput.value);
    alert("Text Copied!");
});

// Initial Count
updateCount();