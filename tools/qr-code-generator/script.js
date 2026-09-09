const qrText = document.getElementById("qrText");
const qrImage = document.getElementById("qrImage");

let qrGenerated = false;

/* ======================================================
GENERATE QR CODE
====================================================== */

function generateQR() {


const text = qrText.value.trim();

if (text === "") {
    alert("Please enter text or URL.");
    qrText.focus();
    return;
}

qrGenerated = false;

qrImage.style.display = "none";
qrImage.removeAttribute("src");

const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data="
    + encodeURIComponent(text);


qrImage.onload = function () {

    if (qrImage.naturalWidth > 0) {
        qrImage.style.display = "block";
        qrGenerated = true;
    } else {
        qrGenerated = false;
        alert("Unable to generate QR Code. Please try again.");
    }
};


qrImage.onerror = function () {

    qrGenerated = false;
    qrImage.style.display = "none";

    alert(
        "Unable to generate QR Code right now. " +
        "Please check your internet connection and try again."
    );
};


qrImage.src = qrUrl;


}

/* ======================================================
DOWNLOAD QR CODE
====================================================== */

async function downloadQR() {


if (
    !qrGenerated ||
    !qrImage.src ||
    qrImage.naturalWidth === 0
) {
    alert("Generate QR Code first.");
    return;
}

try {

    const response = await fetch(qrImage.src);

    if (!response.ok) {
        throw new Error("QR image download failed.");
    }

    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = "QRCode.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(blobUrl);

} catch (error) {

    console.error("QR download error:", error);

    alert(
        "The QR Code could not be downloaded automatically. " +
        "Please right-click the QR Code and choose Save Image As."
    );
}


}

/* ======================================================
RESET QR GENERATOR
====================================================== */

function clearQR() {


qrText.value = "";

qrImage.style.display = "none";
qrImage.removeAttribute("src");

qrGenerated = false;

qrText.focus();

}

/* ======================================================
ENTER KEY SUPPORT
====================================================== */

qrText.addEventListener("keydown", function (event) {

if (event.key === "Enter") {

    event.preventDefault();

    generateQR();
}

});
