// ==========================================
// Image to PDF Converter
// Initialization & DOM Elements
// ==========================================
console.log("Script Loaded");

const resetBtn = document.getElementById("resetBtn");
const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const previewContainer = document.getElementById("previewContainer");
const statusMessage = document.getElementById("statusMessage");
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");

let selectedImages = [];
let pdfBlob = null;

// Click drop area to open file picker
dropArea.addEventListener("click", function () {
    imageInput.click();
});

// ==========================================
// PDF Dimensions & Preview Calculation
// ==========================================

function getPDFDimensions() {
    const selectedPageSize = pageSize.value;
    const selectedOrientation = orientation.value;

    let width = selectedPageSize === "a4" ? 210 : 215.9;
    let height = selectedPageSize === "a4" ? 297 : 279.4;

    if (selectedOrientation === "l") {
        [width, height] = [height, width];
    }

    return { width, height };
}

function updatePDFPreviewText() {
    const previewInfo = document.getElementById("pdfPreviewInfo");
    if (!previewInfo) return;

    const sizeText = pageSize.value === "a4" ? "A4" : "Letter";
    const orientationText = orientation.value === "p" ? "Portrait" : "Landscape";

    previewInfo.textContent = `Preview: ${sizeText} ${orientationText}`;
}

function updatePDFPreview() {
    const dimensions = getPDFDimensions();
    const pageWidth = dimensions.width;
    const pageHeight = dimensions.height;

    const margin = 10;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const previewItems = previewContainer.querySelectorAll(".preview-item");

    previewItems.forEach((item) => {
        const img = item.querySelector("img");
        if (!img) return;

        // Set PDF aspect ratio on preview card
        item.style.aspectRatio = `${pageWidth} / ${pageHeight}`;

        if (img.naturalWidth && img.naturalHeight) {
            const scale = Math.min(
                maxWidth / img.naturalWidth,
                maxHeight / img.naturalHeight
            );

            const imgWidth = img.naturalWidth * scale;
            const imgHeight = img.naturalHeight * scale;

            const widthPercent = (imgWidth / pageWidth) * 100;
            const heightPercent = (imgHeight / pageHeight) * 100;

            img.style.width = `${widthPercent}%`;
            img.style.height = `${heightPercent}%`;
            img.style.maxWidth = "none";
            img.style.maxHeight = "none";
            img.style.objectFit = "contain";
        }
    });

    updatePDFPreviewText();
}

pageSize.addEventListener("change", () => {
    updatePDFPreview();
});

orientation.addEventListener("change", () => {
    updatePDFPreview();
});

// ==========================================
// File Input Handling & Previews
// ==========================================

function handleFiles(files) {
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
        selectedImages.push(file);

        const reader = new FileReader();

        reader.onload = function (e) {
            const wrapper = document.createElement("div");
            wrapper.className = "preview-item";
            wrapper.draggable = true; // Enabled native dragging
            wrapper._file = file;

            const img = document.createElement("img");
            img.src = e.target.result;

            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = "✖";
            removeBtn.className = "remove-btn";

            removeBtn.onclick = function (event) {
                event.stopPropagation();
                selectedImages = selectedImages.filter((f) => f !== file);
                wrapper.remove();
                statusMessage.textContent = `${selectedImages.length} image(s) selected.`;
                updatePDFPreview();
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            previewContainer.appendChild(wrapper);

            img.onload = function () {
                updatePDFPreview();
            };
        };

        reader.readAsDataURL(file);
    });

    statusMessage.textContent = `${selectedImages.length} image(s) selected.`;
}

imageInput.addEventListener("change", function () {
    const files = Array.from(this.files);
    handleFiles(files);
});

// ==========================================
// Drag & Drop Upload Zone
// ==========================================

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

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

// ==========================================
// Image Reordering inside Preview Container
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

    // Sync selectedImages array with new DOM order
    selectedImages = [
        ...previewContainer.querySelectorAll(".preview-item"),
    ].map((item) => item._file);

    draggedItem = null;
    statusMessage.textContent = `${selectedImages.length} image(s) selected.`;
});

previewContainer.addEventListener("dragover", function (e) {
    e.preventDefault();
    if (!draggedItem) return;

    const afterElement = getDragAfterElement(previewContainer, e.clientX);

    if (afterElement === null) {
        previewContainer.appendChild(draggedItem);
    } else {
        previewContainer.insertBefore(draggedItem, afterElement);
    }
});

function getDragAfterElement(container, x) {
    const items = [
        ...container.querySelectorAll(".preview-item:not(.dragging)"),
    ];

    return items.reduce(
        (closest, item) => {
            const box = item.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: item };
            }
            return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

// ==========================================
// PDF Conversion & Download Logic
// ==========================================

function fileToDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

convertBtn.addEventListener("click", async function () {
    if (selectedImages.length === 0) {
        alert("Please select at least one image.");
        return;
    }

    statusMessage.textContent = "Creating PDF...";
    const { jsPDF } = window.jspdf;

    const selectedPageSize = pageSize.value;
    const selectedOrientation = orientation.value;

    const pdf = new jsPDF(selectedOrientation, "mm", selectedPageSize);

    for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const imageData = await fileToDataURL(file);

        const img = new Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = imageData;
        });

        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;

        let imgWidth = img.width;
        let imgHeight = img.height;

        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

        imgWidth = imgWidth * scale;
        imgHeight = imgHeight * scale;

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        pdf.addImage(img, "JPEG", x, y, imgWidth, imgHeight);
    }

    pdfBlob = pdf.output("blob");
    downloadBtn.disabled = false;
    statusMessage.textContent = "PDF Created Successfully.";
});

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

resetBtn.addEventListener("click", function () {
    imageInput.value = "";
    previewContainer.innerHTML = "";
    selectedImages = [];
    pdfBlob = null;
    downloadBtn.disabled = true;
    statusMessage.textContent = "Tool Reset Successfully.";
    updatePDFPreviewText();
});