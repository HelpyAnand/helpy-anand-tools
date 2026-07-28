let imageInput = document.getElementById("imageInput");
let previewImage = document.getElementById("previewImage");
let quality = document.getElementById("quality");
let qualityValue = document.getElementById("qualityValue");
let downloadBtn = document.getElementById("downloadBtn");
let statusMessage = document.getElementById("statusMessage");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");
const dropArea = document.getElementById("dropArea");

let compressedData = "";
let originalFileName = "";

quality.oninput = function () {
    qualityValue.innerHTML = quality.value + "%";
};

imageInput.onchange = function () {

     statusMessage.textContent = "";
    let file = imageInput.files[0];
    originalFileName = file.name;
    originalSize.textContent =
(file.size / 1024).toFixed(1) + " KB";

    if (!file) return;
    downloadBtn.disabled = true;

compressedSize.textContent = "0 KB";
savedPercent.textContent = "0%";
compressedData = "";

    let reader = new FileReader();

    reader.onload = function (e) {

        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        document.getElementById("placeholder").style.display = "none";

    };

    reader.readAsDataURL(file);
   

};

function compressImage() {

    let file = imageInput.files[0];

    if (!file) {
        alert("Please choose an image first.");
        return;
    }

    let reader = new FileReader();

    reader.onload = function (e) {

        let img = new Image();

        img.onload = function () {

            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            compressedData = canvas.toDataURL(
                "image/jpeg",
                quality.value / 100
            );

            previewImage.src = compressedData;
            downloadBtn.disabled = false;

            // Compressed Size
let compressedKB =
(compressedData.length * 3 / 4) / 1024;

compressedSize.textContent =
compressedKB.toFixed(1) + " KB";

// Space Saved
let originalKB =
file.size / 1024;

let saved =
((originalKB - compressedKB) / originalKB) * 100;

savedPercent.textContent =
saved.toFixed(1) + "%";

        };

        img.src = e.target.result;

    };

    reader.readAsDataURL(file);

}

function downloadImage() {

    if (compressedData == "") {
        alert("Compress image first.");
        return;
    }

    let link = document.createElement("a");

    link.href = compressedData;
    let fileName = originalFileName.replace(/\.[^/.]+$/, "");

link.download = fileName + "-compressed.jpg";

    link.click();

}
// Drag & Drop

dropArea.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", function () {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", function (e) {
    e.preventDefault();

    dropArea.classList.remove("dragover");

    let files = e.dataTransfer.files;

    if (files.length > 0) {

        imageInput.files = files;

        imageInput.dispatchEvent(new Event("change"));

    }
});
function resetTool() {

    imageInput.value = "";

    previewImage.src = "";
    previewImage.style.display = "none";

    document.getElementById("placeholder").style.display = "block";

    originalSize.textContent = "0 KB";
    compressedSize.textContent = "0 KB";
    savedPercent.textContent = "0%";

    quality.value = 80;
    qualityValue.textContent = "80%";

    compressedData = "";

    downloadBtn.disabled = true;

    statusMessage.textContent = "";

}