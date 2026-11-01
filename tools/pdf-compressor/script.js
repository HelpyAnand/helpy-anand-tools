
import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
import { PDFDocument } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";

// =====================================================
// PDF LIBRARY CONFIGURATION
// =====================================================

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

// =====================================================
// DOM ELEMENTS
// =====================================================

const pdfInput = document.getElementById("pdfInput");
const pdfDropArea = document.getElementById("pdfDropArea");
const compressionLevel = document.getElementById("compressionLevel");

const compressBtn = document.getElementById("compressBtn");
const downloadBtn = document.getElementById("downloadBtn");

const pdfFileName = document.getElementById("pdfFileName");
const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");

const pdfResults = document.getElementById("pdfResults");
const pdfStatus = document.getElementById("pdfStatus");

// =====================================================
// VARIABLES
// =====================================================

let selectedFile = null;
let compressedBlob = null;
let compressedURL = null;

// =====================================================
// COMPRESSION SETTINGS
// =====================================================

const compressionSettings = {
    low: {
        scale: 1.5,
        quality: 0.82
    },

    medium: {
        scale: 1.15,
        quality: 0.68
    },

    high: {
        scale: 1.0,
        quality: 0.62
    }
};

// =====================================================
// FILE SIZE FORMAT
// =====================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

// =====================================================
// STATUS MESSAGE
// =====================================================

function showStatus(message, type = "info") {

    pdfStatus.textContent = message;
    pdfStatus.className = type;
}

// =====================================================
// CLEAN PREVIOUS RESULT
// =====================================================

function clearPreviousResult() {

    compressedBlob = null;

    if (compressedURL) {
        URL.revokeObjectURL(compressedURL);
        compressedURL = null;
    }

    downloadBtn.disabled = true;
    pdfResults.hidden = true;

    compressedSize.textContent = "-";
    savedPercent.textContent = "-";

    showStatus("");
}

// =====================================================
// FILE VALIDATION
// =====================================================

function isValidPDF(file) {

    if (!file) {
        return false;
    }

    return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
}

// =====================================================
// SELECT PDF FILE
// =====================================================

function handleFile(file) {

    if (!isValidPDF(file)) {

        selectedFile = null;

        pdfInput.value = "";
        pdfFileName.textContent = "";

        compressBtn.disabled = true;

        clearPreviousResult();

        showStatus("Please select a valid PDF file.", "error");

        return;
    }

    if (file.size === 0) {

        selectedFile = null;
        compressBtn.disabled = true;

        showStatus("The selected PDF file is empty.", "error");

        return;
    }

    selectedFile = file;

    clearPreviousResult();

    pdfFileName.textContent =
        file.name + " (" + formatFileSize(file.size) + ")";

    originalSize.textContent = formatFileSize(file.size);

    compressBtn.disabled = false;

    showStatus("PDF selected successfully.", "success");
}

// =====================================================
// FILE INPUT
// =====================================================

pdfInput.addEventListener("change", function () {

    const file = this.files[0];

    if (file) {
        handleFile(file);
    }
});

// =====================================================
// DRAG AND DROP
// =====================================================

pdfDropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    pdfDropArea.classList.add("drag-over");

});

pdfDropArea.addEventListener("dragleave", function () {

    pdfDropArea.classList.remove("drag-over");

});

pdfDropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    pdfDropArea.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }

});

// =====================================================
// CANVAS TO JPEG
// =====================================================

function canvasToJPEG(canvas, quality) {

    return new Promise((resolve, reject) => {

        canvas.toBlob(
            function (blob) {

                if (!blob) {
                    reject(new Error("Image conversion failed."));
                    return;
                }

                resolve(blob);

            },
            "image/jpeg",
            quality
        );

    });
}

// =====================================================
// COMPRESS PDF
// =====================================================

async function compressPDF() {

    if (!selectedFile) {

        showStatus("Please select a PDF file first.", "error");

        return;
    }

    const settings =
        compressionSettings[compressionLevel.value];

    if (!settings) {

        showStatus("Invalid compression setting.", "error");

        return;
    }

    compressBtn.disabled = true;
    downloadBtn.disabled = true;

    clearPreviousResult();

    pdfResults.hidden = false;

    showStatus("Reading PDF file...", "info");

    let pdfDocument = null;

    try {

        // Read original PDF
        const arrayBuffer = await selectedFile.arrayBuffer();

        const pdfData = new Uint8Array(arrayBuffer);

        // Load PDF using PDF.js
        pdfDocument = await pdfjsLib.getDocument({
            data: pdfData
        }).promise;

        const totalPages = pdfDocument.numPages;

        // Create a new PDF
        const newPDF = await PDFDocument.create();

        // Process each page
        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {

            showStatus(
                "Compressing page " + pageNumber +
                " of " + totalPages + "...",
                "info"
            );

            const page = await pdfDocument.getPage(pageNumber);

            // Original page dimensions at scale 1
            const baseViewport = page.getViewport({
                scale: 1
            });

            // Apply compression scale
            let renderScale = settings.scale;

            // Limit maximum canvas dimension to reduce memory usage
            const maxDimension = 4096;

            const largestDimension = Math.max(
                baseViewport.width,
                baseViewport.height
            );

            if (largestDimension * renderScale > maxDimension) {

                renderScale = maxDimension / largestDimension;

            }

            const viewport = page.getViewport({
                scale: renderScale
            });

            // Create canvas
            const canvas = document.createElement("canvas");

            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);

            const context = canvas.getContext("2d", {
                alpha: false
            });

            if (!context) {
                throw new Error("Canvas is not supported by this browser.");
            }

            // White background
            context.fillStyle = "#ffffff";

            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // Render PDF page
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert canvas to JPEG
            const imageBlob = await canvasToJPEG(
                canvas,
                settings.quality
            );

            const imageBytes = await imageBlob.arrayBuffer();

            // Embed JPEG in new PDF
            const embeddedImage = await newPDF.embedJpg(
                imageBytes
            );

            // Preserve original page dimensions
            const newPage = newPDF.addPage([
                baseViewport.width,
                baseViewport.height
            ]);

            newPage.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: baseViewport.width,
                height: baseViewport.height
            });

            // Clean page resources
            canvas.width = 0;
            canvas.height = 0;

            page.cleanup();

        }

        // Generate compressed PDF
        showStatus("Generating compressed PDF...", "info");

        const pdfBytes = await newPDF.save();

        compressedBlob = new Blob(
            [pdfBytes],
            {
                type: "application/pdf"
            }
        );

        // Calculate compression results
        const originalBytes = selectedFile.size;
        const newBytes = compressedBlob.size;

        const reduction =
            ((originalBytes - newBytes) / originalBytes) * 100;

            // Prevent downloading a PDF if compression increases its size
if (newBytes >= originalBytes) {

    compressedSize.textContent =
        formatFileSize(newBytes);

    savedPercent.textContent =
        Math.abs(reduction).toFixed(2) + "% larger";

    compressedBlob = null;

    if (compressedURL) {
        URL.revokeObjectURL(compressedURL);
        compressedURL = null;
    }

    downloadBtn.disabled = true;

    showStatus(
        "Compression could not reduce this PDF size. Your original PDF is unchanged. Please try another PDF.",
        "error"
    );

    return;
}

        compressedSize.textContent =
            formatFileSize(newBytes);

        if (reduction > 0) {

            savedPercent.textContent =
                reduction.toFixed(2) + "%";

        } else if (reduction < 0) {

            savedPercent.textContent =
                Math.abs(reduction).toFixed(2) + "% larger";

        } else {

            savedPercent.textContent = "0%";

        }

        compressedURL = URL.createObjectURL(compressedBlob);

        downloadBtn.disabled = false;

        if (reduction > 0) {

            showStatus(
                "PDF compressed successfully! " +
                reduction.toFixed(2) +
                "% file size reduced.",
                "success"
            );

        } else {

            showStatus(
                "PDF created successfully, but its size did not decrease. Try High Compression.",
                "info"
            );

        }

    } catch (error) {

        console.error("PDF Compression Error:", error);

        compressedBlob = null;

        if (compressedURL) {
            URL.revokeObjectURL(compressedURL);
            compressedURL = null;
        }

        downloadBtn.disabled = true;

        showStatus(
            "Unable to compress PDF. Please check that the file is valid, not password-protected, and try again.",
            "error"
        );

    } finally {

        if (pdfDocument) {
            await pdfDocument.destroy();
        }

        compressBtn.disabled = !selectedFile;

    }

}

// =====================================================
// COMPRESS BUTTON
// =====================================================

compressBtn.addEventListener("click", compressPDF);

// =====================================================
// DOWNLOAD PDF
// =====================================================

downloadBtn.addEventListener("click", function () {

    if (!compressedBlob || !compressedURL) {
        return;
    }

    const link = document.createElement("a");

    const originalName = selectedFile.name.replace(/\.pdf$/i, "");

    link.href = compressedURL;

    link.download = originalName + "-compressed.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

});

// =====================================================
// INITIALIZATION
// =====================================================

console.log("PDF.js loaded:", !!pdfjsLib);
console.log("pdf-lib loaded:", !!PDFDocument);
