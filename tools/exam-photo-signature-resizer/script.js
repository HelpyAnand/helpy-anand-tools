
/* =========================================
   Exam Photo & Signature Resizer
   Helpy Anand Tools
   Client-side Image Processing
========================================= */

(function () {
  "use strict";

  function formatKB(bytes) {
    return (bytes / 1024).toFixed(2) + " KB";
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load नहीं हो सकी।"));
      };

      image.src = url;
    });
  }

  async function compressImage(canvas, format, targetKB) {
    const targetBytes = targetKB * 1024;

    if (format === "image/png") {
      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, format)
      );

      return blob;
    }

    let low = 0.05;
    let high = 0.95;
    let bestBlob = null;

    for (let i = 0; i < 12; i++) {
      const quality = (low + high) / 2;

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, format, quality)
      );

      if (!blob) break;

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        low = quality;
      } else {
        high = quality;
      }
    }

    if (bestBlob) return bestBlob;

    return new Promise(resolve =>
      canvas.toBlob(resolve, format, 0.05)
    );
  }

  function setupResizer(type) {
    const isPhoto = type === "photo";
    const prefix = isPhoto ? "photo" : "signature";

    const get = id => document.getElementById(prefix + id);

    const input = get("Input");
    const uploadArea = get("UploadArea");
    const browseBtn = get("BrowseBtn");
    const uploadContent = get("UploadContent");
    const editor = get("Editor");
    const preview = get("Preview");
    const fileInfo = get("FileInfo");
    const widthInput = get("Width");
    const heightInput = get("Height");
    const aspectCheckbox = get("AspectRatio");
    const targetInput = get("TargetSize");
    const formatSelect = get("Format");
    const resizeBtn = get("ResizeBtn");
    const resetBtn = get("ResetBtn");
    const status = get("Status");
    const result = get("Result");
    const canvas = get("Canvas");
    const resultInfo = get("ResultInfo");
    const downloadBtn = get("DownloadBtn");

    let originalImage = null;
    let originalFile = null;
    let originalRatio = 1;
    let downloadBlob = null;
    let downloadUrl = null;

    browseBtn.addEventListener("click", () => input.click());

    uploadArea.addEventListener("click", event => {
      if (
        event.target === uploadArea ||
        event.target === uploadContent ||
        event.target.closest(".epsr-upload-content")
      ) {
        if (event.target.closest("button")) return;
        input.click();
      }
    });

    input.addEventListener("change", () => {
      const file = input.files[0];
      if (file) handleFile(file);
    });

    uploadArea.addEventListener("dragover", event => {
      event.preventDefault();
      uploadArea.classList.add("epsr-drag-active");
    });

    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("epsr-drag-active");
    });

    uploadArea.addEventListener("drop", event => {
      event.preventDefault();
      uploadArea.classList.remove("epsr-drag-active");

      const file = event.dataTransfer.files[0];

      if (file) handleFile(file);
    });

    async function handleFile(file) {
      if (!file.type.startsWith("image/") ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("कृपया JPG, PNG या WEBP इमेज चुनें।");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        alert("कृपया 20 MB से छोटी इमेज चुनें।");
        return;
      }

      try {
        originalImage = await loadImage(file);
        originalFile = file;

        originalRatio = originalImage.width / originalImage.height;

        preview.src = URL.createObjectURL(file);

        widthInput.value = originalImage.width;
        heightInput.value = originalImage.height;

        fileInfo.textContent =
          "Original Size: " + formatKB(file.size) +
          " | Dimensions: " +
          originalImage.width + " × " + originalImage.height + " px";

        uploadArea.hidden = true;
        editor.hidden = false;
        result.hidden = true;

        status.textContent = "इमेज सफलतापूर्वक Upload हो गई है।";
        resizeBtn.disabled = false;
        downloadBtn.disabled = true;
        downloadBlob = null;

      } catch (error) {
        status.textContent = error.message;
      }
    }

    widthInput.addEventListener("input", () => {
      if (aspectCheckbox.checked && originalImage) {
        const width = Number(widthInput.value);

        if (width > 0) {
          heightInput.value = Math.round(width / originalRatio);
        }
      }
    });

    heightInput.addEventListener("input", () => {
      if (aspectCheckbox.checked && originalImage) {
        const height = Number(heightInput.value);

        if (height > 0) {
          widthInput.value = Math.round(height * originalRatio);
        }
      }
    });

    resizeBtn.addEventListener("click", async () => {
      if (!originalImage) return;

      const width = Number(widthInput.value);
      const height = Number(heightInput.value);
      const targetKB = Number(targetInput.value);
      const format = formatSelect.value;

      if (!Number.isInteger(width) || !Number.isInteger(height) ||
          width < 1 || height < 1 ||
          width > 10000 || height > 10000) {
        alert("कृपया सही Width और Height दर्ज करें।");
        return;
      }

      if (targetInput.value.trim() &&
          (!Number.isFinite(targetKB) || targetKB <= 0 || targetKB > 10240)) {
        alert("Target KB की सही वैल्यू दर्ज करें।");
        return;
      }

      resizeBtn.disabled = true;
      downloadBtn.disabled = true;
      status.textContent = "इमेज Resize और Compress हो रही है...";

      try {
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.clearRect(0, 0, width, height);

        if (format === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        context.drawImage(originalImage, 0, 0, width, height);

        let blob;

        if (targetInput.value.trim() && format !== "image/png") {
          blob = await compressImage(canvas, format, targetKB);
        } else {
          blob = await new Promise(resolve =>
            canvas.toBlob(resolve, format, 0.92)
          );
        }

        if (!blob) {
          throw new Error("इमेज तैयार नहीं हो सकी।");
        }

        if (downloadUrl) URL.revokeObjectURL(downloadUrl);

        downloadBlob = blob;
        downloadUrl = URL.createObjectURL(blob);

        result.hidden = false;

        const actualKB = blob.size / 1024;

        resultInfo.textContent =
          "Dimensions: " + width + " × " + height +
          " px | File Size: " + formatKB(blob.size);

        if (targetInput.value.trim() &&
            actualKB > targetKB) {
          status.textContent =
            "ध्यान दें: निर्धारित " + targetKB +
            " KB सीमा प्राप्त नहीं हुई। तैयार फाइल " +
            actualKB.toFixed(2) +
            " KB है। इसे Download करने से पहले जाँचें।";
        } else {
          status.textContent = "इमेज सफलतापूर्वक तैयार हो गई है।";
        }

        downloadBtn.disabled = false;

      } catch (error) {
        status.textContent = error.message || "इमेज Resize नहीं हो सकी।";
      } finally {
        resizeBtn.disabled = false;
      }
    });

    downloadBtn.addEventListener("click", () => {
      if (!downloadBlob || !downloadUrl) return;

      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      }[formatSelect.value];

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download =
        (isPhoto ? "exam-photo" : "exam-signature") +
        "-resized." + extension;

      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    resetBtn.addEventListener("click", () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);

      if (preview.src.startsWith("blob:")) {
        URL.revokeObjectURL(preview.src);
      }

      input.value = "";
      preview.removeAttribute("src");

      originalImage = null;
      originalFile = null;
      downloadBlob = null;
      downloadUrl = null;

      editor.hidden = true;
      result.hidden = true;
      uploadArea.hidden = false;

      widthInput.value = "";
      heightInput.value = "";
      targetInput.value = "";

      aspectCheckbox.checked = true;
      formatSelect.value = "image/jpeg";

      fileInfo.textContent = "";
      resultInfo.textContent = "";
      status.textContent = "";

      resizeBtn.disabled = true;
      downloadBtn.disabled = true;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupResizer("photo");
    setupResizer("signature");
  });

})();
