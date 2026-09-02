
/* =========================================================
   WORD COUNTER - HELPY ANAND TOOLS
   CLEAN FINAL JAVASCRIPT
========================================================= */

const textInput = document.getElementById("textInput");

const words = document.getElementById("words");
const characters = document.getElementById("characters");
const sentences = document.getElementById("sentences");
const paragraphs = document.getElementById("paragraphs");

const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");


/* =========================================================
   UPDATE COUNTS
========================================================= */

function updateCount() {

    const text = textInput.value;


    /* CHARACTERS */
    characters.textContent = text.length;


    /* WORDS */
    const wordArray = text
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);

    words.textContent =
        text.trim() === ""
            ? 0
            : wordArray.length;


    /* SENTENCES */
    const sentenceArray = text
        .split(/[.!?]+/)
        .filter(sentence => sentence.trim().length > 0);

    sentences.textContent =
        text.trim() === ""
            ? 0
            : sentenceArray.length;


    /* PARAGRAPHS */
    const paragraphArray = text
        .split(/\n+/)
        .filter(paragraph => paragraph.trim().length > 0);

    paragraphs.textContent =
        text.trim() === ""
            ? 0
            : paragraphArray.length;
}


/* =========================================================
   LIVE COUNTING
========================================================= */

textInput.addEventListener(
    "input",
    updateCount
);


/* =========================================================
   CLEAR BUTTON
========================================================= */

clearBtn.addEventListener(
    "click",
    function () {

        textInput.value = "";

        updateCount();

        textInput.focus();
    }
);


/* =========================================================
   COPY BUTTON
========================================================= */

copyBtn.addEventListener(
    "click",
    async function () {

        const text = textInput.value;

        if (text.trim() === "") {

            alert("Please enter some text first.");

            textInput.focus();

            return;
        }


        try {

            await navigator.clipboard.writeText(text);

            alert("Text copied successfully!");

        } catch (error) {

            alert(
                "Unable to copy the text. Please copy it manually."
            );
        }
    }
);


/* =========================================================
   INITIAL COUNT
========================================================= */

updateCount();
