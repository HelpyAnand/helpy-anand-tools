// ==========================================
// IMAGE RESIZER
// Helpy Anand Tools
// ==========================================


// ==========================================
// Elements
// ==========================================

const imageInput =
    document.getElementById("imageInput");

const dropArea =
    document.getElementById("dropArea");

const previewBox =
    document.getElementById("previewBox");

const previewImage =
    document.getElementById("previewImage");


const previewDimensions =
    document.getElementById("previewDimensions");

const previewFileSize =
    document.getElementById("previewFileSize");

const widthInput =
    document.getElementById("width");

const heightInput =
    document.getElementById("height");

const aspectRatio =
    document.getElementById("aspectRatio");

const resizeBtn =
    document.getElementById("resizeBtn");

const downloadBtn =
    document.getElementById("downloadBtn");

const resetBtn =
    document.getElementById("resetBtn");

const statusMessage =
    document.getElementById("statusMessage");

const resultBox =
    document.getElementById("resultBox");

const resultImage =
    document.getElementById("resultImage");

const newDimensions =
    document.getElementById("newDimensions");

const resizedFileSize =
    document.getElementById("resizedFileSize");

const resizeCanvas =
    document.getElementById("resizeCanvas");


// ==========================================
// Variables
// ==========================================

let selectedFile = null;

let originalWidth = 0;

let originalHeight = 0;

let resizedBlob = null;


// ==========================================
// File Selection
// ==========================================

imageInput.addEventListener(
    "change",
    function () {

        const file = imageInput.files[0];

        if (file) {

            loadImage(file);

        }

    }
);


// ==========================================
// Drag & Drop
// ==========================================

dropArea.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropArea.classList.add("dragover");

    }
);


dropArea.addEventListener(
    "dragleave",
    function () {

        dropArea.classList.remove("dragover");

    }
);


dropArea.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropArea.classList.remove("dragover");

        const file =
            event.dataTransfer.files[0];

        if (file) {

            loadImage(file);

        }

    }
);


// ==========================================
// Load Image
// ==========================================

function loadImage(file) {

    // Check file type

    if (!file.type.startsWith("image/")) {

        showError(
            "Please select a valid image file."
        );

        return;

    }


    // Supported formats

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


    selectedFile = file;


    // File size

   
    // Create image

    const image =
        new Image();


    image.onload = function () {

        originalWidth =
            image.naturalWidth;

        originalHeight =
            image.naturalHeight;


        // Show dimensions

                previewDimensions.textContent =
            originalWidth +
            " × " +
            originalHeight +
            " px";

        previewFileSize.textContent =
        formatFileSize(file.size);


        // Set inputs

        widthInput.value =
            originalWidth;

        heightInput.value =
            originalHeight;


        // Preview

        previewImage.src =
            image.src;

        previewBox.style.display =
            "block";


        // Enable resize

        resizeBtn.disabled =
            false;


        // Reset old result

        resultBox.style.display =
            "none";

        resultImage.src =
            "";

        downloadBtn.disabled =
            true;

        resizedBlob =
            null;


        statusMessage.textContent =
            "Image loaded successfully.";

        statusMessage.style.color =
            "#16a34a";

    };


    image.onerror = function () {

        showError(
            "Unable to load this image."
        );

    };


    image.src =
        URL.createObjectURL(file);

}


// ==========================================
// Maintain Aspect Ratio
// ==========================================

widthInput.addEventListener(
    "input",
    function () {

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
            parseInt(widthInput.value);


        if (!width || width <= 0) {

            return;

        }


        const ratio =
            originalHeight /
            originalWidth;


        heightInput.value =
            Math.round(
                width * ratio
            );

    }
);


heightInput.addEventListener(
    "input",
    function () {

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
            parseInt(heightInput.value);


        if (!height || height <= 0) {

            return;

        }


        const ratio =
            originalWidth /
            originalHeight;


        widthInput.value =
            Math.round(
                height * ratio
            );

    }
);


// ==========================================
// Resize Image
// ==========================================

resizeBtn.addEventListener(
    "click",
    function () {

        if (!selectedFile) {

            showError(
                "Please select an image first."
            );

            return;

        }


        const newWidth =
            parseInt(widthInput.value);

        const newHeight =
            parseInt(heightInput.value);


        // Validate dimensions

        if (
            !newWidth ||
            !newHeight ||
            newWidth <= 0 ||
            newHeight <= 0
        ) {

            showError(
                "Please enter valid width and height."
            );

            return;

        }


        resizeBtn.disabled =
            true;

        resizeBtn.textContent =
            "🖼️ Resizing...";


        statusMessage.textContent =
            "Resizing image...";

        statusMessage.style.color =
            "#2563eb";


        const image =
            new Image();


        image.onload = function () {

            try {

                resizeCanvas.width =
                    newWidth;

                resizeCanvas.height =
                    newHeight;


                const context =
                    resizeCanvas.getContext(
                        "2d"
                    );


                context.clearRect(
                    0,
                    0,
                    newWidth,
                    newHeight
                );


                context.drawImage(
                    image,
                    0,
                    0,
                    newWidth,
                    newHeight
                );


                // Keep original format

                let outputType =
                    selectedFile.type;


                if (
                    outputType !==
                        "image/jpeg" &&
                    outputType !==
                        "image/png" &&
                    outputType !==
                        "image/webp"
                ) {

                    outputType =
                        "image/png";

                }


                resizeCanvas.toBlob(
                    function (blob) {

                        if (!blob) {

                            throw new Error(
                                "Unable to resize image."
                            );

                        }


                        resizedBlob =
                            blob;

                        resizedFileSize.textContent =
                                formatFileSize(blob.size);


                        const imageURL =
                            URL.createObjectURL(
                                blob
                            );


                        resultImage.src =
                            imageURL;


                        newDimensions.textContent =
                            newWidth +
                            " × " +
                            newHeight;


                        resultBox.style.display =
                            "block";


                        downloadBtn.disabled =
                            false;


                        statusMessage.textContent =
                            "✓ Image resized successfully.";

                        statusMessage.style.color =
                            "#16a34a";


                        resizeBtn.disabled =
                            false;

                        resizeBtn.textContent =
                            "🖼️ Resize Image";


                    },
                    outputType,
                    0.92
                );


            } catch (error) {

                console.error(
                    "Resize Error:",
                    error
                );


                showError(
                    "Unable to resize image."
                );


                resizeBtn.disabled =
                    false;

                resizeBtn.textContent =
                    "🖼️ Resize Image";

            }

        };


        image.onerror = function () {

            showError(
                "Unable to process image."
            );


            resizeBtn.disabled =
                false;

            resizeBtn.textContent =
                "🖼️ Resize Image";

        };


        image.src =
            URL.createObjectURL(
                selectedFile
            );

    }
);


// ==========================================
// Download Image
// ==========================================

downloadBtn.addEventListener(
    "click",
    function () {

        if (!resizedBlob) {

            return;

        }


        const url =
            URL.createObjectURL(
                resizedBlob
            );


        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            "resized-image";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            url
        );

    }
);


// ==========================================
// Reset Tool
// ==========================================

resetBtn.addEventListener(
    "click",
    function () {

        imageInput.value =
            "";

        selectedFile =
            null;

        originalWidth =
            0;

        originalHeight =
            0;

        resizedBlob =
            null;


        previewImage.src =
            "";

        resultImage.src =
            "";


        previewBox.style.display =
            "none";

        resultBox.style.display =
            "none";
               
        previewDimensions.textContent =
            "—";

        previewFileSize.textContent =
            "—";

        newDimensions.textContent =
            "—";
        resizedFileSize.textContent =
            "—";

        widthInput.value =
            "";

        heightInput.value =
            "";


        resizeBtn.disabled =
            true;

        downloadBtn.disabled =
            true;


        resizeBtn.textContent =
            "🖼️ Resize Image";


        statusMessage.textContent =
            "";

        statusMessage.style.color =
            "";


        resizeCanvas.width =
            0;

        resizeCanvas.height =
            0;


        imageInput.focus();

    }
);


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


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}