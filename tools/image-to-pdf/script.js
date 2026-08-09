
// ==========================================
// Image to PDF Converter
// Step 1 - Image Preview
// ==========================================
console.log("Script Loaded");
const resetBtn = document.getElementById("resetBtn");
const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const previewContainer = document.getElementById("previewContainer");
const statusMessage = document.getElementById("statusMessage");
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");
console.log("dropArea =", dropArea);
console.log("imageInput =", imageInput);

//console.log(dropArea);
//console.log(imageInput);

dropArea.addEventListener("click", function () {
    console.log("Drop Area Clicked");
    imageInput.click();
});

let selectedImages = [];


// ==========================================
// Update PDF Preview Text
// ==========================================

function updatePDFPreviewText() {

    const previewInfo =
        document.getElementById("pdfPreviewInfo");

    if (!previewInfo) return;

    const sizeText =
        pageSize.value === "a4"
            ? "A4"
            : "Letter";

    const orientationText =
        orientation.value === "p"
            ? "Portrait"
            : "Landscape";

    previewInfo.textContent =
        "Preview: " +
        sizeText +
        " " +
        orientationText;
}


// ==========================================
// PDF Preview
// Same Page Ratio + Same Image Fit as PDF
// ==========================================

function getPDFDimensions() {

    const selectedPageSize = pageSize.value;
    const selectedOrientation = orientation.value;

    let width;
    let height;

    // PDF dimensions in mm
    if (selectedPageSize === "a4") {

        width = 210;
        height = 297;

    } else {

        // Letter
        width = 215.9;
        height = 279.4;
    }

    // Landscape
    if (selectedOrientation === "l") {

        [width, height] = [height, width];

    }

    return {
        width,
        height
    };
}


function updatePDFPreview() {

    const dimensions = getPDFDimensions();

    const pageWidth = dimensions.width;
    const pageHeight = dimensions.height;

    const margin = 10;

    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    const previewItems =
        previewContainer.querySelectorAll(".preview-item");


    previewItems.forEach(item => {

        const img = item.querySelector("img");

        if (!img) return;


        // ------------------------------------------
        // PDF page ratio
        // ------------------------------------------

        item.style.aspectRatio =
            pageWidth + " / " + pageHeight;


        // ------------------------------------------
        // Image fit
        // Same calculation as final PDF
        // ------------------------------------------

        if (img.naturalWidth && img.naturalHeight) {

            const scale = Math.min(
                maxWidth / img.naturalWidth,
                maxHeight / img.naturalHeight
            );

            const imgWidth =
                img.naturalWidth * scale;

            const imgHeight =
                img.naturalHeight * scale;


            // Convert PDF mm ratio to percentage
            const widthPercent =
                (imgWidth / pageWidth) * 100;

            const heightPercent =
                (imgHeight / pageHeight) * 100;


            img.style.width =
                widthPercent + "%";

            img.style.height =
                heightPercent + "%";

            img.style.maxWidth = "none";
            img.style.maxHeight = "none";

            img.style.objectFit = "contain";

        }

    });


    // ------------------------------------------
    // Preview information
    // ------------------------------------------

    const previewInfo =
        document.getElementById("pdfPreviewInfo");
        console.log("Preview Info Element:", previewInfo);

    if (previewInfo) {

        const sizeText =
            selectedPageSize === "a4"
                ? "A4"
                : "Letter";

        const orientationText =
            selectedOrientation === "p"
                ? "Portrait"
                : "Landscape";

        previewInfo.textContent =
            "Preview: " +
            sizeText +
            " " +
            orientationText;
    }
}


pageSize.addEventListener("change", function () {

    console.log("Page Size Changed:", pageSize.value);

    updatePDFPreviewText();
    updatePDFPreview();

});


orientation.addEventListener("change", function () {

    console.log("Orientation Changed:", orientation.value);

    updatePDFPreviewText();
    updatePDFPreview();

});

imageInput.addEventListener("change", function () {

    const files = Array.from(this.files);

    if (files.length === 0) {
        statusMessage.textContent = "No images selected.";
        return;
    }

    statusMessage.textContent = selectedImages.length + " image(s) selected.";

    files.forEach(file => {

        if (!file.type.startsWith("image/")) return;

        selectedImages.push(file);

        const reader = new FileReader();

       reader.onload = function(e){

    const wrapper = document.createElement("div");

    wrapper.className = "preview-item";

    wrapper._file = file;


    const img = document.createElement("img");

    img.src = e.target.result;


    const removeBtn = document.createElement("button");

    removeBtn.innerHTML = "❌";

    removeBtn.className = "remove-btn";


    removeBtn.onclick = function () {

        selectedImages =
            selectedImages.filter(f => f !== file);

        wrapper.remove();

        statusMessage.textContent =
            selectedImages.length +
            " image(s) selected.";

    };

statusMessage.textContent =
    selectedImages.length + " image(s) selected.";

    wrapper.appendChild(img);

    wrapper.appendChild(removeBtn);

    previewContainer.appendChild(wrapper);


    img.onload = function () {

        updatePDFPreview();

    };

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

const selectedPageSize = pageSize.value;
const selectedOrientation = orientation.value;

const pdf = new jsPDF(
    selectedOrientation,
    "mm",
    selectedPageSize
);


    for (let i = 0; i < selectedImages.length; i++) {

        const file = selectedImages[i];

        const imageData = await fileToDataURL(file);

        const img = new Image();

        await new Promise(resolve => {

            img.onload = resolve;

            img.src = imageData;

        });

        if (i > 0) pdf.addPage();
// ==========================================
// Image Fit - Step 1
// Keep aspect ratio and fit inside PDF page
// ==========================================

const pageWidth = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();

const margin = 10;

const maxWidth = pageWidth - (margin * 2);
const maxHeight = pageHeight - (margin * 2);

let imgWidth = img.width;
let imgHeight = img.height;

const scale = Math.min(
    maxWidth / imgWidth,
    maxHeight / imgHeight
);

imgWidth = imgWidth * scale;
imgHeight = imgHeight * scale;

const x = (pageWidth - imgWidth) / 2;
const y = (pageHeight - imgHeight) / 2;

pdf.addImage(
    img,
    "JPEG",
    x,
    y,
    imgWidth,
    imgHeight
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

// ==========================================
// Image Reordering
// Step 2
// ==========================================

let draggedItem = null;

previewContainer.addEventListener("dragstart", function (e) {

    const item = e.target.closest(".preview-item");

    if (!item) return;

    draggedItem = item;

    item.classList.add("dragging");

});

previewContainer.addEventListener("dragend", function () {

    if (!draggedItem) return;

    draggedItem.classList.remove("dragging");

    // Update selectedImages according to visual order
    selectedImages = [
        ...previewContainer.querySelectorAll(".preview-item")
    ].map(item => item._file);

    draggedItem = null;

    statusMessage.textContent =
        selectedImages.length + " image(s) selected.";

});

previewContainer.addEventListener("dragover", function (e) {

    e.preventDefault();

    if (!draggedItem) return;

    const afterElement = getDragAfterElement(
        previewContainer,
        e.clientX
    );

    if (afterElement === null) {

        previewContainer.appendChild(draggedItem);

    } else {

        previewContainer.insertBefore(
            draggedItem,
            afterElement
        );

    }

});

function getDragAfterElement(container, x) {

    const items = [
        ...container.querySelectorAll(
            ".preview-item:not(.dragging)"
        )
    ];

    return items.reduce(
        (closest, item) => {

            const box = item.getBoundingClientRect();

            const offset =
                x - box.left - box.width / 2;

            if (
                offset < 0 &&
                offset > closest.offset
            ) {

                return {
                    offset: offset,
                    element: item
                };

            }

            return closest;

        },
        {
            offset: Number.NEGATIVE_INFINITY
        }
    ).element;

}










