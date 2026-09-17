
// ==========================================
// PDF TO WORD CONVERTER
// Step 5 - PDF Text Extraction
// ==========================================

const pdfFile = document.getElementById("pdfFile");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const convertBtn = document.getElementById("convertBtn");

const progressBox = document.getElementById("progressBox");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const statusMessage = document.getElementById("statusMessage");


// ==========================================
// PDF FILE SELECTION
// ==========================================

pdfFile.addEventListener("change", function () {

    const file = pdfFile.files[0];

    if (!file) {

        fileInfo.style.display = "none";
        convertBtn.style.display = "none";

        return;
    }


    // Check PDF type
    if (file.type !== "application/pdf") {

        alert("Please select a valid PDF file.");

        pdfFile.value = "";
        fileInfo.style.display = "none";
        convertBtn.style.display = "none";

        return;
    }


    // File name
    fileName.textContent = file.name;


    // File size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    fileSize.textContent = sizeInMB + " MB";


    // Show information
    fileInfo.style.display = "block";

    // Show convert button
    convertBtn.style.display = "block";

});


// ==========================================
// CONVERT BUTTON
// ==========================================

convertBtn.addEventListener("click", async function () {

    const file = pdfFile.files[0];

    if (!file) {

        alert("Please select a PDF file first.");

        return;
    }


    try {

        convertBtn.disabled = true;

        progressBox.style.display = "block";

        statusMessage.style.display = "none";

        progressFill.style.width = "10%";

        progressText.textContent = "Reading PDF...";


        // Read PDF file
        const arrayBuffer = await file.arrayBuffer();


        progressFill.style.width = "25%";

        progressText.textContent = "Loading PDF...";


        // Check PDF.js
        if (typeof pdfjsLib === "undefined") {

            throw new Error(
                "PDF.js library could not be loaded."
            );

        }


        // Load PDF
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;


        let fullText = "";


        // Process every page
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

            progressText.textContent =
                "Extracting page " +
                pageNumber +
                " of " +
                pdf.numPages +
                "...";


            const page = await pdf.getPage(pageNumber);


            const textContent =
                await page.getTextContent();


            const pageText =
                textContent.items
                    .map(item => item.str)
                    .join(" ");


            fullText += pageText + "\n\n";


            const progress =
                25 +
                Math.round(
                    (pageNumber / pdf.numPages) * 65
                );


            progressFill.style.width =
                progress + "%";
        }


        progressFill.style.width = "100%";

        progressText.textContent =
            "Text extraction completed.";


        console.log(
            "Extracted PDF Text:",
            fullText
        );


        // Check extracted text
        if (!fullText.trim()) {

            throw new Error(
                "No selectable text was found in this PDF. It may be a scanned PDF."
            );

        }


        statusMessage.className =
            "status-message status-success";

        statusMessage.textContent =
            "PDF text extracted successfully. Check the browser console for the extracted text.";

        statusMessage.style.display = "block";


        convertBtn.disabled = false;


    } catch (error) {

        console.error(
            "PDF processing error:",
            error
        );


        progressBox.style.display = "none";


        statusMessage.className =
            "status-message status-error";

        statusMessage.textContent =
            error.message ||
            "Unable to process this PDF.";

        statusMessage.style.display = "block";


        convertBtn.disabled = false;

    }

});
