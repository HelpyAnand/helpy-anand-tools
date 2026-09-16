
// ==========================================
// IMAGE CONVERTER
// ==========================================

const fileInfo = document.getElementById("fileInfo");
const imageInput = document.getElementById("imageInput");
const outputFormat = document.getElementById("outputFormat");
const convertButton = document.getElementById("convertButton");
const imageQuality = document.getElementById("imageQuality");
const qualityValue = document.getElementById("qualityValue");
const resultInfo = document.getElementById("resultInfo");
const resetButton = document.getElementById("resetButton");
const dropArea = document.getElementById("dropArea");

let selectedFile = null;


// ==========================================
// QUALITY SLIDER
// ==========================================

imageQuality.addEventListener("input", function () {

    qualityValue.innerText =
        imageQuality.value + "%";

});


// ==========================================
// IMAGE PREVIEW
// ==========================================

function showPreview(file) {

    const oldPreview =
        document.getElementById("imagePreview");

    if (oldPreview) {
        oldPreview.remove();
    }

    const imageURL =
        URL.createObjectURL(file);

    const preview =
        document.createElement("img");

    preview.id = "imagePreview";
    preview.src = imageURL;
    preview.alt = "Selected image preview";

    preview.style.maxWidth = "100%";
    preview.style.maxHeight = "400px";
    preview.style.marginTop = "25px";
    preview.style.borderRadius = "8px";

    dropArea.appendChild(preview);

}


// ==========================================
// FILE INFORMATION
// ==========================================

function showFileInfo(file) {

    fileInfo.innerText =
        "File: " +
        file.name +
        " | Size: " +
        (file.size / 1024).toFixed(2) +
        " KB";

}


// ==========================================
// IMAGE SELECTION
// ==========================================

imageInput.addEventListener("change", function () {

    const file =
        imageInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        imageInput.value = "";
        selectedFile = null;

        return;
    }

    selectedFile = file;

    showFileInfo(file);
    showPreview(file);

});


// ==========================================
// DRAG & DROP
// ==========================================

dropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropArea.classList.add("drag-over");

});


dropArea.addEventListener("dragleave", function () {

    dropArea.classList.remove("drag-over");

});


dropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    dropArea.classList.remove("drag-over");

    const file =
        event.dataTransfer.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;
    }

    selectedFile = file;


    // Update file input
    const dataTransfer =
        new DataTransfer();

    dataTransfer.items.add(file);

    imageInput.files =
        dataTransfer.files;


    showFileInfo(file);
    showPreview(file);

});


// ==========================================
// IMAGE CONVERSION
// ==========================================

convertButton.addEventListener("click", function () {

    if (!selectedFile) {

        alert("Please select an image first.");

        return;
    }


    convertButton.disabled = true;
    convertButton.innerText = "Converting...";


    const imageURL =
        URL.createObjectURL(selectedFile);

    const image =
        new Image();


    image.onload = function () {

        const canvas =
            document.createElement("canvas");

        canvas.width =
            image.width;

        canvas.height =
            image.height;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            image,
            0,
            0,
            image.width,
            image.height
        );


        let mimeType =
            "image/webp";

        let extension =
            "webp";


        if (outputFormat.value === "jpeg") {

            mimeType =
                "image/jpeg";

            extension =
                "jpg";

        } else if (outputFormat.value === "png") {

            mimeType =
                "image/png";

            extension =
                "png";
        }


        canvas.toBlob(function (blob) {

            if (!blob) {

                alert(
                    "Image conversion failed."
                );

                convertButton.disabled = false;
                convertButton.innerText =
                    "Convert Image";

                return;
            }


            // Show result information
            resultInfo.innerText =
                "Converted Size: " +
                (blob.size / 1024).toFixed(2) +
                " KB | Format: " +
                extension.toUpperCase();


            // Create download URL
            const downloadURL =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");

            link.href =
                downloadURL;


            const originalName =
                selectedFile.name
                    .replace(/\.[^/.]+$/, "");


            link.download =
                originalName +
                "-converted." +
                extension;


            link.click();


            URL.revokeObjectURL(downloadURL);


            convertButton.disabled = false;

            convertButton.innerText =
                "Convert Image";


        }, mimeType, imageQuality.value / 100);


        URL.revokeObjectURL(imageURL);

    };


    image.onerror = function () {

        alert(
            "Could not load the selected image."
        );

        convertButton.disabled = false;

        convertButton.innerText =
            "Convert Image";

        URL.revokeObjectURL(imageURL);

    };


    image.src =
        imageURL;

});


// ==========================================
// RESET
// ==========================================

resetButton.addEventListener("click", function () {

    imageInput.value = "";

    selectedFile = null;


    const oldPreview =
        document.getElementById("imagePreview");


    if (oldPreview) {
        oldPreview.remove();
    }


    fileInfo.innerText = "";

    resultInfo.innerText = "";


    imageQuality.value = 90;

    qualityValue.innerText =
        "90%";


    outputFormat.value =
        "webp";


    convertButton.disabled =
        false;

    convertButton.innerText =
        "Convert Image";


});

