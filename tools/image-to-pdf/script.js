
// ==========================================
// Image to PDF Converter
// Step 1 - Image Preview
// ==========================================
console.log("Script Loaded");
const resetBtn = document.getElementById("resetBtn");
const previewContainer = document.getElementById("previewContainer");
const statusMessage = document.getElementById("statusMessage");
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");

console.log(dropArea);
console.log(imageInput);

dropArea.addEventListener("click", function () {
    console.log("Drop Area Clicked");
    imageInput.click();
});

let selectedImages = [];

imageInput.addEventListener("change", function () {

    previewContainer.innerHTML = "";
    selectedImages = [];

    const files = Array.from(this.files);

    if (files.length === 0) {
        statusMessage.textContent = "No images selected.";
        return;
    }

    statusMessage.textContent = files.length + " image(s) selected.";

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        selectedImages.push(file);

        const reader = new FileReader();

        reader.onload = function(e){

            const wrapper = document.createElement("div");
wrapper.className = "preview-item";

const img = document.createElement("img");
img.src = e.target.result;

const removeBtn = document.createElement("button");
removeBtn.innerHTML = "❌";
removeBtn.className = "remove-btn";

removeBtn.onclick = function () {

    selectedImages = selectedImages.filter(f => f !== file);

    wrapper.remove();

    statusMessage.textContent =
        selectedImages.length + " image(s) selected.";

};

wrapper.appendChild(img);
wrapper.appendChild(removeBtn);

previewContainer.appendChild(wrapper);

        };

        reader.readAsDataURL(file);

    });

});



const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");

let pdfBlob = null;

convertBtn.addEventListener("click", async function () {

    if (selectedImages.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < selectedImages.length; i++) {

        const file = selectedImages[i];

        const imageData = await fileToDataURL(file);

        const img = new Image();

        await new Promise(resolve => {

            img.onload = resolve;

            img.src = imageData;

        });

        if (i > 0) pdf.addPage();

        pdf.addImage(
            img,
            "JPEG",
            10,
            10,
            190,
            270
        );

    }

    pdfBlob = pdf.output("blob");

    downloadBtn.disabled = false;

    statusMessage.textContent = "PDF Created Successfully.";

});



function fileToDataURL(file){

    return new Promise(resolve=>{

        const reader = new FileReader();

        reader.onload = e=>resolve(e.target.result);

        reader.readAsDataURL(file);

    });

}



// ==========================================
// Download PDF
// ==========================================

downloadBtn.addEventListener("click", function () {

    if (!pdfBlob) return;

    const link = document.createElement("a");

    link.href = URL.createObjectURL(pdfBlob);

    link.download = "Helpy-Anand-Images.pdf";

    link.click();

    URL.revokeObjectURL(link.href);

});



// ==========================================
// Reset Tool
// ==========================================

resetBtn.addEventListener("click", function(){

    imageInput.value = "";

    previewContainer.innerHTML = "";

    selectedImages = [];

    pdfBlob = null;

    downloadBtn.disabled = true;

    statusMessage.textContent = "Tool Reset Successfully.";

});



// ================================
// Drag & Drop
// ================================

dropArea.addEventListener("dragover",function(e){

    e.preventDefault();

    dropArea.classList.add("dragover");

});

dropArea.addEventListener("dragleave",function(){

    dropArea.classList.remove("dragover");

});

dropArea.addEventListener("drop",function(e){

    e.preventDefault();

    dropArea.classList.remove("dragover");

    const files = Array.from(e.dataTransfer.files);

    imageInput.files = e.dataTransfer.files;

    imageInput.dispatchEvent(new Event("change"));

});








