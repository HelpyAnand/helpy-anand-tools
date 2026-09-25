
"use strict";

/* =========================================
   PDF TO WORD CONVERTER
   HELPY ANAND TOOLS
   CLOUDCONVERT API
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const pdfFile =
    document.getElementById("pdfFile");

const uploadBox =
    document.getElementById("uploadBox");

const convertBtn =
    document.getElementById("convertBtn");

const fileInfo =
    document.getElementById("fileInfo");

const progressBox =
    document.getElementById("progressBox");

const progressText =
    document.getElementById("progressText");

const progressFill =
    document.getElementById("progressFill");

const statusMessage =
    document.getElementById("statusMessage");


let selectedFile = null;


/* =========================================
   FILE SELECT
========================================= */

pdfFile.addEventListener(
    "change",
    function () {

        const file =
            pdfFile.files[0];

        if (!file) {
            resetConverter();
            return;
        }

        handleSelectedFile(file);
    }
);


/* =========================================
   HANDLE FILE
========================================= */

function handleSelectedFile(file) {

    statusMessage.textContent = "";

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        selectedFile = null;

        convertBtn.disabled = true;

        fileInfo.textContent =
            "Please select a valid PDF file.";

        return;
    }


    selectedFile = file;


    const fileSize =
        formatFileSize(file.size);


    fileInfo.textContent =
        file.name +
        " • " +
        fileSize;


    convertBtn.disabled = false;


    statusMessage.textContent =
        "PDF ready for conversion.";

}


/* =========================================
   CONVERT BUTTON
========================================= */

convertBtn.addEventListener(
    "click",
    async function () {

        if (!selectedFile) {

            statusMessage.textContent =
                "Please select a PDF first.";

            return;
        }


        try {

            setConvertingState();


            progressText.textContent =
                "Reading PDF...";

            progressFill.style.width =
                "15%";


            const base64 =
                await fileToBase64(
                    selectedFile
                );


            progressText.textContent =
                "Uploading PDF securely...";

            progressFill.style.width =
                "30%";


            const response =
                await fetch(
                    "/api/pdf-to-word",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                fileBase64:
                                    base64,

                                fileName:
                                    selectedFile.name

                            })
                    }
                );


            if (!response.ok) {

                let errorMessage =
                    "PDF conversion failed.";

                try {

                    const errorData =
                        await response.json();

                    if (
                        errorData &&
                        errorData.message
                    ) {
                        errorMessage =
                            errorData.message;
                    }

                } catch (jsonError) {

                    console.error(
                        "Error response parsing failed:",
                        jsonError
                    );

                }


                throw new Error(
                    errorMessage
                );
            }


            progressText.textContent =
                "Conversion completed. Preparing DOCX...";

            progressFill.style.width =
                "85%";


            const blob =
                await response.blob();


            if (!blob || blob.size === 0) {

                throw new Error(
                    "The converted DOCX file is empty."
                );
            }


            downloadDocx(
                blob,
                selectedFile.name
            );


            progressFill.style.width =
                "100%";


            progressText.textContent =
                "Conversion completed successfully!";


            statusMessage.textContent =
                "Your Word file has been downloaded successfully.";


        } catch (error) {

            console.error(
                "PDF to Word Error:",
                error
            );


            progressBox.hidden =
                true;


            statusMessage.textContent =
                error.message ||
                "Something went wrong during conversion.";


        } finally {

            convertBtn.disabled =
                false;

        }

    }
);


/* =========================================
   FILE TO BASE64
========================================= */

function fileToBase64(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not read the PDF file."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


/* =========================================
   DOWNLOAD DOCX
========================================= */

function downloadDocx(
    blob,
    originalFileName
) {

    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        originalFileName.replace(
            /\.pdf$/i,
            ""
        ) +
        ".docx";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


/* =========================================
   CONVERTING STATE
========================================= */

function setConvertingState() {

    convertBtn.disabled =
        true;


    convertBtn.textContent =
        "Converting PDF...";


    progressBox.hidden =
        false;


    progressText.textContent =
        "Preparing conversion...";


    progressFill.style.width =
        "5%";


    statusMessage.textContent =
        "";

}


/* =========================================
   RESET
========================================= */

function resetConverter() {

    selectedFile =
        null;


    convertBtn.disabled =
        true;


    convertBtn.textContent =
        "Convert PDF to Word";


    fileInfo.textContent =
        "No file selected";


    progressBox.hidden =
        true;


    progressFill.style.width =
        "0%";


    progressText.textContent =
        "Preparing conversion...";


    statusMessage.textContent =
        "";

}


/* =========================================
   FILE SIZE
========================================= */

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


/* =========================================
   DRAG & DROP
========================================= */

uploadBox.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadBox.classList.add(
            "drag-over"
        );

    }
);


uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.classList.remove(
            "drag-over"
        );

    }
);


uploadBox.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();


        uploadBox.classList.remove(
            "drag-over"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        handleSelectedFile(file);

    }
);


/* =========================================
   INITIAL STATE
========================================= */

resetConverter();
