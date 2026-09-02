let selectedFile = null;
let compressedBlob = null;
let previewObjectURL = null;
let compressedObjectURL = null;

const imageInput = document.getElementById("imageInput");
const dropArea = document.getElementById("dropArea");
const previewImage = document.getElementById("previewImage");
const placeholder = document.getElementById("placeholder");

const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");

const downloadBtn = document.getElementById("downloadBtn");
const statusMessage = document.getElementById("statusMessage");


// =========================================================
// QUALITY SLIDER
// =========================================================

quality.addEventListener("input", function () {

    qualityValue.textContent = this.value + "%";

});


// =========================================================
// FILE VALIDATION
// =========================================================

function isSupportedImage(file) {

    if (!file) {
        return false;
    }

    const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    return supportedTypes.includes(file.type);
}


// =========================================================
// FILE SIZE FORMAT
// =========================================================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}


// =========================================================
// STATUS MESSAGE
// =========================================================

function showStatus(message, type = "success") {

    statusMessage.textContent = message;

    if (type === "error") {
        statusMessage.style.color = "#dc2626";
    } else {
        statusMessage.style.color = "#16a34a";
    }

}


// =========================================================
// DISPLAY SELECTED IMAGE
// =========================================================

function displayImage(file) {

    if (!isSupportedImage(file)) {

        showStatus(
            "Please select a JPG, JPEG, PNG or WebP image.",
            "error"
        );

        return;
    }

    selectedFile = file;
    compressedBlob = null;

    downloadBtn.disabled = true;

    compressedSize.textContent = "0 KB";
    savedPercent.textContent = "0%";

    originalSize.textContent = formatFileSize(file.size);

    showStatus("");

    if (previewObjectURL) {
        URL.revokeObjectURL(previewObjectURL);
    }

    previewObjectURL = URL.createObjectURL(file);

    previewImage.src = previewObjectURL;
    previewImage.style.display = "block";

    placeholder.style.display = "none";
}


// =========================================================
// FILE INPUT
// =========================================================

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    displayImage(file);

});


// =========================================================
// DRAG & DROP
// =========================================================

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

    if (!file) {
        return;
    }

    displayImage(file);

});


// =========================================================
// COMPRESS IMAGE
// =========================================================

function compressImage() {

    if (!selectedFile) {

        showStatus(
            "Please select an image first.",
            "error"
        );

        return;
    }


    showStatus("Compressing image...", "success");

    downloadBtn.disabled = true;


    const reader = new FileReader();


    reader.onload = function (event) {

        const img = new Image();


        img.onload = function () {

            const canvas = document.createElement("canvas");

            const ctx = canvas.getContext("2d");


            if (!ctx) {

                showStatus(
                    "Your browser could not process this image.",
                    "error"
                );

                return;
            }


            canvas.width = img.width;
            canvas.height = img.height;


            /*
             * Preserve transparency for PNG.
             * JPEG does not support transparency.
             */

            if (selectedFile.type === "image/jpeg") {

                ctx.fillStyle = "#ffffff";

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }


            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );


            const selectedQuality =
                Number(quality.value) / 100;


            let outputType = selectedFile.type;


            /*
             * Use JPEG for JPEG files,
             * WebP for WebP files,
             * PNG for PNG files.
             */

            if (
                outputType !== "image/jpeg" &&
                outputType !== "image/png" &&
                outputType !== "image/webp"
            ) {
                outputType = "image/jpeg";
            }


            canvas.toBlob(
                function (blob) {

                    if (!blob) {

                        showStatus(
                            "Image compression failed. Please try again.",
                            "error"
                        );

                        return;
                    }


                    compressedBlob = blob;


                    compressedSize.textContent =
                        formatFileSize(blob.size);


                    const saved =
                        (
                            (selectedFile.size - blob.size)
                            / selectedFile.size
                        ) * 100;


                    if (saved > 0) {

                        savedPercent.textContent =
                            saved.toFixed(1) + "%";

                        showStatus(
                            "✅ Image compressed successfully.",
                            "success"
                        );

                    } else {

                        savedPercent.textContent = "0%";

                        showStatus(
                            "Image could not be reduced further at this quality setting.",
                            "error"
                        );
                    }


                    downloadBtn.disabled = false;

                },
                outputType,
                selectedQuality
            );

        };


        img.onerror = function () {

            showStatus(
                "The selected image could not be processed.",
                "error"
            );

        };


        img.src = event.target.result;

    };


    reader.onerror = function () {

        showStatus(
            "Could not read the selected image.",
            "error"
        );

    };


    reader.readAsDataURL(selectedFile);
}


// =========================================================
// DOWNLOAD IMAGE
// =========================================================

function downloadImage() {

    if (!compressedBlob) {

        showStatus(
            "Please compress the image first.",
            "error"
        );

        return;
    }


    if (compressedObjectURL) {
        URL.revokeObjectURL(compressedObjectURL);
    }


    compressedObjectURL =
        URL.createObjectURL(compressedBlob);


    const link = document.createElement("a");

    link.href = compressedObjectURL;


    let extension = "jpg";


    if (compressedBlob.type === "image/png") {
        extension = "png";
    }

    if (compressedBlob.type === "image/webp") {
        extension = "webp";
    }


    link.download =
        "compressed-image." + extension;


    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(function () {

        if (compressedObjectURL) {

            URL.revokeObjectURL(compressedObjectURL);

            compressedObjectURL = null;
        }

    }, 1000);

}


// =========================================================
// RESET TOOL
// =========================================================

function resetTool() {

    selectedFile = null;
    compressedBlob = null;


    if (previewObjectURL) {

        URL.revokeObjectURL(previewObjectURL);

        previewObjectURL = null;
    }


    if (compressedObjectURL) {

        URL.revokeObjectURL(compressedObjectURL);

        compressedObjectURL = null;
    }


    imageInput.value = "";


    previewImage.src = "";
    previewImage.style.display = "none";

    placeholder.style.display = "block";


    quality.value = 80;
    qualityValue.textContent = "80%";


    originalSize.textContent = "0 KB";
    compressedSize.textContent = "0 KB";
    savedPercent.textContent = "0%";


    statusMessage.textContent = "";
    statusMessage.style.color = "#16a34a";


    downloadBtn.disabled = true;


    dropArea.classList.remove("dragover");

}