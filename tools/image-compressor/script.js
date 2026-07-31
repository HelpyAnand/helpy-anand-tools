let selectedFile = null;
let compressedBlob = null;

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const placeholder = document.getElementById("placeholder");
const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const savedPercent = document.getElementById("savedPercent");

const downloadBtn = document.getElementById("downloadBtn");
const statusMessage = document.getElementById("statusMessage");

quality.addEventListener("input", () => {
    qualityValue.textContent = quality.value + "%";

   });

imageInput.addEventListener("change", function () {

    
    const file = this.files[0];

    if (!file) return;

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = function (e) {

        previewImage.src = e.target.result;
        previewImage.style.display = "block";
        placeholder.style.display = "none";

    };

    reader.readAsDataURL(file);

    originalSize.textContent =
        (file.size / 1024).toFixed(2) + " KB";

    compressedSize.textContent = "0 KB";
    savedPercent.textContent = "0%";

    statusMessage.textContent = "";
    downloadBtn.disabled = true;

    if (!file.type.startsWith("image/")) {
    alert("Please select a valid image. jpg, ");
    return;
}
});
const dropArea = document.getElementById("dropArea");

dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
});

dropArea.addEventListener("drop", (e) => {

    e.preventDefault();

    dropArea.classList.remove("dragover");

    const file = e.dataTransfer.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
    }

    selectedFile = file;

    const reader = new FileReader();

    reader.onload = function(event){

        previewImage.src = event.target.result;
        previewImage.style.display = "block";
        placeholder.style.display = "none";

    };

    reader.readAsDataURL(file);

    originalSize.textContent =
        (file.size / 1024).toFixed(2) + " KB";

    compressedSize.textContent = "0 KB";
    savedPercent.textContent = "0%";

    statusMessage.textContent = "";
    downloadBtn.disabled = true;

});
function compressImage() {

    if (!selectedFile) {
        alert("Please select an image first.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {

        const img = new Image();

        img.onload = function () {

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const qualityValue = quality.value / 100;

            canvas.toBlob(function(blob){

                compressedBlob = blob;

                compressedSize.textContent =
                    (blob.size / 1024).toFixed(2) + " KB";

                const saved =
                    ((selectedFile.size - blob.size) / selectedFile.size) * 100;

                savedPercent.textContent =
                    saved.toFixed(1) + "%";

                downloadBtn.disabled = false;

                statusMessage.textContent =
                    "✅ Image compressed successfully.";

            }, "image/jpeg", qualityValue);

        };

        img.src = event.target.result;

    };

    reader.readAsDataURL(selectedFile);

}
function downloadImage() {

    if (!compressedBlob) {
        alert("Please compress the image first.");
        return;
    }

    const link = document.createElement("a");

    link.href = URL.createObjectURL(compressedBlob);

    link.download = "compressed-image.jpg";

    link.click();

    URL.revokeObjectURL(link.href);

}
function resetTool() {

    selectedFile = null;
    compressedBlob = null;

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

    downloadBtn.disabled = true;

}