
// ==========================================
// IMAGE RESIZER
// Helpy Anand Tools
// ==========================================


// ==========================================
// Elements
// ==========================================

const imageInput = document.getElementById("imageInput");
const dropArea = document.getElementById("dropArea");

const previewBox = document.getElementById("previewBox");
const previewImage = document.getElementById("previewImage");
const previewDimensions = document.getElementById("previewDimensions");
const previewFileSize = document.getElementById("previewFileSize");

const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const aspectRatio = document.getElementById("aspectRatio");

const resizeBtn = document.getElementById("resizeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const statusMessage = document.getElementById("statusMessage");

const resultBox = document.getElementById("resultBox");
const resultImage = document.getElementById("resultImage");
const newDimensions = document.getElementById("newDimensions");
const resizedFileSize = document.getElementById("resizedFileSize");

const resizeCanvas = document.getElementById("resizeCanvas");


// ==========================================
// Variables
// ==========================================

let selectedFile = null;

let originalWidth = 0;
let originalHeight = 0;

let resizedBlob = null;

let previewObjectURL = null;
let resultObjectURL = null;


// ==========================================
// File Selection
// ==========================================

imageInput.addEventListener("change", function () {

    const file = imageInput.files[0];

    if (file) {
        loadImage(file);
    }

});


// ==========================================
// Drag & Drop
// ==========================================

dropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropArea.classList.add("dragover");

});


dropArea.addEventListener("dragleave", function () {

    dropArea.classList.remove("dragover");

});


dropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    dropArea.classList.remove("dragover");

    const file = event.dataTransfer.files[0];

    if (file) {
        loadImage(file);
    }

});


// ==========================================
// Load Image
// ==========================================

function loadImage(file) {

    // Supported image formats

    const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (!supportedTypes.includes(file.type)) {

        showError(
            "Only JPG, PNG and WebP images are supported."
        );

        return;

    }


    // Clean previous preview URL

    if (previewObjectURL) {

        URL.revokeObjectURL(previewObjectURL);

        previewObjectURL = null;

    }


    // Store selected file

    selectedFile = file;


    // Create object URL

    previewObjectURL =
        URL.createObjectURL(file);


    const image = new Image();


    image.onload = function () {

        originalWidth =
            image.naturalWidth;

        originalHeight =
            image.naturalHeight;


        // Show original dimensions

        previewDimensions.textContent =
            originalWidth +
            " × " +
            originalHeight +
            " px";


        // Show original file size

        previewFileSize.textContent =
            formatFileSize(file.size);


        // Set width and height

        widthInput.value =
            originalWidth;

        heightInput.value =
            originalHeight;


        // Show preview

        previewImage.src =
            previewObjectURL;

        previewBox.style.display =
            "block";


        // Enable resize

        resizeBtn.disabled =
            false;


        // Remove previous result

        clearResult();


        // Status

        statusMessage.textContent =
            "Image loaded successfully.";

        statusMessage.style.color =
            "#16a34a";

    };


    image.onerror = function () {

        showError(
            "Unable to load this image."
        );

        selectedFile = null;

    };


    image.src =
        previewObjectURL;

}


// ==========================================
// Maintain Aspect Ratio
// ==========================================

widthInput.addEventListener("input", function () {

    if (!aspectRatio.checked) {
        return;
    }


    if (
        originalWidth <= 0 ||
        originalHeight <= 0
    ) {
        return;
    }


    const width =
        parseInt(widthInput.value, 10);


    if (!width || width <= 0) {
        return;
    }


    const ratio =
        originalHeight / originalWidth;


    heightInput.value =
        Math.round(width * ratio);

});


heightInput.addEventListener("input", function () {

    if (!aspectRatio.checked) {
        return;
    }


    if (
        originalWidth <= 0 ||
        originalHeight <= 0
    ) {
        return;
    }


    const height =
        parseInt(heightInput.value, 10);


    if (!height || height <= 0) {
        return;
    }


    const ratio =
        originalWidth / originalHeight;


    widthInput.value =
        Math.round(height * ratio);

});


// ==========================================
// Resize Image
// ==========================================

resizeBtn.addEventListener("click", function () {

    if (!selectedFile) {

        showError(
            "Please select an image first."
        );

        return;

    }


    const newWidth =
        parseInt(widthInput.value, 10);

    const newHeight =
        parseInt(heightInput.value, 10);


    // Validate dimensions

    if (
        !Number.isFinite(newWidth) ||
        !Number.isFinite(newHeight) ||
        newWidth <= 0 ||
        newHeight <= 0
    ) {

        showError(
            "Please enter valid width and height."
        );

        return;

    }


    // Prevent extremely large canvas sizes

    const maxDimension = 10000;

    if (
        newWidth > maxDimension ||
        newHeight > maxDimension
    ) {

        showError(
            "Maximum image dimension is 10,000 × 10,000 pixels."
        );

        return;

    }


    resizeBtn.disabled =
        true;

    resizeBtn.textContent =
        "🖼️ Resizing...";


    downloadBtn.disabled =
        true;


    statusMessage.textContent =
        "Resizing image...";

    statusMessage.style.color =
        "#2563eb";


    const image =
        new Image();


    const imageURL =
        URL.createObjectURL(selectedFile);


    image.onload = function () {

        try {

            // Set canvas size

            resizeCanvas.width =
                newWidth;

            resizeCanvas.height =
                newHeight;


            const context =
                resizeCanvas.getContext("2d");


            if (!context) {

                throw new Error(
                    "Canvas is not supported."
                );

            }


            // Clear canvas

            context.clearRect(
                0,
                0,
                newWidth,
                newHeight
            );


            // Draw resized image

            context.drawImage(
                image,
                0,
                0,
                newWidth,
                newHeight
            );


            // Keep original supported format

            let outputType =
                selectedFile.type;


            if (
                outputType !== "image/jpeg" &&
                outputType !== "image/png" &&
                outputType !== "image/webp"
            ) {

                outputType =
                    "image/png";

            }


            // Create resized image blob

            resizeCanvas.toBlob(
                function (blob) {

                    URL.revokeObjectURL(imageURL);


                    if (!blob) {

                        showError(
                            "Unable to resize image."
                        );

                        resetResizeButton();

                        return;

                    }


                    resizedBlob =
                        blob;


                    // Show resized file size

                    resizedFileSize.textContent =
                        formatFileSize(blob.size);


                    // Clean old result URL

                    if (resultObjectURL) {

                        URL.revokeObjectURL(
                            resultObjectURL
                        );

                    }


                    // Create new result URL

                    resultObjectURL =
                        URL.createObjectURL(blob);


                    resultImage.src =
                        resultObjectURL;


                    newDimensions.textContent =
                        newWidth +
                        " × " +
                        newHeight +
                        " px";


                    resultBox.style.display =
                        "block";


                    downloadBtn.disabled =
                        false;


                    statusMessage.textContent =
                        "✓ Image resized successfully.";

                    statusMessage.style.color =
                        "#16a34a";


                    resetResizeButton();

                },
                outputType,
                0.92
            );

        } catch (error) {

            console.error(
                "Resize Error:",
                error
            );


            URL.revokeObjectURL(imageURL);


            showError(
                "Unable to resize image."
            );


            resetResizeButton();

        }

    };


    image.onerror = function () {

        URL.revokeObjectURL(imageURL);


        showError(
            "Unable to process image."
        );


        resetResizeButton();

    };


    image.src =
        imageURL;

});


// ==========================================
// Download Image
// ==========================================

downloadBtn.addEventListener("click", function () {

    if (!resizedBlob) {
        return;
    }


    const url =
        URL.createObjectURL(resizedBlob);


    const link =
        document.createElement("a");


    link.href =
        url;


    // Correct file extension

    let extension = "png";


    if (resizedBlob.type === "image/jpeg") {
        extension = "jpg";
    }

    else if (resizedBlob.type === "image/webp") {
        extension = "webp";
    }


    link.download =
        "resized-image." + extension;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    setTimeout(function () {

        URL.revokeObjectURL(url);

    }, 100);

});


// ==========================================
// Reset Tool
// ==========================================

resetBtn.addEventListener("click", function () {

    imageInput.value = "";

    selectedFile = null;

    originalWidth = 0;
    originalHeight = 0;

    resizedBlob = null;


    // Clean object URLs

    if (previewObjectURL) {

        URL.revokeObjectURL(
            previewObjectURL
        );

        previewObjectURL = null;

    }


    if (resultObjectURL) {

        URL.revokeObjectURL(
            resultObjectURL
        );

        resultObjectURL = null;

    }


    // Clear images

    previewImage.src = "";

    resultImage.src = "";


    // Hide sections

    previewBox.style.display =
        "none";

    resultBox.style.display =
        "none";


    // Reset information

    previewDimensions.textContent =
        "—";

    previewFileSize.textContent =
        "—";

    newDimensions.textContent =
        "—";

    resizedFileSize.textContent =
        "—";


    // Reset inputs

    widthInput.value = "";

    heightInput.value = "";


    // Reset buttons

    resizeBtn.disabled =
        true;

    downloadBtn.disabled =
        true;

    resizeBtn.textContent =
        "🖼️ Resize Image";


    // Clear status

    statusMessage.textContent =
        "";

    statusMessage.style.color =
        "";


    // Clear canvas

    resizeCanvas.width = 0;

    resizeCanvas.height = 0;


    imageInput.focus();

});


// ==========================================
// Clear Previous Result
// ==========================================

function clearResult() {

    resizedBlob = null;


    if (resultObjectURL) {

        URL.revokeObjectURL(
            resultObjectURL
        );

        resultObjectURL = null;

    }


    resultImage.src = "";

    resultBox.style.display =
        "none";

    downloadBtn.disabled =
        true;

    newDimensions.textContent =
        "—";

    resizedFileSize.textContent =
        "—";

}


// ==========================================
// Reset Resize Button
// ==========================================

function resetResizeButton() {

    resizeBtn.disabled =
        false;

    resizeBtn.textContent =
        "🖼️ Resize Image";

}


// ==========================================
// Error Message
// ==========================================

function showError(message) {

    statusMessage.textContent =
        message;

    statusMessage.style.color =
        "#dc2626";

}


// ==========================================
// Format File Size
// ==========================================

function formatFileSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    safeIndex
                )
            ).toFixed(2)
        ) +
        " " +
        units[safeIndex]
    );

}

