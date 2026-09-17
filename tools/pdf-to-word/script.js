
// ==========================================
// PDF TO WORD CONVERTER
// Step 4 - PDF File Selection
// ==========================================

const pdfFile = document.getElementById("pdfFile");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const convertBtn = document.getElementById("convertBtn");


// PDF File Selection
pdfFile.addEventListener("change", function () {

    const file = pdfFile.files[0];

    // No file selected
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


    // Display file name
    fileName.textContent = file.name;


    // Convert bytes to MB
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    fileSize.textContent = sizeInMB + " MB";


    // Show file information
    fileInfo.style.display = "block";


    // Show convert button
    convertBtn.style.display = "block";

});


